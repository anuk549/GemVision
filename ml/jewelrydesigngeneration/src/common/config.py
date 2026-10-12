"""
Configuration Management Utility
"""

import os
import yaml
from typing import Dict, Any


def load_yaml(config_path: str) -> Dict[str, Any]:
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Configuration file not found: {config_path}")
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_base_dir() -> str:
    # Returns root repository directory
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
