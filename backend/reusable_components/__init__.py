"""Reusable image-processing components shared by the ML notebook and the API.

Import submodules directly so this package stays lightweight (importing
``reusable_components.gradcam`` pulls in TensorFlow)::

    from reusable_components.image_preprocessing import preprocess_rgb_array
    from reusable_components.gem_mask import detect_gem_mask
    from reusable_components.gradcam import make_gradcam_heatmap
"""
