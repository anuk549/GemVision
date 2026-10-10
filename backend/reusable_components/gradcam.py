"""Grad-CAM utilities for the sapphire defect classifier.

The saved Keras models wrap an ImageNet backbone behind a
``preprocess_input`` op and a training-only augmentation block.  To compute a
faithful Grad-CAM we rebuild the forward pass starting at the backbone input
(so augmentation layers are bypassed) and apply the matching
``preprocess_input`` manually.
"""

from __future__ import annotations

from collections.abc import Callable

import cv2
import numpy as np
import tensorflow as tf


def preprocess_for_model(base_model_name: str) -> Callable[[np.ndarray], np.ndarray]:
    """Return the ``preprocess_input`` matching a backbone name."""
    name = base_model_name.lower()
    if "mobilenet" in name:
        return tf.keras.applications.mobilenet_v2.preprocess_input
    if "efficientnet" in name:
        return tf.keras.applications.efficientnet_v2.preprocess_input
    raise ValueError(f"No preprocess_input found for backbone '{base_model_name}'")


def resolve_base_model(model: tf.keras.Model) -> tf.keras.Model:
    """Return the ImageNet backbone (4D output, excluding augmentation)."""
    for layer in model.layers:
        if (
            isinstance(layer, tf.keras.Model)
            and "augmentation" not in layer.name
            and len(getattr(layer, "output_shape", ())) == 4
        ):
            return layer
    raise ValueError("Could not locate the backbone model inside the classifier")


def find_last_conv_layer(base_model: tf.keras.Model) -> str:
    """Name of the last spatial Conv2D layer inside ``base_model``."""
    convs = [layer.name for layer in base_model.layers if "Conv" in type(layer).__name__]
    if convs:
        return convs[-1]
    if base_model.layers:
        return base_model.layers[-1].name
    raise ValueError("Backbone has no layers to attach Grad-CAM to")


def make_gradcam_heatmap(
    img_array: np.ndarray,
    model: tf.keras.Model,
    base_model: tf.keras.Model,
    last_conv_layer_name: str,
    pred_index: int | None = None,
    preprocess_fn: Callable[[np.ndarray], np.ndarray] | None = None,
) -> np.ndarray:
    """Compute a Grad-CAM heatmap normalized to ``[0, 1]``.

    ``img_array`` is a ``(1, H, W, 3)`` float array in ``[0, 255]``.
    """
    if preprocess_fn is None:
        preprocess_fn = preprocess_for_model(base_model.name)

    conv_layer = base_model.get_layer(last_conv_layer_name)
    preprocessed = preprocess_fn(img_array.copy())

    classifier_layers = []
    capture = False
    for layer in model.layers:
        if layer is base_model or getattr(layer, "name", "") == base_model.name:
            capture = True
            continue
        if capture:
            classifier_layers.append(layer)

    x = base_model.output
    for layer in classifier_layers:
        x = layer(x, training=False)

    grad_model = tf.keras.Model(inputs=base_model.input, outputs=[conv_layer.output, x])

    with tf.GradientTape() as tape:
        conv_out, predictions = grad_model(preprocessed, training=False)
        if pred_index is None:
            pred_index = int(tf.argmax(predictions[0]))
        loss = predictions[0, pred_index]

    grads = tape.gradient(loss, conv_out)
    weights = tf.reduce_mean(grads[0], axis=(0, 1))
    cam = tf.einsum("hwc,c->hw", conv_out[0], weights)
    cam = tf.maximum(cam, 0)
    cam = cam / (tf.math.reduce_max(cam) + 1e-8)
    return cam.numpy()


def overlay_heatmap(
    rgb_image: np.ndarray,
    heatmap: np.ndarray,
    mask: np.ndarray | None = None,
    alpha: float = 0.45,
) -> np.ndarray:
    """Blend a heatmap over an RGB image and return a uint8 RGB overlay.

    ``mask`` (uint8 ``0/255``, same ``H x W``) restricts the overlay to the gem.
    """
    rgb_image = np.asarray(rgb_image, dtype=np.uint8)
    h, w = rgb_image.shape[:2]

    heat = np.asarray(heatmap, dtype=np.float32)
    heat = cv2.resize(heat, (w, h), interpolation=cv2.INTER_LINEAR)
    if heat.max() > 0:
        heat = heat / heat.max()

    if mask is not None:
        gem = cv2.resize(np.asarray(mask, dtype=np.uint8), (w, h), interpolation=cv2.INTER_NEAREST)
        heat = heat * (gem > 127).astype(np.float32)

    heat_uint8 = np.uint8(np.clip(heat, 0, 1) * 255)
    colored = cv2.applyColorMap(heat_uint8, cv2.COLORMAP_JET)
    colored = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)

    overlay = (rgb_image.astype(np.float32) * (1 - alpha)) + (colored.astype(np.float32) * alpha)
    return np.clip(overlay, 0, 255).astype(np.uint8)
