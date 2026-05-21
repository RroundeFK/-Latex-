import cv2
import numpy as np
import os
import warnings

warnings.filterwarnings("ignore", category=UserWarning, module="numpy")
warnings.filterwarnings("ignore", category=UserWarning, module="cv2")


def optimized_swt(image_path):
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"图像文件不存在：{image_path}")

    # 1. 读取原二值化图像（你的图是：文字浅、背景白）
    binary = cv2.imread(image_path, 0)
    if binary is None:
        raise ValueError(f"无法读取图像：{image_path}")

    # 2. 反转图像（转为：文字黑、背景白 → 便于处理）
    binary_inverted = 255 - binary  # 文字变深，背景保持白

    # 3. 提取文字区域（反转后，文字是黑色<127，背景是白色>127）
    text_mask = (binary_inverted < 127).astype(np.uint8) * 255  # 文字区域标记为255
    background_mask = 255 - text_mask  # 背景区域标记为0

    # 4. 边缘检测（针对反转后的文字区域）
    edges = cv2.Canny(text_mask, 30, 100)  # 敏感边缘检测，捕捉浅文字边缘
    height, width = edges.shape
    swt_map = np.zeros_like(edges, dtype=np.float32)
    visited = np.zeros_like(edges, dtype=bool)

    # 5. 梯度计算（仅文字区域）
    grad_x = cv2.Sobel(text_mask, cv2.CV_64F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(text_mask, cv2.CV_64F, 0, 1, ksize=3)
    grad_dir = np.arctan2(grad_y, grad_x)

    # 6. 遍历文字边缘，计算笔画宽度
    edge_pixels = np.argwhere(edges > 0)
    for (y, x) in edge_pixels:
        if visited[y, x] or text_mask[y, x] == 0:
            continue

        dir_x = np.round(np.cos(grad_dir[y, x])).astype(int)
        dir_y = np.round(np.sin(grad_dir[y, x])).astype(int)
        if dir_x == 0 and dir_y == 0:
            dir_x = 1

        current_x, current_y = x, y
        stroke_width = 0
        while stroke_width < 60:
            current_x += dir_x
            current_y += dir_y
            stroke_width += 1

            if current_x < 0 or current_x >= width or current_y < 0 or current_y >= height:
                break

            if text_mask[current_y, current_x] > 0 and edges[current_y, current_x] > 0 and not visited[
                current_y, current_x]:
                swt_map[y, x] = stroke_width
                swt_map[current_y, current_x] = stroke_width
                visited[y, x] = True
                visited[current_y, current_x] = True
                break

    # 7. 核心：增强文字亮度（反转回原背景+提亮文字）
    # 文字区域 = SWT宽度×10（大幅提亮），背景保持白色
    swt_enhanced = np.ones_like(binary, dtype=np.float32) * 255  # 背景设为白色
    swt_enhanced[text_mask > 0] = swt_map[text_mask > 0] * 10  # 文字区域大幅提亮
    swt_enhanced = np.clip(swt_enhanced, 0, 255)  # 限制在0-255

    # 新增：反转图像 → 白底浅字 变为 白底黑字
    swt_enhanced = 255 - swt_enhanced  # 关键修改：反转像素值

    # 8. 最终转换为8位图像
    swt_normalized = swt_enhanced.astype(np.uint8)
    return swt_normalized



# 批量处理主程序
if __name__ == "__main__":
    input_dir = r"SWT/image_0"
    output_dir = r"SWT/image_1"
    os.makedirs(output_dir, exist_ok=True)

    supported_formats = (".png", ".jpg", ".jpeg", ".bmp", ".tiff")
    image_files = [f for f in os.listdir(input_dir) if f.lower().endswith(supported_formats)]

    if not image_files:
        print(f"警告：输入文件夹 {input_dir} 无图片！")
    else:
        print(f"找到 {len(image_files)} 张图，开始处理...")

    for idx, img_name in enumerate(image_files):
        try:
            input_path = os.path.join(input_dir, img_name)
            output_path = os.path.join(output_dir, img_name)
            swt_result = optimized_swt(input_path)
            cv2.imwrite(output_path, swt_result)
            print(f"[{idx + 1}/{len(image_files)}] 处理完成：{img_name}")
        except Exception as e:
            print(f"[{idx + 1}/{len(image_files)}] 处理失败 {img_name}：{e}")

    print("\n结果保存到：", output_dir)