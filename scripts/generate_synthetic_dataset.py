"""Generate a small synthetic dataset for gem pattern recommendation training."""

from __future__ import annotations

import argparse
import random
from pathlib import Path

from PIL import Image, ImageDraw

GEM_TYPES = {
    "sapphire": (40, 80, 180),
    "ruby": (180, 40, 60),
    "emerald": (40, 150, 80),
    "amethyst": (130, 60, 160),
}

STATES = ("rough", "faceted")


def _background(rng: random.Random) -> tuple[int, int, int]:
    return (rng.randint(20, 235), rng.randint(20, 235), rng.randint(20, 235))


def _rough_shape(draw: ImageDraw.ImageDraw, center, radius, color, rng):
    points = []
    for i in range(rng.randint(7, 12)):
        angle = 2 * 3.14159 * i / 10
        r = radius * rng.uniform(0.7, 1.1)
        points.append((center[0] + r * __import__("math").cos(angle),
                      center[1] + r * __import__("math").sin(angle)))
    draw.polygon(points, fill=color, outline=(20, 20, 20))


def _faceted_shape(draw: ImageDraw.ImageDraw, center, radius, color, rng):
    import math
    n = rng.choice((6, 8))
    points = []
    for i in range(n):
        angle = 2 * math.pi * i / n
        points.append((center[0] + radius * math.cos(angle),
                      center[1] + radius * math.sin(angle)))
    draw.polygon(points, fill=color, outline=(20, 20, 20))
    # facet lines
    for i in range(n):
        a0 = 2 * math.pi * i / n
        a1 = 2 * math.pi * ((i + 0.5) % n) / n
        draw.line(
            (
                center[0] + 0.55 * radius * math.cos(a0),
                center[1] + 0.55 * radius * math.sin(a0),
                center[0] + 0.95 * radius * math.cos(a1),
                center[1] + 0.95 * radius * math.sin(a1),
            ),
            fill=(230, 230, 230),
            width=1,
        )


def generate(output_dir: Path, count: int, seed: int = 42) -> None:
    rng = random.Random(seed)
    for state in STATES:
        for gem_type, base_color in GEM_TYPES.items():
            target = output_dir / state / gem_type
            target.mkdir(parents=True, exist_ok=True)
            for i in range(count):
                image = Image.new("RGB", (224, 224), _background(rng))
                draw = ImageDraw.Draw(image)
                center = (112 + rng.randint(-8, 8), 112 + rng.randint(-8, 8))
                radius = rng.randint(60, 85)
                color = tuple(max(0, min(255, c + rng.randint(-25, 25))) for c in base_color)
                if state == "rough":
                    _rough_shape(draw, center, radius, color, rng)
                else:
                    _faceted_shape(draw, center, radius, color, rng)
                image.save(target / f"{gem_type}_{state}_{i:03d}.jpg", quality=90)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("dataset"))
    parser.add_argument("--count", type=int, default=16)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    generate(args.output, args.count, args.seed)
    print(f"Generated synthetic dataset under {args.output}")


if __name__ == "__main__":
    main()
