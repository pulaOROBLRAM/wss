import os
data_dir = 'app/datasets/first/train'
classes = sorted(os.listdir(data_dir))
for idx, cls in enumerate(classes):
    print(idx, cls)
