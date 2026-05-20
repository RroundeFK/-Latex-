import cv2
import numpy as np
from ultralytics import YOLO
from pathlib import Path
import os
import json
from datetime import datetime
import shutil
from PIL import Image, ImageDraw, ImageFont
import matplotlib.pyplot as plt
import matplotlib
import re
from pix2tex.cli import LatexOCR
import sys
import traceback

matplotlib.use('Agg')  # 非GUI模式
import time
from io import BytesIO


class FormulaDetector:
    def __init__(self, model_path='models/best.pt'):
        """初始化模型"""
        """初始化模型"""
        self.model_path = Path(model_path)

        # 检查模型文件是否存在
        if not self.model_path.exists():
            # 尝试使用相对路径
            if not os.path.isabs(model_path):
                current_dir = Path.cwd()
                full_path = current_dir / model_path
                if full_path.exists():
                    self.model_path = full_path
                else:
                    raise FileNotFoundError(f"模型文件不存在: {model_path}")
            else:
                raise FileNotFoundError(f"模型文件不存在: {model_path}")

        print(f"正在从 {self.model_path} 加载公式检测模型...")
        self.detection_model = YOLO(str(self.model_path))
        print("公式检测模型加载完成!")

        # 加载pix2tex模型
        print("正在加载pix2tex模型...")
        try:
            self.latex_ocr_model = LatexOCR()
            print("pix2tex模型加载成功!")
            self.use_pix2tex = True
        except Exception as e:
            print(f"pix2tex模型加载失败: {str(e)}")
            print("将无法进行LaTeX公式识别!")
            self.use_pix2tex = False

        # 预处理参数（从haubu_fuzhi_test.py提取）
        self.NOISE_MEAN = 255  # 噪声均值（白色基底，设为255）
        self.NOISE_STD = 40  # 噪声标准差（可调，建议1-50，值越大雪花点越明显）
        self.CANVAS_HEIGHT = 622
        self.CANVAS_WIDTH = 2052

        # YOLO推理参数（从TEST.py提取）
        self.IMGSZ = (640, 2048)
        self.CONF = 0.2
        self.IOU = 0.45

        # 创建结果目录
        self.base_results_dir = Path('static/results')
        self.base_results_dir.mkdir(parents=True, exist_ok=True)

    def haubu_fuzhi_preprocess(self, img):
        """
        对单张图片进行haubu_fuzhi_test.py的预处理
        完全按照haubu_fuzhi_test.py的逻辑
        """
        # ========== 生成高斯噪声画布 ==========
        noise = np.random.normal(self.NOISE_MEAN, self.NOISE_STD,
                                 (self.CANVAS_HEIGHT, self.CANVAS_WIDTH, 3))
        noise = np.clip(noise, 0, 255)
        canvas = noise.astype(np.uint8)

        # ========== 计算图片居中的偏移量 ==========
        img_h, img_w = img.shape[:2]
        offset_x = (self.CANVAS_WIDTH - img_w) // 2  # 水平居中偏移
        offset_y = (self.CANVAS_HEIGHT - img_h) // 2  # 垂直居中偏移

        # ========== 上下重复填充图片（完全按照haubu_fuzhi_test.py的逻辑）==========
        canvas_h, canvas_w = canvas.shape[:2]

        # 1. 先绘制居中的原始图片（基础层）
        center_canvas_y1 = max(0, offset_y)
        center_canvas_y2 = min(canvas_h, offset_y + img_h)
        center_canvas_x1 = max(0, offset_x)
        center_canvas_x2 = min(canvas_w, offset_x + img_w)

        center_img_y1 = max(0, -offset_y)
        center_img_y2 = center_img_y1 + (center_canvas_y2 - center_canvas_y1)
        center_img_x1 = max(0, -offset_x)
        center_img_x2 = center_img_x1 + (center_canvas_x2 - center_canvas_x1)

        canvas[center_canvas_y1:center_canvas_y2, center_canvas_x1:center_canvas_x2] = \
            img[center_img_y1:center_img_y2, center_img_x1:center_img_x2]

        # 2. 向上重复填充图片（从居中图片顶部往上）
        current_y = offset_y - img_h  # 上一张图片的起始y坐标
        while current_y >= 0:
            canvas_y1 = current_y
            canvas_y2 = min(current_y + img_h, canvas_h)
            canvas_x1 = max(0, offset_x)
            canvas_x2 = min(canvas_w, offset_x + img_w)

            img_y1 = 0
            img_y2 = canvas_y2 - canvas_y1
            img_x1 = max(0, -offset_x)
            img_x2 = img_x1 + (canvas_x2 - canvas_x1)

            canvas[canvas_y1:canvas_y2, canvas_x1:canvas_x2] = img[img_y1:img_y2, img_x1:img_x2]
            current_y -= img_h

        # 3. 向下重复填充图片（从居中图片底部往下）
        current_y = offset_y + img_h  # 下一张图片的起始y坐标
        while current_y < canvas_h:
            canvas_y1 = current_y
            canvas_y2 = min(current_y + img_h, canvas_h)
            canvas_x1 = max(0, offset_x)
            canvas_x2 = min(canvas_w, offset_x + img_w)

            img_y1 = 0
            img_y2 = canvas_y2 - canvas_y1
            img_x1 = max(0, -offset_x)
            img_x2 = img_x1 + (canvas_x2 - canvas_x1)

            canvas[canvas_y1:canvas_y2, canvas_x1:canvas_x2] = img[img_y1:img_y2, img_x1:img_x2]
            current_y += img_h

        return canvas, offset_x, offset_y, img_w, img_h

    def yolo_inference_and_crop(self, image_path, output_dir, offset_x=0, offset_y=0, original_img_w=0,
                                original_img_h=0):
        """
        执行YOLO推理并裁剪检测到的区域
        完全按照TEST.py的逻辑，包括偏移量处理
        """
        image_path = Path(image_path)
        output_dir = Path(output_dir)

        # 读取预处理后的图片
        img = cv2.imread(str(image_path))
        if img is None:
            raise ValueError(f"无法读取图片: {image_path}")

        img_h, img_w = img.shape[:2]

        # 执行YOLO推理（完全按照TEST.py的参数）
        results = self.detection_model.predict(
            source=str(image_path),
            imgsz=self.IMGSZ,
            conf=self.CONF,
            iou=self.IOU,
            save=True,  # 保存带检测框的图片
            save_txt=True,  # 保存检测结果的txt文件
            project=str(output_dir),
            name='test_results',
            exist_ok=True,
            show_labels=True,
            show_conf=True
        )

        result = results[0]
        boxes = result.boxes

        cropped_images = []

        # 创建一个用于绘制检测框的副本（保持原图不变）
        img_with_boxes = img.copy()

        if boxes is not None and len(boxes) > 0:
            # 如果有偏移量信息，只处理原始图片区域的检测框（完全按照TEST.py的逻辑）
            if offset_x != 0 or offset_y != 0 or original_img_w != 0 or original_img_h != 0:
                # 定义原始图片区域
                original_x1 = offset_x
                original_y1 = offset_y
                original_x2 = offset_x + original_img_w
                original_y2 = offset_y + original_img_h

                print(f"原始图片区域: ({original_x1}, {original_y1}) - ({original_x2}, {original_y2})")

                # 只处理位于原始图片区域的检测框
                original_boxes = []
                for box in boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                    box_center_x = (x1 + x2) // 2
                    box_center_y = (y1 + y2) // 2

                    # 检查检测框中心是否在原始图片区域内（完全按照TEST.py的逻辑）
                    if (original_x1 <= box_center_x <= original_x2 and
                            original_y1 <= box_center_y <= original_y2):
                        original_boxes.append(box)

                boxes_to_process = original_boxes
            else:
                # 如果没有偏移量信息，处理所有检测框
                boxes_to_process = boxes

            # 处理检测框
            processed_count = 0
            for box_idx, box in enumerate(boxes_to_process):
                # 获取检测框坐标（xyxy格式：x1, y1, x2, y2）
                x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())

                # 确保坐标在图片范围内（防止越界）
                x1 = max(0, x1)
                y1 = max(0, y1)
                x2 = min(img_w, x2)
                y2 = min(img_h, y2)

                # 在带检测框的图片上绘制红色矩形
                color = (0, 0, 255)  # BGR格式的红色
                thickness = 3
                cv2.rectangle(img_with_boxes, (x1, y1), (x2, y2), color, thickness)

                # 添加标签
                class_id = int(box.cls[0])
                conf = float(box.conf[0])
                class_name = self.detection_model.names.get(class_id, f"class_{class_id}")
                label = f"{class_name}: {conf:.2f}"

                # 标签背景
                font = cv2.FONT_HERSHEY_SIMPLEX
                font_scale = 0.6
                (label_width, label_height), baseline = cv2.getTextSize(label, font, font_scale, 1)

                # 绘制标签背景
                cv2.rectangle(img_with_boxes,
                              (x1, y1 - label_height - 10),
                              (x1 + label_width, y1),
                              color, -1)

                # 绘制标签文本
                cv2.putText(img_with_boxes, label,
                            (x1, y1 - 5), font, font_scale,
                            (255, 255, 255), 1)

                # 裁剪目标区域
                cropped_img = img[y1:y2, x1:x2]

                if cropped_img.size > 0:  # 确保裁剪区域有效
                    # 生成裁剪文件名称（完全按照TEST.py的格式）
                    # 根据是否有偏移量信息使用不同的命名
                    if offset_x != 0 or offset_y != 0 or original_img_w != 0 or original_img_h != 0:
                        crop_filename = f"{image_path.stem}_original_{box_idx + 1}_{class_name}_{conf:.2f}.jpg"
                    else:
                        crop_filename = f"{image_path.stem}_{box_idx + 1}_{class_name}_{conf:.2f}.jpg"

                    crop_path = output_dir / 'cropped_objects' / crop_filename
                    crop_path.parent.mkdir(parents=True, exist_ok=True)

                    # 保存裁剪后的图片
                    cv2.imwrite(str(crop_path), cropped_img)

                    cropped_images.append({
                        'path': crop_path,
                        'bbox': [x1, y1, x2, y2],
                        'confidence': conf,
                        'class_name': class_name,
                        'crop_filename': crop_filename
                    })

                    processed_count += 1

            box_count = processed_count
        else:
            box_count = 0

        # 保存带红色检测框的图片
        detection_result_path = output_dir / 'test_results' / f"{image_path.stem}.jpg"
        detection_result_path.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(detection_result_path), img_with_boxes)

        print(f"检测到 {box_count} 个目标，已保存到 {output_dir / 'cropped_objects'}")
        return cropped_images, detection_result_path

    def clean_latex_code(self, latex_str):
        """
        清洗LaTeX代码
        完全按照3.py的逻辑
        """
        if not latex_str or not isinstance(latex_str, str):
            return latex_str if latex_str else ""

        # 修复三角函数字母间空格
        trig_space_fix = {
            r's\s*i\s*n': 'sin',
            r'c\s*o\s*s': 'cos',
            r't\s*a\s*n': 'tan',
            r'c\s*o\s*t': 'cot'
        }

        for pat, rep in trig_space_fix.items():
            latex_str = re.sub(pat, rep, latex_str, flags=re.UNICODE)

        # 删除三角函数后误加的!
        trig_exclaim = r'(sin|cos|tan|cot)!(?=[0-9])'
        latex_str = re.sub(trig_exclaim, r'\1', latex_str)

        # 隔离\cdot
        latex_str = latex_str.replace(r'\cdot', '__DOT__')

        # 删除其他纯字母间空格
        letter_only_space = r'(?<=[A-Za-z])\s+(?=[A-Za-z])'
        latex_str = re.sub(letter_only_space, '', latex_str, flags=re.UNICODE)

        # 恢复\cdot
        latex_str = latex_str.replace('__DOT__', r'\cdot')

        return latex_str

    def image_to_latex_pix2tex(self, image_path):
        """
        使用pix2tex将公式图片转换为LaTeX代码
        完全按照1.py的逻辑（但针对单张图片）
        """
        if not self.use_pix2tex:
            print("pix2tex模型未加载，无法进行LaTeX识别")
            return ""

        try:
            # 使用PIL打开图片（完全按照1.py的方法）
            with Image.open(image_path) as img:
                latex_code = self.latex_ocr_model(img)

            # 清洗LaTeX代码（使用3.py的方法）
            cleaned_latex = self.clean_latex_code(latex_code)

            if cleaned_latex:
                print(f"识别成功: {cleaned_latex[:50]}...")
            else:
                print("识别结果为空")

            return cleaned_latex

        except Exception as e:
            print(f"pix2tex识别失败: {str(e)}")
            traceback.print_exc()
            return ""

    def process_image_complete_pipeline(self, image_path, output_dir):
        """
        完整的处理流程：
        1. haubu_fuzhi_test.py预处理（完全按照其逻辑）
        2. TEST.py YOLO推理和裁剪（完全按照其逻辑）
        3. pix2tex识别（完全按照1.py的逻辑）
        """
        # 确保路径是Path对象
        image_path = Path(image_path)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        print(f"\n{'=' * 60}")
        print(f"开始处理图片: {image_path.name}")
        print(f"{'=' * 60}")

        # ========== 步骤1: haubu_fuzhi_test.py预处理 ==========
        print("\n步骤1: 执行haubu_fuzhi_test.py预处理...")
        original_img = cv2.imread(str(image_path))
        if original_img is None:
            raise ValueError(f"无法读取图片: {image_path}")

        # 完全按照haubu_fuzhi_test.py的逻辑进行预处理
        preprocessed_img, offset_x, offset_y, original_img_w, original_img_h = self.haubu_fuzhi_preprocess(original_img)

        # 保存预处理后的图片
        preprocessed_path = output_dir / f"{image_path.stem}_preprocessed.jpg"
        cv2.imwrite(str(preprocessed_path), preprocessed_img)

        # 保存偏移量信息到JSON文件（完全按照haubu_fuzhi_test.py的逻辑）
        offset_info = {
            image_path.name: {
                'offset_x': offset_x,
                'offset_y': offset_y,
                'img_w': original_img_w,
                'img_h': original_img_h
            }
        }

        offset_file = output_dir / "offset_info.json"
        with open(offset_file, 'w', encoding='utf-8') as f:
            json.dump(offset_info, f, ensure_ascii=False, indent=2)

        print(f"预处理完成，保存到: {preprocessed_path}")
        print(
            f"图片尺寸({original_img_w}×{original_img_h})，画布尺寸({self.CANVAS_WIDTH}×{self.CANVAS_HEIGHT})，居中偏移量({offset_x}, {offset_y})")

        # ========== 步骤2: TEST.py YOLO推理和裁剪 ==========
        print("\n步骤2: 执行TEST.py YOLO推理和裁剪...")
        cropped_objects_dir = output_dir / 'cropped_objects'
        cropped_objects_dir.mkdir(exist_ok=True)

        # 完全按照TEST.py的逻辑进行推理和裁剪，包括偏移量处理
        cropped_info, detection_result_path = self.yolo_inference_and_crop(
            preprocessed_path, output_dir, offset_x, offset_y, original_img_w, original_img_h
        )
        print(f"带红框的检测结果图保存到: {detection_result_path}")

        # ========== 步骤3: pix2tex识别 ==========
        print("\n步骤3: 执行pix2tex识别...")
        latex_results = []

        for info in cropped_info:
            img_file = info['path']
            print(f"识别图片: {img_file.name}")
            latex_code = self.image_to_latex_pix2tex(img_file)

            latex_results.append({
                'crop_info': info,
                'latex_formula': latex_code if latex_code else ''  # 如果没有识别到，则为空字符串
            })

        # ========== 步骤4: 格式转换和保存 ==========
        print("\n步骤4: 执行格式转换和保存...")

        # 准备TXT文件内容
        txt_lines = []
        json_data = {}

        for i, item in enumerate(latex_results):
            latex_formula = item['latex_formula']
            if not latex_formula:  # 跳过识别失败的
                continue

            crop_info = item['crop_info']
            crop_filename = crop_info.get('crop_filename', f'crop_{i + 1}')

            # 提取核心文件名（去掉后缀）
            core_filename = Path(crop_filename).stem

            txt_lines.append(f"【成功】文件名：{crop_filename}")
            txt_lines.append(f"图片路径：cropped_objects/{crop_filename}")
            txt_lines.append(f"LaTeX代码：{latex_formula}")
            txt_lines.append("")  # 空行分隔

            # 构建JSON数据
            if core_filename not in json_data:
                json_data[core_filename] = []
            json_data[core_filename].append(latex_formula)

        # 保存TXT文件
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        txt_file = output_dir / f"latex_recognition_results_{timestamp}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(txt_lines))

        print(f"TXT结果保存到: {txt_file}")

        # 保存JSON文件
        json_file = output_dir / "filename_latex_from_txt.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, ensure_ascii=False, indent=2)

        print(f"JSON结果保存到: {json_file}")

        # ========== 返回结果 ==========
        result = {
            'image_name': image_path.name,
            'preprocessed_image': str(preprocessed_path.relative_to(Path('static/results'))),
            'detection_result_image': str(detection_result_path.relative_to(Path('static/results'))),
            'cropped_count': len(cropped_info),
            'latex_results': latex_results,
            'cropped_info': cropped_info,
            'txt_file': str(txt_file.relative_to(Path('static/results'))),
            'json_file': str(json_file.relative_to(Path('static/results'))),
            'offset_info': offset_info  # 添加偏移量信息
        }

        print(f"\n处理完成: {image_path.name}")
        print(f"检测到 {len(cropped_info)} 个公式")
        print(f"成功识别 {len([r for r in latex_results if r['latex_formula']])} 个LaTeX公式")

        return result

    def predict_single_image(self, image_path, output_dir):
        """
        对单张图片进行完整流程处理
        """
        try:
            # 执行完整流程
            result = self.process_image_complete_pipeline(image_path, output_dir)

            # 构造detections数组（只包含识别成功的）
            detections = []
            detection_idx = 1

            for item in result['latex_results']:
                latex_formula = item['latex_formula']
                if not latex_formula:  # 跳过识别失败的
                    continue

                crop_info = item['crop_info']

                # 为每个检测创建预览图
                latex_preview_path = self._create_latex_preview(
                    latex_formula,
                    Path(output_dir),
                    f"preview_{detection_idx}"
                )

                detections.append({
                    'id': detection_idx,
                    'class': 'formula',
                    'confidence': crop_info.get('confidence', 0.9),
                    'bbox': crop_info.get('bbox', [0, 0, 100, 100]),
                    'crop_path': str(crop_info.get('path', '').relative_to(Path('static/results'))) if crop_info.get(
                        'path') else '',
                    'latex_formula': latex_formula,
                    'latex_preview': str(
                        latex_preview_path.relative_to(Path('static/results'))) if latex_preview_path else None
                })
                detection_idx += 1

            # 读取原始图片获取尺寸
            img = cv2.imread(str(image_path))
            if img is not None:
                img_h, img_w = img.shape[:2]
            else:
                img_w, img_h = 100, 100

            # 计算统计信息
            detection_count = len(detections)
            avg_confidence = np.mean([d['confidence'] for d in detections]) if detections else 0.0

            stats = {
                'image_name': result['image_name'],
                'original_size': [int(img_w), int(img_h)],
                'detection_count': detection_count,
                'average_confidence': float(avg_confidence),
                'total_confidence': float(avg_confidence * detection_count),
                'accuracy': float(avg_confidence * 100),
                'detections': detections,
                'result_image': result['detection_result_image'],  # 使用带红框的检测结果图
                'preprocessed_image': result['preprocessed_image'],
                'latex_txt_file': result['txt_file'],
                'latex_json_file': result['json_file']
            }

            return stats

        except Exception as e:
            print(f"处理图片失败: {str(e)}")
            traceback.print_exc()

            # 返回错误结果
            return {
                'image_name': Path(image_path).name,
                'error': str(e),
                'detection_count': 0,
                'average_confidence': 0.0,
                'accuracy': 0.0,
                'detections': []
            }

    def _create_latex_preview(self, latex_formula, output_dir, filename):
        """创建LaTeX公式预览图片"""
        try:
            # 确保matplotlib可用
            import matplotlib.pyplot as plt

            # 如果公式太长，截断
            if len(latex_formula) > 200:
                display_formula = latex_formula[:197] + "..."
            else:
                display_formula = latex_formula

            # 创建图片 - 更大的尺寸以容纳长公式
            plt.figure(figsize=(12, 2))
            plt.text(0.5, 0.5, f"${display_formula}$", fontsize=16,
                     ha='center', va='center')
            plt.axis('off')

            # 保存图片
            preview_dir = output_dir / 'latex_previews'
            preview_dir.mkdir(parents=True, exist_ok=True)
            preview_path = preview_dir / f"{filename}.png"

            plt.savefig(str(preview_path), bbox_inches='tight', pad_inches=0.1, dpi=100)
            plt.close()

            return preview_path
        except Exception as e:
            print(f"创建LaTeX预览失败: {str(e)}")
            return None

    def create_session(self):
        """创建新的会话目录"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        session_dir = self.base_results_dir / timestamp
        session_dir.mkdir(parents=True, exist_ok=True)
        return session_dir

    def cleanup_old_sessions(self, keep_last_n=10):
        """清理旧的会话目录，只保留最新的n个"""
        sessions = sorted([d for d in self.base_results_dir.iterdir() if d.is_dir()])
        if len(sessions) > keep_last_n:
            for session in sessions[:-keep_last_n]:
                try:
                    shutil.rmtree(session)
                    print(f"清理旧会话: {session.name}")
                except:
                    pass