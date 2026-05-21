import cv2
import os
import numpy as np

# ===================== 配置参数（直接指定输入/输出为同一images目录） =====================
# 输入/输出均为该目录，处理后的图片直接覆盖？→ 若不想覆盖，可注释下方行，取消注释下下行
output_dir = "data/train_laplaciou3998/images"  # 最终结果直接保存到该目录（无额外子目录）
# output_dir = "data/train_laplaciou3998/images_processed"  # 可选：单独目录但无嵌套，避免覆盖原图

input_dir = "data/train_white3998/images"  # 原图目录

# 新增：固定输出图片尺寸（和第二份代码保持一致）
TARGET_HEIGHT = 622
TARGET_WIDTH = 2052

# 二值化参数（适配白底/灰底+黑字）
fixed_threshold = 190
contrast_alpha = 1.5
contrast_beta = -50
# CLAHE参数
clahe_clip_limit = 1.0
clahe_grid_size = (16, 16)
# 形态学参数
open_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
close_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
# 锐化参数
laplacian_kernel = np.array([[0, -1, 0],  [-1, 5, -1], [0, -1, 0]])
# 叠加参数调整：增加锐化图的权重
sharpen_weight = 0.5  # 锐化图占50%，形态学原图占50%

# ===================== 强制创建输出目录（确保存在） =====================
os.makedirs(output_dir, exist_ok=True)
print(f"已确认/创建输出目录：{output_dir}")

# ===================== 查找图片 =====================
image_files = [f for f in os.listdir(input_dir)
               if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff'))]
if not image_files:
    print("原图目录中无图片！")
    exit()

# ===================== 核心函数 =====================
def binary_white_bg_fixed(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray_enhanced = cv2.convertScaleAbs(gray, alpha=contrast_alpha, beta=contrast_beta)
    _, binary = cv2.threshold(gray_enhanced, fixed_threshold, 255, cv2.THRESH_BINARY)
    binary_clean = cv2.morphologyEx(binary, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (1,1)))
    return cv2.cvtColor(binary_clean, cv2.COLOR_GRAY2BGR)

def clahe_white_bg(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=clahe_clip_limit, tileGridSize=clahe_grid_size)
    clahe_gray = clahe.apply(gray)
    return cv2.cvtColor(clahe_gray, cv2.COLOR_GRAY2BGR)

def morphology_post_process(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    open_img = cv2.morphologyEx(gray, cv2.MORPH_OPEN, open_kernel, iterations=1)
    close_img = cv2.morphologyEx(open_img, cv2.MORPH_CLOSE, close_kernel, iterations=1)
    return cv2.cvtColor(close_img, cv2.COLOR_GRAY2BGR)

def laplacian_sharpen(image):
    sharpened = cv2.filter2D(image, -1, laplacian_kernel)
    return sharpened

def blend_images(sharp_img, base_img):
    return cv2.addWeighted(sharp_img, sharpen_weight, base_img, 1 - sharpen_weight, 0)

# ===================== 批量处理（仅保存最终结果到指定images目录） =====================
for i, file in enumerate(image_files):
    # 确保文件名编码正确（Windows下用gbk，Linux/mac用utf-8）
    try:
        file = file.encode('utf-8').decode('gbk')  # 适配Windows中文文件名
    except:
        pass

    img_path = os.path.join(input_dir, file)
    original_img = cv2.imread(img_path)
    if original_img is None:
        print(f"❌ 跳过无法读取的图片：{file}")
        continue

    # 步骤1：二值化
    binary_img = binary_white_bg_fixed(original_img)

    # 步骤2：CLAHE增强
    clahe_img = clahe_white_bg(binary_img)

    # 步骤3：形态学处理
    morph_img = morphology_post_process(clahe_img)

    # 步骤4：拉普拉斯锐化
    sharpen_img = laplacian_sharpen(morph_img)

    # 步骤5：最终叠加
    final_img = blend_images(sharpen_img, morph_img)
    final_save_path = os.path.join(output_dir, file)  # 直接拼接输出目录+原文件名
    cv2.imwrite(final_save_path, final_img)
    print(f"✅ 第{i + 1}张处理完成：{file} → 保存至 {final_save_path}")

# 输出最终结果目录
print(f"\n所有处理后的图片已保存至：{output_dir}（无额外子目录）")