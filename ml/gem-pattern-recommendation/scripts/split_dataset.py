"""Split dataset/{rough,faceted}/<class>/ into train/val/test (70/15/15)."""

from __future__ import annotations

import argparse
import random
import shutil
from pathlib import Path

STATES = ("rough", "faceted")
SPLITS = ("train", "val", "test")
RATIOS = (0.70, 0.15, 0.15)


def split_one(files: list[Path], seed: int) -> dict[str, list[Path]]:
    rng = random.Random(seed)
    files = list(files)
    rng.shuffle(files)
    n = len(files)
    n_train = int(n * RATIOS[0])
    n_val = int(n * RATIOS[1])
    return {
        "train": files[:n_train],
        "val": files[n_train : n_train + n_val],
        "test": files[n_train + n_val :],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=Path("dataset"))
    parser.add_argument("--output", type=Path, default=Path("dataset_split"))
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--clean", action="store_true")
    args = parser.parse_args()

    if args.clean and args.output.exists():
        shutil.rmtree(args.output)

    for state in STATES:
        state_dir = args.source / state
        if not state_dir.exists():
            continue
        for class_dir in sorted(p for p in state_dir.iterdir() if p.is_dir()):
            files = sorted(
                p for p in class_dir.iterdir() if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
            )
            if not files:
                continue
            split = split_one(files, args.seed)
            for split_name, split_files in split.items():
                target = args.output / split_name / state / class_dir.name
                target.mkdir(parents=True, exist_ok=True)
                for src in split_files:
                    shutil.copy2(src, target / src.name)
    print(f"Split dataset into {args.output}")


if __name__ == "__main__":
    main()
