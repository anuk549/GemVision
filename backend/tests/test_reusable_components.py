from __future__ import annotations

import numpy as np
from reusable_components.gem_mask import detect_gem_mask, mask_bounding_box
from reusable_components.image_preprocessing import preprocess_rgb_array


def test_preprocess_shapes_dtype_and_range():
    rng = np.random.default_rng(0)
    image = rng.integers(0, 255, size=(320, 240, 3), dtype=np.uint8)

    processed, mask = preprocess_rgb_array(image, (224, 224))

    assert processed.shape == (224, 224, 3)
    assert processed.dtype == np.float32
    assert float(processed.min()) >= 0.0 and float(processed.max()) <= 255.0
    assert mask.shape == (224, 224)
    assert mask.dtype == np.uint8
    assert set(np.unique(mask)).issubset({0, 255})


def test_preprocess_accepts_float_input():
    image = np.full((128, 128, 3), 200.0, dtype=np.float32)
    processed, mask = preprocess_rgb_array(image, (224, 224))
    assert processed.shape == (224, 224, 3)
    assert mask.shape == (224, 224)


def test_detect_gem_mask_localises_blue_region():
    image = np.zeros((100, 100, 3), dtype=np.uint8)
    image[30:70, 30:70] = (255, 0, 0)  # BGR blue square

    mask = detect_gem_mask(image)
    box = mask_bounding_box(mask)

    assert mask.max() == 255
    assert box is not None
    x_min, y_min, x_max, y_max = box
    # The box should sit around the square (dilated), not span the whole image.
    assert 40 <= (x_min + x_max) / 2 <= 60
    assert 40 <= (y_min + y_max) / 2 <= 60
    assert x_max - x_min < 90 and y_max - y_min < 90
