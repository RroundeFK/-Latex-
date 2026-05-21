import cv2
import os
import numpy as np

# ========== 可调节参数 ==========
# 高斯噪声参数：均值（越接近255越亮）、标准差（越大噪声越明显）
NOISE_MEAN = 255  # 噪声均值（白色基底，设为255）
NOISE_STD = 40  # 噪声标准差（可调，建议1-50，值越大雪花点越明显）
# 画布尺寸
CANVAS_HEIGHT = 622
CANVAS_WIDTH = 2052
# ===============================

# 创建输出目录
train1_dir = "data/test_fuzhi2000/images"
if not os.path.exists(train1_dir):
    os.makedirs(train1_dir)

# 查找源图片文件
image_files = []
train_dir = "data_train/test"  # 你的源图片目录
if os.path.exists(train_dir):
    for file in os.listdir(train_dir):
        if file.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff')):
            image_files.append(file)


def fill_repeat_image(canvas, img, center_offset_x, center_offset_y):
    """
    在画布上居中放置图片后，上下重复填充图片直到填满画布
    :param canvas: 目标画布（噪声画布）
    :param img: 待填充的原始图片
    :param center_offset_x: 图片居中时的水平偏移量
    :param center_offset_y: 图片居中时的垂直偏移量
    :return: 填充后的画布
    """
    canvas_h, canvas_w = canvas.shape[:2]
    img_h, img_w = img.shape[:2]

    # 1. 先绘制居中的原始图片（基础层）
    # 计算居中图片的绘制区域（防越界）
    center_canvas_y1 = max(0, center_offset_y)
    center_canvas_y2 = min(canvas_h, center_offset_y + img_h)
    center_canvas_x1 = max(0, center_offset_x)
    center_canvas_x2 = min(canvas_w, center_offset_x + img_w)
    # 计算图片裁剪区域
    center_img_y1 = max(0, -center_offset_y)
    center_img_y2 = center_img_y1 + (center_canvas_y2 - center_canvas_y1)
    center_img_x1 = max(0, -center_offset_x)
    center_img_x2 = center_img_x1 + (center_canvas_x2 - center_canvas_x1)
    # 绘制居中图片
    canvas[center_canvas_y1:center_canvas_y2, center_canvas_x1:center_canvas_x2] = \
        img[center_img_y1:center_img_y2, center_img_x1:center_img_x2]

    # 2. 向上重复填充图片（从居中图片顶部往上）
    current_y = center_offset_y - img_h  # 上一张图片的起始y坐标
    while current_y >= 0:
        # 计算当前绘制区域（防越界）
        canvas_y1 = current_y
        canvas_y2 = min(current_y + img_h, canvas_h)
        canvas_x1 = max(0, center_offset_x)
        canvas_x2 = min(canvas_w, center_offset_x + img_w)
        # 计算图片裁剪区域
        img_y1 = 0
        img_y2 = canvas_y2 - canvas_y1
        img_x1 = max(0, -center_offset_x)
        img_x2 = img_x1 + (canvas_x2 - canvas_x1)
        # 绘制上侧重复图片
        canvas[canvas_y1:canvas_y2, canvas_x1:canvas_x2] = img[img_y1:img_y2, img_x1:img_x2]
        # 继续向上偏移
        current_y -= img_h

    # 3. 向下重复填充图片（从居中图片底部往下）
    current_y = center_offset_y + img_h  # 下一张图片的起始y坐标
    while current_y < canvas_h:
        # 计算当前绘制区域（防越界）
        canvas_y1 = current_y
        canvas_y2 = min(current_y + img_h, canvas_h)
        canvas_x1 = max(0, center_offset_x)
        canvas_x2 = min(canvas_w, center_offset_x + img_w)
        # 计算图片裁剪区域
        img_y1 = 0
        img_y2 = canvas_y2 - canvas_y1
        img_x1 = max(0, -center_offset_x)
        img_x2 = img_x1 + (canvas_x2 - canvas_x1)
        # 绘制下侧重复图片
        canvas[canvas_y1:canvas_y2, canvas_x1:canvas_x2] = img[img_y1:img_y2, img_x1:img_x2]
        # 继续向下偏移
        current_y += img_h

    return canvas


if image_files:
    # 为每张图片执行操作
    for i, file in enumerate(image_files):
        image_path = os.path.join(train_dir, file)

        # 读取图片
        img = cv2.imread(image_path)

        if img is not None:
            # ========== 生成高斯噪声画布 ==========
            noise = np.random.normal(NOISE_MEAN, NOISE_STD, (CANVAS_HEIGHT, CANVAS_WIDTH, 3))
            noise = np.clip(noise, 0, 255)
            canvas = noise.astype(np.uint8)

            # ========== 计算图片居中的偏移量 ==========
            img_h, img_w = img.shape[:2]
            offset_x = (CANVAS_WIDTH - img_w) // 2  # 水平居中偏移
            offset_y = (CANVAS_HEIGHT - img_h) // 2  # 垂直居中偏移

            # ========== 核心逻辑：上下重复填充图片 ==========
            canvas = fill_repeat_image(canvas, img, offset_x, offset_y)

            # ========== 保存结果 ==========
            output_path = os.path.join(train1_dir, file)
            cv2.imwrite(output_path, canvas)

            print(f"第{i + 1}张图片已处理并保存到 {output_path}")
            print(
                f"  图片尺寸({img_w}×{img_h})，画布尺寸({CANVAS_WIDTH}×{CANVAS_HEIGHT})，居中偏移量({offset_x}, {offset_y})")
        else:
            print(f"无法读取图片: {file}")

    print(f"\n总共处理了 {len(image_files)} 张图片")
    print(f"噪声参数：均值={NOISE_MEAN}，标准差={NOISE_STD}")
else:
    print(f"未找到{train_dir}目录或目录中没有有效的图片文件")