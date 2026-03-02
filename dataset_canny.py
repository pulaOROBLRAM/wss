"""
Canny algorithm.

Requires: pip install scikit-image

Dataset must be prepared with split_dataset.py first.
"""

import argparse
import os
import sys
from typing import List, Tuple

import numpy as np
from PIL import Image

try:
    from skimage import feature
    HAS_SKIMAGE = True
except ImportError:
    HAS_SKIMAGE = False


def canny_edges(
    img: np.ndarray,
    sigma: float = 1.0,
    low_threshold: float = 0.1,
    high_threshold: float = 0.2,
) -> np.ndarray:
    if not HAS_SKIMAGE:
        raise ImportError("scikit-image is required for Canny. Install with: pip install scikit-image")

    if img.ndim == 3:
        gray = np.mean(img, axis=2)
    else:
        gray = img
    gray = gray.astype(np.float64) / 255.0

    edges = feature.canny(
        gray,
        sigma=sigma,
        low_threshold=low_threshold,
        high_threshold=high_threshold,
    )
    return (edges * 255).astype(np.uint8)


def process_image(
    src_path: str,
    dst_path: str,
    sigma: float = 1.0,
    low: float = 0.1,
    high: float = 0.2,
    as_rgb: bool = True,
) -> None:
    img = np.array(Image.open(src_path).convert("RGB"))
    edges = canny_edges(img, sigma=sigma, low_threshold=low, high_threshold=high)
    if as_rgb:
        out = np.stack([edges, edges, edges], axis=-1)
    else:
        out = edges
    Image.fromarray(out).save(dst_path, quality=95)


def collect_images(root: str, subdir: str) -> List[Tuple[str, str]]:
    base = os.path.join(root, subdir)
    if not os.path.isdir(base):
        return []
    pairs = []
    for class_name in sorted(os.listdir(base)):
        class_dir = os.path.join(base, class_name)
        if not os.path.isdir(class_dir):
            continue
        for fname in os.listdir(class_dir):
            path = os.path.join(class_dir, fname)
            if not os.path.isfile(path):
                continue
            ext = os.path.splitext(fname)[1].lower()
            if ext not in (".jpg", ".jpeg", ".png", ".bmp", ".webp"):
                continue
            rel = os.path.join(class_name, fname)
            pairs.append((path, rel))
    return pairs


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert training/test datasets to Canny edge features.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--root",
        type=str,
        default=None,
        help="Dataset root (e.g. ../dataset3/m1_lesion_form). Uses training_config.DATASET_DIR if unset.",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Output root. Default: <root>_edges_canny",
    )
    parser.add_argument(
        "--train-subdir",
        type=str,
        default="a1train",
        help="Training subdirectory name.",
    )
    parser.add_argument(
        "--test-subdir",
        type=str,
        default="a1test",
        help="Test subdirectory name.",
    )
    parser.add_argument(
        "--sigma",
        type=float,
        default=1.0,
        help="Gaussian blur sigma for noise reduction.",
    )
    parser.add_argument(
        "--low",
        type=float,
        default=0.1,
        help="Canny low threshold (0–1).",
    )
    parser.add_argument(
        "--high",
        type=float,
        default=0.2,
        help="Canny high threshold (0–1).",
    )
    parser.add_argument(
        "--grayscale",
        action="store_true",
        help="Save grayscale edge images instead of 3-channel RGB.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be done without writing files.",
    )
    args = parser.parse_args()

    root = args.root
    if root is None:
        try:
            from training_config import DATASET_DIR

            root = DATASET_DIR
            print(f"Using DATASET_DIR from training_config: {root}")
        except ImportError:
            print("Error: --root required when training_config is not available.")
            sys.exit(1)

    root = os.path.abspath(root)
    if not os.path.isdir(root):
        print(f"Error: Not a directory: {root}")
        sys.exit(1)

    output = args.output
    if output is None:
        output = root.rstrip(os.sep) + "_edges_canny"
    output = os.path.abspath(output)

    all_pairs = []
    for subdir in (args.train_subdir, args.test_subdir):
        all_pairs.extend(
            (src, os.path.join(subdir, rel))
            for src, rel in collect_images(root, subdir)
        )

    if not all_pairs:
        print(f"No images found under {root}/{args.train_subdir} or {root}/{args.test_subdir}")
        sys.exit(1)

    print(f"Found {len(all_pairs)} images. Output: {output}")
    print(f"Canny: sigma={args.sigma}, low={args.low}, high={args.high}")

    if args.dry_run:
        for src, rel in all_pairs[:5]:
            print(f"  {src} -> {output}/{rel}")
        if len(all_pairs) > 5:
            print(f"  ... and {len(all_pairs) - 5} more")
        return

    os.makedirs(output, exist_ok=True)
    for i, (src, rel) in enumerate(all_pairs):
        dst = os.path.join(output, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        try:
            process_image(
                src,
                dst,
                sigma=args.sigma,
                low=args.low,
                high=args.high,
                as_rgb=not args.grayscale,
            )
        except Exception as e:
            print(f"Error processing {src}: {e}")
            continue
        if (i + 1) % 100 == 0:
            print(f"Processed {i + 1}/{len(all_pairs)}")

    print(f"Done. Wrote {len(all_pairs)} edge images to {output}")


if __name__ == "__main__":
    main()
