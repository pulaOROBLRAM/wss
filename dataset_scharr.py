"""
Scharr

requires splitting dataset into training/tes

Usage:
  python dataset_to_edges_scharr.py --root ../dataset3/m1_lesion_form --grayscale
"""

import argparse
import os
import sys
from typing import List, Tuple

import numpy as np
import cv2
from PIL import Image


def scharr_edges(img: np.ndarray) -> np.ndarray:
    if img.ndim == 3:
        gray = cv2.cvtColor(img.astype(np.uint8), cv2.COLOR_RGB2GRAY)
    else:
        gray = img.astype(np.uint8)

    gx = cv2.Scharr(gray, cv2.CV_64F, 1, 0)
    gy = cv2.Scharr(gray, cv2.CV_64F, 0, 1)

    magnitude = np.sqrt(gx ** 2 + gy ** 2)

    magnitude = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX)
    return magnitude.astype(np.uint8)


def process_image(src_path: str, dst_path: str, as_rgb: bool = True) -> None:
    img = np.array(Image.open(src_path).convert("RGB"))
    edges = scharr_edges(img)
    if as_rgb:
        out = np.stack([edges, edges, edges], axis=-1)
    else:
        out = edges
    Image.fromarray(out).save(dst_path, quality=95)


def collect_images(root: str, subdir: str) -> List[Tuple[str, str]]:
    base = os.path.join(root, subdir)
    if not os.path.isdir(base):
        return []
    pairs: List[Tuple[str, str]] = []
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
        description="Convert training/test datasets to Scharr edge features.",
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
        help="Output root. Default: <root>_edges_scharr",
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
        output = root.rstrip(os.sep) + "_edges_scharr"
    output = os.path.abspath(output)

    all_pairs: List[Tuple[str, str]] = []
    for subdir in (args.train_subdir, args.test_subdir):
        all_pairs.extend(
            (src, os.path.join(subdir, rel))
            for src, rel in collect_images(root, subdir)
        )

    if not all_pairs:
        print(f"No images found under {root}/{args.train_subdir} or {root}/{args.test_subdir}")
        sys.exit(1)

    print(f"Found {len(all_pairs)} images. Output: {output}")

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
            process_image(src, dst, as_rgb=not args.grayscale)
        except Exception as e:
            print(f"Error processing {src}: {e}")
            continue
        if (i + 1) % 100 == 0:
            print(f"Processed {i + 1}/{len(all_pairs)}")

    print(f"Done. Wrote {len(all_pairs)} edge images to {output}")


if __name__ == "__main__":
    main()

