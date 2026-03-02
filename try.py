import sys
import matplotlib
matplotlib.use('Agg')

import matplotlib.pyplot as plt

age = [5,7,8,7,2,17,2,9,4,11,12,9,6]
speed = [99,86,87,88,111,86,103,87,94,78,77,85,86]

plt.scatter(age, speed)

plt.xlabel("Age")
plt.ylabel("Speed")
plt.title("Age vs Speed")

plt.savefig("scatter_plot.png")   # Save image
plt.close()                       # Optional but recommended
