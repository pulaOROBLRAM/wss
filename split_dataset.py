import os
import argparse
import random
import shutil
from typing import List, Tuple

# Import configuration
try:
    from training_config import DATASET_DIR, TEST_SIZE, SPLIT_SEED
    DEFAULT_ROOT = DATASET_DIR
    DEFAULT_TEST_SIZE = TEST_SIZE
    DEFAULT_SEED = SPLIT_SEED
except ImportError:
    # Fallback defaults if config file doesn't exist
    DEFAULT_ROOT = '../dataset3/m1_lesion_form'
    DEFAULT_TEST_SIZE = 0.2
    DEFAULT_SEED = 42


def list_images(directory: str) -> List[str]:
    return [f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f))]


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def stratified_split(file_names: List[str], test_size: float, seed: int) -> Tuple[List[str], List[str]]:
    random.Random(seed).shuffle(file_names)
    split_index = int(len(file_names) * (1.0 - test_size))
    return file_names[:split_index], file_names[split_index:]


def copy_files(files: List[str], src_dir: str, dst_dir: str) -> None:
    for name in files:
        src = os.path.join(src_dir, name)
        dst = os.path.join(dst_dir, name)
        shutil.copy2(src, dst)


def main() -> None:
    parser = argparse.ArgumentParser(description='Split dataset into train/test per class.')
    parser.add_argument('--root', type=str, default=DEFAULT_ROOT, help='Path to dataset root containing class folders')
    parser.add_argument('--test-size', type=float, default=DEFAULT_TEST_SIZE, help='Proportion for test split')
    parser.add_argument('--seed', type=int, default=DEFAULT_SEED, help='Random seed for shuffling')
    parser.add_argument('--move', action='store_true', help='Move files instead of copying (destructive)')
    parser.add_argument('--force', action='store_true', help='Proceed even if train/test already exist')
    args = parser.parse_args()

    root = os.path.abspath(args.root)
    train_root = os.path.join(root, 'a1train')
    test_root = os.path.join(root, 'a1test')

    # Detect existing structure
    if (os.path.isdir(train_root) or os.path.isdir(test_root)) and not args.force:
        print('Train/test directories already exist. Use --force to proceed anyway.')
        return

    # Identify class directories at root (ignore train/test if present)
    class_dirs = []
    for name in os.listdir(root):
        path = os.path.join(root, name)
        if name.lower() in {'train', 'test'}:
            continue
        if os.path.isdir(path):
            class_dirs.append((name, path))

    if not class_dirs:
        raise RuntimeError('No class folders found at dataset root. Ensure root has subfolders per class.')

    # Prepare output dirs
    for class_name, _ in class_dirs:
        ensure_dir(os.path.join(train_root, class_name))
        ensure_dir(os.path.join(test_root, class_name))

    # Split per class
    op = shutil.move if args.move else shutil.copy2
    total_train = 0
    total_test = 0

    for class_name, src_dir in class_dirs:
        files = list_images(src_dir)
        if not files:
            print(f'Skipping empty class: {class_name}')
            continue
        train_files, test_files = stratified_split(files, args.test_size, args.seed)

        # Copy/move
        for name in train_files:
            op(os.path.join(src_dir, name), os.path.join(train_root, class_name, name))
        for name in test_files:
            op(os.path.join(src_dir, name), os.path.join(test_root, class_name, name))

        total_train += len(train_files)
        total_test += len(test_files)
        print(f"Class '{class_name}': train={len(train_files)} test={len(test_files)} total={len(files)}")

    print(f'Finished. Total train: {total_train}, total test: {total_test}')


if __name__ == '__main__':
    main()


