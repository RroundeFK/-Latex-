# 数学公式识别与LaTeX转换工具
一个能对复杂环境下的数学公式进行识别并转换为Latesx代码的工具（课设项目，转换精准度有提高空间）。  
A tool that can recognize and convert mathematical formulas in complex environments into LaTeX code (course project, with room for improvement in conversion accuracy).

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
![图片[](<img width="1920" height="870" alt="图片" src="https://github.com/user-attachments/assets/af0bcb62-6236-45d7-a1c3-b7aaacbf6037" />)](https://github.com/RroundeFK/-Latex-/blob/main/ImagesForReadme/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260520234150_99_17.png?raw=true)

## 📖使用教程
### 1. 上传图片
点击左上区域“选择图片”，或将图片文件拖拽到左上区域，即可上传待检测图片，本工具支持一次上传多张图片检测（待检测图片文件右侧“❌️”可将其删除，若想清空待检测图片，可点击“清空文件”选项）。

### 2. 检测结果
上传好图片后，点击“开始检测”，等待模型运行结束即可在右上区域输出检测结果，点击结果可以放大查看详细信息并复制或下载Latex代码。
#### ①上传：
<img width="1920" height="913" alt="a2f916e12865bc2848277c848d259ae9" src="https://github.com/user-attachments/assets/04a71ded-46c1-44d4-9041-b08b18dced3d" />  

#### ②检测：
<img width="1918" height="904" alt="a4b0a1cbdeb557f6482850edc6e9c874" src="https://github.com/user-attachments/assets/87eb5852-aba9-43d3-814b-c1889471d24c" />  

#### ③结果：
<img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/c56b19eb-2bfe-4b96-8c97-89bf5a24a9f4" />  

#### ④详情：
<img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/61e40ea5-bee9-44df-8d95-4f4e5116638b" />

### 3. 统计会话摘要
左下“统计摘要”区域，为当次会话中处理的图片数量、检测公式数量、当次会话平均置信度、当次会话识别准确率。
<img width="803" height="386" alt="997f96362ceb7704725172d430ed2fc8" src="https://github.com/user-attachments/assets/37478cbb-eca4-422e-bb99-30c1811ae966" />  

### 4. 历史记录
右下“历史记录”区域，会记录用户提交过的会话记录，点击对应的记录即可恢复当次会话检测结果。
<img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/17c4f51a-6023-4c1b-884a-f40f57790ef9" />  

## 🗂️图片数据处理与模型训练
