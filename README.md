# 数学公式识别与LaTeX转换工具
一个能对复杂环境下的数学公式进行识别并转换为Latesx代码的工具（课设项目，模型精度尚有提高空间，数据来源于2025讯飞开发者大赛）。  
A tool capable of recognizing and converting mathematical formulas in complex environments into LaTeX code (course project, model accuracy has room for improvement, data sourced from the 2025 iFlytek Developer Competition).

## 目录
- [📌 项目简介](#📌-项目简介)
- [🚀 快速开始](#🚀-快速开始)
  - [1. 环境依赖](#1-环境依赖)
  - [2. 运行程序](#2运行程序)
  - [3. 界面展示](#3界面展示)
- [📖 使用教程](#📖使用教程)
  - [1. 上传图片](#1-上传图片)
  - [2. 检测结果](#2-检测结果)
  - [3. 统计会话摘要](#3-统计会话摘要)
  - [4. 历史记录](#4-历史记录)
- [🗂️ 图片数据处理](#🗂️图片数据处理)
  - [阶段 1：笔画宽度变换（SWT）增强文字对比度](#阶段-1笔画宽度变换swt增强文字对比度)
  - [阶段2：图像二值化 + CLAHE增强 + 形态学优化](#阶段-2图像二值化--clahe-增强--形态学优化)
  - [阶段 3：高斯噪声画布填充与图片重复平铺](#阶段-3高斯噪声画布填充与图片重复平铺)
- [🤖 模型训练](#🤖模型训练)
  - [F1-置信度曲线](#1f1-置信度曲线)
  - [精确度-置信度曲线](#2精确度-置信度曲线)
  - [精确度-召回率（PR）曲线](#3精确度-召回率pr曲线)
  - [召回-置信度曲线](#4召回-置信度曲线)
  - [归一化混淆矩阵](#5归一化混淆矩阵confusion-matrix-normalized)
  - [锚框/实例分布热力图](#6锚框实例分布热力图)
  - [数据集分布可视化](#7数据集分布可视化corner-plot)
  - [训练验证损失与指标曲线](#8训练验证损失与核心指标曲线)
  
---
## 📌 项目简介
本项目是一个课程设计，目标是实现一个工具，能够自动识别图片或文档中的数学公式，并将其转换为标准的 LaTeX 代码，便于直接在论文或报告中使用。  
This project is a course design aimed at developing a tool that can automatically recognize mathematical formulas in images or documents, and convert them into standard LaTeX code for direct use in academic papers or reports.

## 🚀 快速开始
### 1. 环境依赖
```bash
# 安装依赖（conda环境下）
conda env create -f environment.yml   #环境所需依赖库很少，也可自行对照import安装
```
### 2.运行程序
```bash
python app.py   #等待模型初始化后，访问http://127.0.0.1即可使用项目工具。
```
### 3.界面展示
<div align="center"><img width="1920" height="870" alt="图片" src="https://github.com/user-attachments/assets/af0bcb62-6236-45d7-a1c3-b7aaacbf6037" /></div>  

## 📖使用教程
### 1. 上传图片
点击左上区域“选择图片”，或将图片文件拖拽到左上区域，即可上传待检测图片，本工具支持一次上传多张图片检测（待检测图片文件右侧“❌️”可将其删除，若想清空待检测图片，可点击“清空文件”选项）。

### 2. 检测结果
上传好图片后，点击“开始检测”，等待模型运行结束即可在右上区域输出检测结果，点击结果可以放大查看详细信息并复制或下载Latex代码。
#### ①上传：
<div align="center"><img width="1920" height="913" alt="a2f916e12865bc2848277c848d259ae9" src="https://github.com/user-attachments/assets/04a71ded-46c1-44d4-9041-b08b18dced3d" /></div>  

#### ②检测：
<div align="center"><img width="1918" height="904" alt="a4b0a1cbdeb557f6482850edc6e9c874" src="https://github.com/user-attachments/assets/87eb5852-aba9-43d3-814b-c1889471d24c" /></div>  

#### ③结果：
<div align="center"><img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/c56b19eb-2bfe-4b96-8c97-89bf5a24a9f4" /></div>  

#### ④详情：
<div align="center"><img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/61e40ea5-bee9-44df-8d95-4f4e5116638b" /></div>  

### 3. 统计会话摘要
左下“统计摘要”区域，为当次会话中处理的图片数量、检测公式数量、当次会话平均置信度、当次会话识别准确率。
<div align="center"><img width="803" height="386" alt="997f96362ceb7704725172d430ed2fc8" src="https://github.com/user-attachments/assets/37478cbb-eca4-422e-bb99-30c1811ae966" /></div>  

### 4. 历史记录
右下“历史记录”区域，会记录用户提交过的会话记录，点击对应的记录即可恢复当次会话检测结果。
<div align="center"><img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/17c4f51a-6023-4c1b-884a-f40f57790ef9" /></div>  

## 🗂️图片数据处理
整体流程为：原始图片 → SWT 文字增强 → 二值化 + CLAHE + 形态学优化 → 高斯噪声画布生成 + 图片重复填充 → 最终预处理图片。
```bash
python Image_SWT.py
python Images_Binarization+CLAHE+Morphological+Laplaciou.py
python Canvas_Gauss_Fill.py
```

### 阶段 1：笔画宽度变换（SWT）增强文字对比度
针对 “白底浅字” 类图片，通过 SWT 算法提取文字区域并增强文字亮度，核心目标是让浅淡文字更清晰。  
#### 流程图：
<div align="center"><img width="672" height="1856" alt="49a6414dfe5194a2c0f12ddf2e8ae11c" src="https://github.com/user-attachments/assets/7b438c11-953c-4d01-aeba-dfdfbe4f74f0" /></div>  

①文件校验：检查输入图片路径是否存在，若不存在则抛出异常；读取二值化灰度图，校验图片是否可正常加载。  
②图像反转：将 “文字浅、背景白” 的原图反转为 “文字黑、背景白”，便于后续文字区域提取。  
③文字区域提取：通过像素阈值（<127）标记文字区域，生成文字 / 背景掩码。  
④边缘检测与梯度计算：对文字掩码执行 Canny 边缘检测，结合 Sobel 算子计算文字区域的梯度方向。   
⑤笔画宽度计算：遍历文字边缘像素，沿梯度方向追踪匹配边缘，计算每个文字像素的笔画宽度，生成 SWT 宽度映射图。   
⑥文字亮度增强：基于 SWT 宽度映射图提亮文字区域（宽度值 ×10），背景保持白色；再次反转图像，恢复 “白底黑字” 样式。   
⑦结果输出：将增强后的图像转换为 8 位灰度图，保存至指定目录。   

### 阶段 2：图像二值化 + CLAHE 增强 + 形态学优化
对 SWT 处理后的图片做进一步画质优化，强化文字边缘、降低背景干扰。  
#### 流程图：
<div align="center"><img width="683" height="1464" alt="image" src="https://github.com/user-attachments/assets/171dda54-55e9-44ae-8322-ab7e3b6aa25a" /></div>    

①参数配置：预设二值化阈值（190）、对比度增强系数（α=1.5，β=-50）、CLAHE 参数（clipLimit=1.0，网格 16×16）、形态学核（1×1 矩形）。  
②二值化处理：  
&nbsp;&nbsp;&nbsp;&nbsp;将图片转为灰度图，通过convertScaleAbs增强对比度；  
&nbsp;&nbsp;&nbsp;&nbsp;固定阈值二值化（>190 设为 255，否则 0），结合开运算（MORPH_OPEN）去除微小噪声。  
③CLAHE 增强：对二值化后的灰度图应用对比度受限的自适应直方图均衡化，提升文字与背景的局部对比度。  
④形态学后处理：依次执行开运算（消除小亮点）、闭运算（填充小暗孔），优化文字边缘完整性。  
⑤结果输出：将优化后的图片保存至指定目录。  

### 阶段 3：高斯噪声画布填充与图片重复平铺  
将优化后的图片放置在自定义尺寸的高斯噪声画布上，通过上下重复平铺填满画布，模拟真实场景的背景噪声与重复纹理。  
#### 流程图：
<div align="center"><img width="652" height="1660" alt="ce15e7bf52f226a28548300425fda368" src="https://github.com/user-attachments/assets/9bc86347-364c-400c-8a0e-e6f82550593d" /></div>  

①参数配置：预设高斯噪声参数（均值 255、标准差 40）、画布尺寸（高 622× 宽 2052）。  
②高斯噪声画布生成：基于正态分布生成指定尺寸的 RGB 噪声画布，像素值限制在 0-255 范围内。  
③图片居中计算：计算输入图片在画布中的水平 / 垂直居中偏移量，确保图片初始居中放置。  
④图片重复填充：  
&nbsp;&nbsp;&nbsp;&nbsp;先将图片居中绘制在噪声画布上；  
&nbsp;&nbsp;&nbsp;&nbsp;向上重复平铺：从居中图片顶部向上，逐次偏移图片高度并绘制，直至画布顶部；  
&nbsp;&nbsp;&nbsp;&nbsp;向下重复平铺：从居中图片底部向下，逐次偏移图片高度并绘制，直至画布底部；
&nbsp;&nbsp;&nbsp;&nbsp;所有绘制过程均做越界校验，避免像素溢出。  
⑤结果输出：将填充后的画布保存为最终预处理图片，输出至指定目录。  

## 🤖模型训练
本次模型训练用了3998张处理后的图片数据（数据示例可查看Data目录）
```bash
python train.py    #运行训练代码（workers、batch等参数可根据电脑性能调整）
```
### 1.F1-Confidence 曲线：
<div align="center"><img width="2250" height="1500" alt="image" src="https://github.com/user-attachments/assets/f9434469-9919-401a-93de-d06f3700e3c9" /></div>  

### 2.Precision-Confidence 曲线：
<div align="center"><img width="2250" height="1500" alt="BoxP_curve" src="https://github.com/user-attachments/assets/37cafd87-bf2e-41d6-8e6d-a63cdcfc861b" /></div>  

### 3.Precision-Recall（PR）曲线：  
<div align="center"><img width="2250" height="1500" alt="BoxPR_curve" src="https://github.com/user-attachments/assets/5f00f3c2-1c17-403c-89b2-fb1a336c9bcd" /></div>  

### 4.Recall-Confidence 曲线：
<div align="center">img width="2250" height="1500" alt="BoxR_curve" src="https://github.com/user-attachments/assets/3e2469ca-407e-4721-8280-7bb943a4a9d6" /></div>  

### 5.归一化混淆矩阵（Confusion Matrix Normalized）：
<div align="center"><img width="3000" height="2250" alt="confusion_matrix_normalized" src="https://github.com/user-attachments/assets/d0f83fcd-be1e-43b9-85b8-b3003a6e0515" /></div>   

### 6.锚框/实例分布热力图：
<div align="center"><img width="1600" height="1600" alt="labels" src="https://github.com/user-attachments/assets/100ab09a-2ab6-4808-ba01-a1d217df0d41" /></div>   

### 7.数据集分布可视化（Corner Plot）：
<div align="center"><img width="2000" height="2000" alt="labels_correlogram" src="https://github.com/user-attachments/assets/b5fb2825-e5ad-480c-a466-422f462c630a" /></div>  

### 8.训练/验证损失与核心指标曲线:
<div align="center"><img width="2400" height="1200" alt="image" src="https://github.com/user-attachments/assets/9b4e33ed-a179-4580-84b5-25c062340bc9" /></div>  

