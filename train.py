from ultralytics import YOLO
import torch
import os

# 禁用OpenMP重复库检查（解决OMP Error #15）
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

def main():
    print("--- 加载模型 ---")
    model = YOLO('yolo11n.pt')

    print("--- 开始训练 ---")
    results = model.train(
        # 核心修正1：imgsz 传单整数，配合 rect=True 实现 640×2048
        imgsz=640,          # 最短边缩到640，rect=True 会保持宽高比→640×2048
        rect=True,          # 开启矩形训练（关键：保持宽高比，不拉伸为正方形）
        # 核心修正2：数据加载优化
        workers=4,          # 改0→4（Windows）/8（Linux），解决IO阻塞
        cache='disk',       # 改True→'disk'，RAM不足时用磁盘缓存，避免缓存失败
        # 核心修正3：关闭无用增强，避免尺寸变形
        augment=False,      # 关闭自动增强（文字类检测无需增强，且避免尺寸混乱）
        mosaic=0.0,         # 关闭mosaic（非正方形图片必关，否则尺寸错乱）
        fliplr=0.0,         # 关闭水平翻转（文字类翻转后无意义）
        hsv_h=0.0, hsv_s=0.0, hsv_v=0.0,  # 关闭颜色增强
        # 其他必要参数
        data='dataset.yaml',
        epochs=50,
        batch=32,            # 640×2048单张占显存≈2GB，batch=2适配8GB显存（避免OOM）
        project='runs/train_laplaciou',
        exist_ok=True,
        device=0 if torch.cuda.is_available() else 'cpu',
        lr0=0.005,          # 适配AdamW优化器的合理学习率（原0.005过高）
        single_cls=True,    # 单类别数据集必开，加速训练
    )

    print("--- 训练完成 ---")
    print(f"训练结果保存在: {results.save_dir}")

if __name__ == '__main__':
    main()



# from ultralytics import YOLO
# import torch
#
#
# def main():
#     # 1. 选择一个模型
#     # 加载官方的预训练权重 yolo11n.pt
#     print("--- 加载模型 ---")
#     model = YOLO('yolo11n.pt')  # 这是一个轻量级模型，适合快速迭代和资源有限的情况
#
#     # 2. 配置训练参数并开始训练
#     print("--- 开始训练 ---")
#
#     # 定义训练图像尺寸
#     # 注意：Ultralytics YOLOv8/11 默认要求 imgsz 是 32 的倍数，以确保模型内部的下采样操作能正确进行。
#     # 2052 和 622 都不是 32 的倍数，因此我们需要调整到最接近的、且大于等于原尺寸的 32 的倍数。
#     # 2052 -> 2048 (32 * 64 = 2048)
#     # 622  -> 640 (32 * 20 = 640)
#     # 这样可以最大限度地保留图像信息。
#     # train_imgsz = 2048
#     # train_img_height = 640
#     imagesz = (640, 2048)
#     # 使用 model.train() 方法启动训练
#     results = model.train(
#         # --- 核心修改点 ---
#         imgsz= imagesz, # 将图像尺寸设置为 (高度, 宽度)
#         # 注意：Ultralytics 的 imgsz 参数在传入元组时，顺序是 (height, width)。
#
#         # --- 其他关键参数 ---
#         data='dataset.yaml',  # 数据集配置文件的路径。这个文件定义了训练/验证集的路径和类别。
#         epochs=10,  # 训练的总轮数。50轮对于初步训练是一个比较合理的数值。
#         batch=4,  # 批次大小。由于图像尺寸变大，显存占用会急剧增加，因此需要减小批次大小。
#         # 如果仍然出现显存不足的错误，可以继续减小到 2 或 1。
#         workers=0,  # 数据加载的工作线程数。根据你的CPU核心数调整。
#         name='formula_detection_v11_50',  # 实验名称，会作为保存结果的文件夹名。
#         # patience=50,  # 早停耐心值。如果验证集的性能在50个epoch内没有提升，训练会自动停止。
#         project='runs/train',  # 训练结果保存的根目录。
#         exist_ok=True,  # 如果存在同名的实验目录，就覆盖它。
#         device=0 if torch.cuda.is_available() else 'cpu',  # 自动检测并使用GPU，如果没有则使用CPU。
#         cache=True,  # 开启图片缓存，加速训练
#         augment=True,
#         # amp=False,           # 如果显存不足，可以关闭混合精度训练
#
#         # # --- 可选的超参数调整 ---
#         lr0=0.005,  # 初始学习率
#         # lrf=0.01,  # 最终学习率因子
#         # momentum=0.937,  # SGD动量
#         # weight_decay=0.0005,  # 权重衰减
#         # warmup_epochs=3.0,  # 预热轮数
#         # warmup_momentum=0.8,  # 预热动量
#         # warmup_bias_lr=0.1,  # 预热偏置学习率
#     )
#
#     print("--- 训练完成 ---")
#     print(f"训练结果保存在: {results.save_dir}")
#
#
# if __name__ == '__main__':
#     main()