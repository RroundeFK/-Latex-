//
// let currentTaskId = null;
// let checkInterval = null;
// let selectedFiles = [];
// let currentResults = null;
// let checkAttempts = 0;
// const MAX_CHECK_ATTEMPTS = 300;
// let lastProgress = 0; // 记录上一次的进度值，防止进度条回退
// let currentFormulaIndex = 0; // 记录当前公式索引，用于复制功能
//
// // DOM元素
// const uploadArea = document.getElementById('uploadArea');
// const fileInput = document.getElementById('fileInput');
// const selectedFilesDiv = document.getElementById('selectedFiles');
// const uploadBtn = document.getElementById('uploadBtn');
// const clearBtn = document.getElementById('clearBtn');
// const resultCount = document.getElementById('resultCount');
// const imageResults = document.getElementById('imageResults');
// const historyList = document.getElementById('historyList');
// const toast = document.getElementById('toast');
//
// // 初始化
// document.addEventListener('DOMContentLoaded', function() {
//     // 初始化拖放效果
//     initDragDrop();
//
//     // 加载历史记录
//     loadHistory();
//
//     // 设置事件监听器
//     fileInput.addEventListener('change', handleFileSelect);
//     uploadBtn.addEventListener('click', uploadFiles);
//     clearBtn.addEventListener('click', clearFiles);
//
//     // 键盘快捷键
//     document.addEventListener('keydown', function(event) {
//         if (event.key === 'Escape') {
//             closeAllModals();
//         }
//         if (event.ctrlKey && event.key === 's') {
//             event.preventDefault();
//             copyAllLatex();
//         }
//     });
// });
//
// // 初始化拖放效果
// function initDragDrop() {
//     uploadArea.addEventListener('dragover', (e) => {
//         e.preventDefault();
//         e.stopPropagation();
//         uploadArea.style.borderColor = '#4361ee';
//         uploadArea.style.backgroundColor = 'rgba(67, 97, 238, 0.05)';
//     });
//
//     uploadArea.addEventListener('dragleave', (e) => {
//         e.preventDefault();
//         e.stopPropagation();
//         uploadArea.style.borderColor = '';
//         uploadArea.style.backgroundColor = '';
//     });
//
//     uploadArea.addEventListener('drop', handleDrop);
//
//     // 点击上传区域选择文件
//     uploadArea.addEventListener('click', () => {
//         fileInput.click();
//     });
// }
//
// // 处理文件选择
// function handleFileSelect(e) {
//     const files = Array.from(e.target.files);
//     addFiles(files);
// }
//
// function handleDrop(e) {
//     e.preventDefault();
//     e.stopPropagation();
//
//     uploadArea.style.borderColor = '';
//     uploadArea.style.backgroundColor = '';
//
//     const files = Array.from(e.dataTransfer.files).filter(file => {
//         const extension = file.name.split('.').pop().toLowerCase();
//         return ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'tiff'].includes(extension);
//     });
//
//     addFiles(files);
//     showToast(`已添加 ${files.length} 个文件`, 'success');
// }
//
// function addFiles(files) {
//     let newFilesCount = 0;
//     files.forEach(file => {
//         // 检查文件类型
//         const extension = file.name.split('.').pop().toLowerCase();
//         if (!['jpg', 'jpeg', 'png', 'bmp', 'gif', 'tiff'].includes(extension)) {
//             showToast(`文件 ${file.name} 格式不支持`, 'warning');
//             return;
//         }
//
//         // 检查文件大小（10MB限制）
//         if (file.size > 10 * 1024 * 1024) {
//             showToast(`文件 ${file.name} 太大（超过10MB）`, 'warning');
//             return;
//         }
//
//         // 检查是否已存在
//         const existingFile = selectedFiles.find(f =>
//             f.name === file.name && f.size === file.size
//         );
//
//         if (!existingFile) {
//             selectedFiles.push(file);
//             newFilesCount++;
//         }
//     });
//
//     if (newFilesCount > 0) {
//         updateSelectedFilesList();
//         showToast(`成功添加 ${newFilesCount} 个文件`, 'success');
//     }
// }
//
// function updateSelectedFilesList() {
//     if (selectedFiles.length === 0) {
//         selectedFilesDiv.innerHTML = '<div class="empty-files"><i class="fas fa-folder-open"></i><span>暂无选择文件</span></div>';
//         uploadBtn.disabled = true;
//         return;
//     }
//
//     let html = '';
//     selectedFiles.forEach((file, index) => {
//         const size = formatFileSize(file.size);
//         html += `
//             <div class="file-item">
//                 <div class="file-info">
//                     <i class="fas fa-file-image"></i>
//                     <div class="file-details">
//                         <div class="file-name">${file.name}</div>
//                         <div class="file-size">${size}</div>
//                     </div>
//                 </div>
//                 <button class="btn-remove" onclick="removeFile(${index})" title="移除文件">
//                     <i class="fas fa-times"></i>
//                 </button>
//             </div>
//         `;
//     });
//
//     selectedFilesDiv.innerHTML = html;
//     uploadBtn.disabled = false;
// }
//
// function removeFile(index) {
//     selectedFiles.splice(index, 1);
//     updateSelectedFilesList();
//     showToast('已移除文件', 'info');
// }
//
// function clearFiles() {
//     if (selectedFiles.length === 0) {
//         showToast('没有可清除的文件', 'info');
//         return;
//     }
//
//     selectedFiles = [];
//     fileInput.value = '';
//     updateSelectedFilesList();
//     showToast('已清空所有文件', 'success');
// }
//
// function formatFileSize(bytes) {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
// }
//
// // 上传文件
// async function uploadFiles() {
//     if (selectedFiles.length === 0) {
//         showToast('请先选择文件', 'warning');
//         return;
//     }
//
//     // 禁用上传按钮
//     uploadBtn.disabled = true;
//     uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 上传中...';
//
//     const formData = new FormData();
//     selectedFiles.forEach(file => {
//         formData.append('files', file);
//     });
//
//     try {
//         const response = await fetch('/upload', {
//             method: 'POST',
//             body: formData
//         });
//
//         const data = await response.json();
//
//         if (response.ok) {
//             currentTaskId = data.task_id;
//             lastProgress = 0; // 重置上一次的进度值
//             showProgress();
//             startProgressCheck();
//             showToast('文件上传成功，开始处理...', 'success');
//         } else {
//             showToast('上传失败: ' + (data.error || '未知错误'), 'error');
//             uploadBtn.disabled = false;
//             uploadBtn.innerHTML = '<i class="fas fa-rocket"></i> 开始检测';
//         }
//     } catch (error) {
//         console.error('上传错误:', error);
//         showToast('上传失败: ' + error.message, 'error');
//         uploadBtn.disabled = false;
//         uploadBtn.innerHTML = '<i class="fas fa-rocket"></i> 开始检测';
//     }
// }
//
// // 进度监控 - 使用模态框
// function showProgress() {
//     const modal = document.getElementById('progressModal');
//     const progressFill = document.getElementById('modalProgressFill');
//     const progressText = document.getElementById('modalProgressText');
//     const progressDetails = document.getElementById('modalProgressDetails');
//
//     progressFill.style.width = '0%';
//     progressText.textContent = '0%';
//     progressDetails.textContent = '正在初始化...';
//     checkAttempts = 0;
//
//     modal.style.display = 'flex';
// }
//
// function startProgressCheck() {
//     if (checkInterval) {
//         clearInterval(checkInterval);
//     }
//
//     checkProgress();
//     checkInterval = setInterval(checkProgress, 1000);
// }
//
// async function checkProgress() {
//     if (currentTaskId === null || currentTaskId === undefined) {
//         return;
//     }
//
//     checkAttempts++;
//     if (checkAttempts > MAX_CHECK_ATTEMPTS) {
//         clearInterval(checkInterval);
//         const modal = document.getElementById('progressModal');
//         const progressDetails = document.getElementById('modalProgressDetails');
//
//         progressDetails.textContent = '处理超时，请重试';
//         showToast('处理超时，请重试', 'error');
//
//         setTimeout(() => {
//             modal.style.display = 'none';
//         }, 2000);
//
//         uploadBtn.disabled = false;
//         uploadBtn.innerHTML = '<i class="fas fa-rocket"></i> 开始检测';
//         return;
//     }
//
//     try {
//         const response = await fetch(`/task_status/${currentTaskId}?_=${Date.now()}`);
//
//         if (!response.ok) {
//             const progressDetails = document.getElementById('modalProgressDetails');
//             progressDetails.textContent = '请求失败，重试中...';
//             return;
//         }
//
//         const data = await response.json();
//
//         const modal = document.getElementById('progressModal');
//         const progressFill = document.getElementById('modalProgressFill');
//         const progressText = document.getElementById('modalProgressText');
//         const progressDetails = document.getElementById('modalProgressDetails');
//
//         if (data.status === 'processing') {
//             // 获取后端返回的进度值
//             const backendProgress = data.progress || 0;
//
//             // 确保进度只增不减：使用后端进度和上次进度的最大值
//             const actualProgress = Math.max(lastProgress, backendProgress);
//
//             // 更新进度条，确保不会回退
//             progressFill.style.width = `${actualProgress}%`;
//             progressText.textContent = `${actualProgress}%`;
//
//             // 更新上次进度值
//             lastProgress = actualProgress;
//
//             // 根据后端返回的状态信息更新详情
//             if (data.stage) {
//                 progressDetails.textContent = data.stage;
//
//                 // 如果有当前文件信息，显示文件处理进度
//                 if (data.current_file && data.total_files) {
//                     progressDetails.textContent += ` (正在处理第 ${data.current_file} 个文件，共 ${data.total_files} 个文件)`;
//                 }
//             } else if (data.message) {
//                 // 如果有详细消息，使用后端提供的消息
//                 progressDetails.textContent = data.message;
//             } else {
//                 // 否则使用基于当前进度的描述
//                 if (actualProgress < 20) {
//                     progressDetails.textContent = '正在上传和处理图片...';
//                 } else if (actualProgress < 40) {
//                     progressDetails.textContent = '正在预处理...';
//                 } else if (actualProgress < 70) {
//                     progressDetails.textContent = '正在检测公式...';
//                 } else if (actualProgress < 95) {
//                     progressDetails.textContent = '正在识别LaTeX公式...';
//                 } else {
//                     progressDetails.textContent = '正在生成结果...';
//                 }
//
//                 // 如果有当前文件信息，显示文件处理进度
//                 if (data.current_file && data.total_files) {
//                     progressDetails.textContent += ` (${data.current_file}/${data.total_files})`;
//                 }
//             }
//
//         } else if (data.status === 'completed') {
//             // 完成状态：直接设置为100%
//             progressFill.style.width = '100%';
//             progressText.textContent = '100%';
//             progressDetails.textContent = '处理完成!';
//             lastProgress = 100; // 确保最后进度为100
//
//             clearInterval(checkInterval);
//             currentResults = data.results;
//             showResults(data.results);
//             loadHistory();
//
//             // 重置上传按钮
//             uploadBtn.disabled = false;
//             uploadBtn.innerHTML = '<i class="fas fa-rocket"></i> 开始检测';
//
//             // 关闭模态框
//             setTimeout(() => {
//                 modal.style.display = 'none';
//             }, 1000);
//
//             showToast('处理完成!', 'success');
//
//         } else if (data.status === 'error') {
//             clearInterval(checkInterval);
//             // 错误时显示当前进度（不一定是100%）
//             progressFill.style.width = `${lastProgress}%`;
//             progressText.textContent = `${lastProgress}%`;
//             progressDetails.textContent = '处理失败';
//
//             showToast('处理失败: ' + data.error, 'error');
//
//             setTimeout(() => {
//                 modal.style.display = 'none';
//             }, 2000);
//
//             uploadBtn.disabled = false;
//             uploadBtn.innerHTML = '<i class="fas fa-rocket"></i> 开始检测';
//
//         } else if (data.status === 'queued') {
//             // 处理排队状态
//             const queueProgress = data.queue_position ? Math.max(1, Math.min(5, data.queue_position * 10)) : 5;
//             const actualQueueProgress = Math.max(lastProgress, queueProgress);
//
//             progressFill.style.width = `${actualQueueProgress}%`;
//             progressText.textContent = `${actualQueueProgress}%`;
//             lastProgress = actualQueueProgress;
//
//             progressDetails.textContent = data.queue_position
//                 ? `正在排队等待处理... (当前队列位置: ${data.queue_position})`
//                 : '正在排队等待处理...';
//
//         } else if (data.status === 'pending') {
//             // 处理待处理状态
//             const pendingProgress = 10;
//             const actualPendingProgress = Math.max(lastProgress, pendingProgress);
//
//             progressFill.style.width = `${actualPendingProgress}%`;
//             progressText.textContent = `${actualPendingProgress}%`;
//             lastProgress = actualPendingProgress;
//
//             progressDetails.textContent = '任务已提交，等待处理...';
//         }
//     } catch (error) {
//         console.error('检查进度失败:', error);
//         const progressDetails = document.getElementById('modalProgressDetails');
//         progressDetails.textContent = '连接错误，重试中...';
//     }
// }
//
// // 显示结果
// function showResults(summary) {
//     if (!summary) {
//         showToast('无结果数据', 'warning');
//         // 显示空状态
//         imageResults.innerHTML = `
//             <div class="empty-state">
//                 <i class="fas fa-search"></i>
//                 <p>暂无检测结果</p>
//                 <p style="font-size: 0.8rem; color: var(--gray-500); margin-top: 0.5rem;">
//                     上传图片并开始检测后，结果将显示在这里
//                 </p>
//             </div>
//         `;
//         resultCount.textContent = '0 个结果';
//         return;
//     }
//
//     // 更新统计摘要
//     document.getElementById('statImages').textContent = summary.total_images;
//     document.getElementById('statDetections').textContent = summary.total_detections;
//     document.getElementById('statAvgConfidence').textContent =
//         (summary.overall_average_confidence * 100).toFixed(1) + '%';
//     document.getElementById('statAccuracy').textContent =
//         summary.overall_accuracy ? summary.overall_accuracy.toFixed(1) + '%' : 'N/A';
//
//     // 显示图片结果
//     let resultsHtml = '';
//     let totalResults = 0;
//
//     if (summary.results && summary.results.length > 0) {
//         totalResults = summary.results.length;
//         summary.results.forEach((result, index) => {
//             const detections = result.detections || [];
//             const hasLatex = detections.some(d => d.latex_formula);
//             const hasError = result.error;
//
//             resultsHtml += `
//                 <div class="image-result-card" onclick="showFormulaDetail(${index})">
//                     <div class="result-image-container">
//                         ${hasError ? `
//                             <div class="error-overlay">
//                                 <i class="fas fa-exclamation-triangle"></i>
//                                 <span>处理出错</span>
//                             </div>
//                         ` : ''}
//                         <img src="/results/${result.result_image || 'static/images/placeholder.jpg'}"
//                              alt="${result.image_name}" class="result-image">
//                         <div class="result-overlay">
//                             <i class="fas fa-search-plus"></i>
//                             <span>查看详情</span>
//                         </div>
//                     </div>
//                     <div class="result-info">
//                         <div class="result-header">
//                             <div class="result-title">
//                                 <div class="result-name">${result.image_name}</div>
//                             </div>
//                             <div class="result-tags">
//                                 <span class="tag tag-count">
//                                     <i class="fas fa-calculator"></i> ${result.detection_count || 0}
//                                 </span>
//                                 ${result.average_confidence ? `
//                                     <span class="tag tag-confidence">
//                                         <i class="fas fa-chart-line"></i> ${(result.average_confidence * 100).toFixed(1)}%
//                                     </span>
//                                 ` : ''}
//                             </div>
//                         </div>
//
//                         ${result.error ? `
//                             <div class="error-message">
//                                 <i class="fas fa-exclamation-circle"></i>
//                                 <span>${result.error}</span>
//                             </div>
//                         ` : `
//                             <div class="result-stats">
//                                 <div class="stat-item">
//                                     <i class="fas fa-ruler-combined"></i>
//                                     <span>尺寸: <strong>${result.original_size ? result.original_size[0] + '×' + result.original_size[1] : 'N/A'}</strong></span>
//                                 </div>
//                                 <div class="stat-item">
//                                     <i class="fas fa-percentage"></i>
//                                     <span>置信度: <strong>${(result.average_confidence * 100).toFixed(1)}%</strong></span>
//                                 </div>
//                             </div>
//                             ${hasLatex ? `
//                                 <div class="latex-indicator">
//                                     <i class="fas fa-code"></i>
//                                     <span>LaTeX识别: ${detections.filter(d => d.latex_formula).length} 个公式</span>
//                                 </div>
//                             ` : ''}
//                         `}
//                     </div>
//                 </div>
//             `;
//         });
//     } else {
//         resultsHtml = `
//             <div class="empty-state">
//                 <i class="fas fa-exclamation-circle"></i>
//                 <h3>未检测到公式</h3>
//                 <p>请尝试上传包含数学公式的图片</p>
//             </div>
//         `;
//     }
//
//     imageResults.innerHTML = resultsHtml;
//     resultCount.textContent = `${totalResults} 个结果`;
// }
//
// // 显示公式详情 - 改进版（超大模态框，带图片点击放大功能）
// function showFormulaDetail(resultIndex) {
//     if (!currentResults || !currentResults.results) {
//         showToast('无结果数据', 'warning');
//         return;
//     }
//
//     const result = currentResults.results[resultIndex];
//     if (!result) return;
//
//     const detections = result.detections || [];
//     currentFormulaIndex = resultIndex; // 保存当前索引用于复制功能
//
//     // 创建模态框内容 - 超大布局
//     const modalContent = `
//         <div class="modal-content" style="max-width: 1400px; width: 95vw; max-height: 90vh;">
//             <div class="modal-header">
//                 <h3 style="font-size: 1.5rem;">
//                     <i class="fas fa-calculator"></i>公式检测详情 - ${result.image_name}
//                 </h3>
//                 <div style="display: flex; gap: 10px;">
//                     <button class="btn-copy-all" onclick="copyAllLatexFromDetail()" style="padding: 6px 12px; background: #4361ee; color: white; border: none; border-radius: 4px; cursor: pointer;">
//                         <i class="fas fa-copy"></i> 复制所有公式
//                     </button>
//                     <button class="modal-close" onclick="closeModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
//                 </div>
//             </div>
//             <div class="modal-body" style="overflow-y: auto; max-height: calc(90vh - 70px);">
//                 <div class="modal-grid" style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 25px;">
//                     <div class="modal-section">
//                         <h4><i class="fas fa-image"></i>检测结果图（带红框）</h4>
//                         <div style="text-align: center; margin-bottom: 15px;">
//                             <div class="image-zoom-container" style="position: relative; display: inline-block; cursor: zoom-in;">
//                                 <img src="/results/${result.result_image || 'static/images/placeholder.jpg'}"
//                                      alt="检测结果"
//                                      class="modal-image"
//                                      style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
//                                      onclick="openImageModal(this.src, this.alt)">
//                                 <div class="zoom-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0); transition: background 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; opacity: 0;">
//                                     <i class="fas fa-search-plus"></i>
//                                 </div>
//                             </div>
//                             <p style="margin-top: 10px; color: #666; font-size: 0.9rem;">点击图片放大查看</p>
//                         </div>
//                         <div class="image-stats" style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
//                             <div class="stat-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
//                                 <span class="stat-label" style="font-weight: 600; color: #555;">检测数量:</span>
//                                 <span class="stat-value" style="color: #4361ee; font-weight: 600;">${result.detection_count || 0} 个</span>
//                             </div>
//                             <div class="stat-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
//                                 <span class="stat-label" style="font-weight: 600; color: #555;">平均置信度:</span>
//                                 <span class="stat-value" style="color: #4361ee; font-weight: 600;">${(result.average_confidence * 100).toFixed(1)}%</span>
//                             </div>
//                             <div class="stat-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
//                                 <span class="stat-label" style="font-weight: 600; color: #555;">识别准确率:</span>
//                                 <span class="stat-value" style="color: #4361ee; font-weight: 600;">${result.accuracy ? result.accuracy.toFixed(1) + '%' : 'N/A'}</span>
//                             </div>
//                             <div class="stat-row" style="display: flex; justify-content: space-between;">
//                                 <span class="stat-label" style="font-weight: 600; color: #555;">图片尺寸:</span>
//                                 <span class="stat-value" style="color: #4361ee; font-weight: 600;">${result.original_size ? result.original_size[0] + '×' + result.original_size[1] : 'N/A'}</span>
//                             </div>
//                         </div>
//                         ${result.latex_txt_file ? `
//                             <div style="margin-top: 15px; text-align: center;">
//                                 <a href="/results/${result.latex_txt_file}"
//                                    target="_blank"
//                                    style="display: inline-block; padding: 8px 16px; background: #4361ee; color: white; text-decoration: none; border-radius: 4px;">
//                                     <i class="fas fa-download"></i> 下载LaTeX结果(TXT)
//                                 </a>
//                             </div>
//                         ` : ''}
//                     </div>
//                     <div class="modal-section">
//                         <h4><i class="fas fa-list"></i>检测到的公式 (${detections.length})</h4>
//                         <div class="formula-list" style="max-height: 500px; overflow-y: auto;">
//                             ${detections.length > 0 ? detections.map((detection, idx) => `
//                                 <div class="formula-item" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: white;">
//                                     <div class="formula-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
//                                         <div class="formula-title" style="display: flex; align-items: center; gap: 8px;">
//                                             <i class="fas fa-hashtag" style="color: #4361ee;"></i>
//                                             <span style="font-weight: 600; font-size: 1.1rem;">公式 ${detection.id || idx + 1}</span>
//                                         </div>
//                                         <span class="formula-confidence" style="background: #e9ecef; padding: 4px 10px; border-radius: 20px; font-size: 0.9rem;">
//                                             <i class="fas fa-chart-line"></i> ${(detection.confidence * 100).toFixed(1)}%
//                                         </span>
//                                     </div>
//                                     <div class="formula-content" style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 15px; margin-bottom: 12px;">
//                                         <div class="formula-crop" style="text-align: center;">
//                                             <div class="image-zoom-container" style="position: relative; cursor: zoom-in;">
//                                                 <img src="${detection.crop_path ? '/results/' + detection.crop_path : '/static/images/placeholder.jpg'}"
//                                                      alt="公式区域"
//                                                      style="max-width: 100%; max-height: 150px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);"
//                                                      onclick="openImageModal(this.src, '公式 ${idx + 1}')">
//                                                 <div class="zoom-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0); transition: background 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; opacity: 0;">
//                                                     <i class="fas fa-search-plus"></i>
//                                                 </div>
//                                             </div>
//                                             <p style="margin-top: 5px; color: #666; font-size: 0.8rem;">公式区域</p>
//                                         </div>
//                                         <div class="formula-rendered" style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px; overflow-x: auto; max-height: 180px;">
//                                             <div style="min-width: 400px;">
//                                                 ${detection.latex_formula ? `\\(${detection.latex_formula}\\)` : '<em style="color: #999;">无LaTeX公式</em>'}
//                                             </div>
//                                         </div>
//                                     </div>
//                                     <div class="formula-actions" style="display: flex; justify-content: space-between; align-items: center;">
//                                         <div class="formula-latex-code" style="flex: 1; margin-right: 15px; background: #f8f9fa; padding: 8px; border-radius: 4px; overflow-x: auto; font-family: 'Courier New', monospace; font-size: 0.9rem;">
//                                             <code>${detection.latex_formula || '未识别'}</code>
//                                         </div>
//                                         <button class="btn-copy-small" onclick="copyLatexText(${idx})" style="padding: 6px 12px; background: #4361ee; color: white; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;">
//                                             <i class="fas fa-copy"></i> 复制代码
//                                         </button>
//                                     </div>
//                                 </div>
//                             `).join('') : `
//                                 <div class="empty-state" style="padding: 3rem; text-align: center; color: #999;">
//                                     <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem;"></i>
//                                     <p style="font-size: 1.2rem;">未检测到公式</p>
//                                 </div>
//                             `}
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     `;
//
//     // 更新模态框
//     const modal = document.getElementById('formulaModal');
//     modal.innerHTML = modalContent;
//     modal.style.display = 'flex';
//
//     // 添加图片悬停效果
//     document.querySelectorAll('.image-zoom-container').forEach(container => {
//         const overlay = container.querySelector('.zoom-overlay');
//         container.addEventListener('mouseenter', () => {
//             overlay.style.background = 'rgba(0,0,0,0.3)';
//             overlay.style.opacity = '1';
//         });
//         container.addEventListener('mouseleave', () => {
//             overlay.style.background = 'rgba(0,0,0,0)';
//             overlay.style.opacity = '0';
//         });
//     });
//
//     // 重新渲染MathJax
//     if (window.MathJax) {
//         setTimeout(() => {
//             MathJax.typesetPromise();
//         }, 100);
//     }
// }
//
// // 图片放大模态框功能
// function openImageModal(src, alt) {
//     const modal = document.createElement('div');
//     modal.className = 'image-modal';
//     modal.style.cssText = `
//         display: flex;
//         position: fixed;
//         z-index: 2000;
//         left: 0;
//         top: 0;
//         width: 100%;
//         height: 100%;
//         background-color: rgba(0,0,0,0.9);
//         justify-content: center;
//         align-items: center;
//     `;
//
//     modal.innerHTML = `
//         <span class="image-modal-close" onclick="closeImageModal()" style="position: absolute; top: 20px; right: 35px; color: white; font-size: 40px; font-weight: bold; cursor: pointer; z-index: 2001;">&times;</span>
//         <img class="image-modal-content" src="${src}" alt="${alt}" style="max-width: 90%; max-height: 90%; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
//     `;
//
//     document.body.appendChild(modal);
//
//     // 点击模态框背景关闭
//     modal.addEventListener('click', (e) => {
//         if (e.target === modal) {
//             closeImageModal();
//         }
//     });
// }
//
// function closeImageModal() {
//     const modal = document.querySelector('.image-modal');
//     if (modal) {
//         modal.remove();
//     }
// }
//
// // 从详情页复制单个公式
// function copyLatexText(index) {
//     if (!currentResults || !currentResults.results[currentFormulaIndex]) {
//         showToast('无公式数据', 'warning');
//         return;
//     }
//
//     const detections = currentResults.results[currentFormulaIndex].detections || [];
//     if (index >= detections.length) {
//         showToast('公式索引错误', 'error');
//         return;
//     }
//
//     const latex = detections[index].latex_formula;
//     if (!latex || latex === '未识别') {
//         showToast('无LaTeX代码可复制', 'warning');
//         return;
//     }
//
//     const textarea = document.createElement('textarea');
//     textarea.value = latex;
//     document.body.appendChild(textarea);
//     textarea.select();
//
//     try {
//         const successful = document.execCommand('copy');
//         document.body.removeChild(textarea);
//
//         if (successful) {
//             showToast(`公式 ${index + 1} 的LaTeX代码已复制到剪贴板`, 'success');
//         } else {
//             showToast('复制失败，请手动复制', 'error');
//         }
//     } catch (err) {
//         document.body.removeChild(textarea);
//         console.error('复制失败:', err);
//         showToast('复制失败，请手动复制', 'error');
//     }
// }
//
// // 从详情页复制所有公式
// function copyAllLatexFromDetail() {
//     if (!currentResults || !currentResults.results[currentFormulaIndex]) {
//         showToast('无公式数据', 'warning');
//         return;
//     }
//
//     const detections = currentResults.results[currentFormulaIndex].detections || [];
//     if (detections.length === 0) {
//         showToast('无公式可复制', 'warning');
//         return;
//     }
//
//     let allLatex = '';
//     detections.forEach((detection, idx) => {
//         if (detection.latex_formula && detection.latex_formula !== '未识别') {
//             allLatex += `公式 ${idx + 1}: ${detection.latex_formula}\n\n`;
//         }
//     });
//
//     if (allLatex) {
//         const textarea = document.createElement('textarea');
//         textarea.value = allLatex.trim();
//         document.body.appendChild(textarea);
//         textarea.select();
//
//         try {
//             const successful = document.execCommand('copy');
//             document.body.removeChild(textarea);
//
//             if (successful) {
//                 showToast(`已复制 ${detections.length} 个LaTeX公式到剪贴板`, 'success');
//             } else {
//                 showToast('复制失败，请手动复制', 'error');
//             }
//         } catch (err) {
//             document.body.removeChild(textarea);
//             console.error('复制失败:', err);
//             showToast('复制失败，请手动复制', 'error');
//         }
//     } else {
//         showToast('无LaTeX公式可复制', 'warning');
//     }
// }
//
// // 加载历史记录
// async function loadHistory() {
//     try {
//         const response = await fetch('/recent_sessions');
//         const data = await response.json();
//
//         if (data.sessions.length === 0) {
//             historyList.innerHTML = `
//                 <div class="empty-state">
//                     <i class="fas fa-history"></i>
//                     <p>暂无历史记录</p>
//                 </div>
//             `;
//             return;
//         }
//
//         let html = '';
//         data.sessions.forEach(session => {
//             const displayTime = formatTimestamp(session.timestamp);
//             html += `
//                 <div class="history-item" onclick="loadSession('${session.id}')">
//                     <div class="history-info">
//                         <h4>会话 ${displayTime}</h4>
//                         <p>${session.id}</p>
//                     </div>
//                     <div class="history-stats">
//                         <div class="history-stat">
//                             <div class="value">${session.image_count}</div>
//                             <div class="label">图片</div>
//                         </div>
//                         <div class="history-stat">
//                             <div class="value">${session.detection_count}</div>
//                             <div class="label">公式</div>
//                         </div>
//                         <div class="history-stat">
//                             <div class="value">${(session.avg_confidence * 100).toFixed(1)}%</div>
//                             <div class="label">置信度</div>
//                         </div>
//                     </div>
//                 </div>
//             `;
//         });
//
//         historyList.innerHTML = html;
//     } catch (error) {
//         console.error('加载历史记录失败:', error);
//     }
// }
//
// function formatTimestamp(timestamp) {
//     if (timestamp.length >= 12) {
//         const date = timestamp.substring(0, 8);
//         const time = timestamp.substring(8, 12);
//         return `${date} ${time.substring(0, 2)}:${time.substring(2, 4)}`;
//     }
//     return timestamp;
// }
//
// // 加载历史会话
// async function loadSession(sessionId) {
//     try {
//         const response = await fetch(`/results/${sessionId}/results/summary.json`);
//         if (!response.ok) {
//             showToast('无法加载会话数据', 'error');
//             return;
//         }
//
//         const summary = await response.json();
//         currentResults = summary;
//         showResults(summary);
//         showToast('已加载历史会话', 'success');
//     } catch (error) {
//         console.error('加载会话失败:', error);
//         showToast('加载会话失败', 'error');
//     }
// }
//
// // 复制所有LaTeX
// function copyAllLatex() {
//     if (!currentResults || !currentResults.results) {
//         showToast('无公式数据', 'warning');
//         return;
//     }
//
//     let allLatex = '';
//     let formulaCount = 0;
//
//     currentResults.results.forEach(result => {
//         if (result.detections) {
//             result.detections.forEach(detection => {
//                 if (detection.latex_formula && detection.latex_formula !== '未识别') {
//                     allLatex += detection.latex_formula + '\n\n';
//                     formulaCount++;
//                 }
//             });
//         }
//     });
//
//     if (allLatex) {
//         const textarea = document.createElement('textarea');
//         textarea.value = allLatex.trim();
//         document.body.appendChild(textarea);
//         textarea.select();
//
//         try {
//             const successful = document.execCommand('copy');
//             document.body.removeChild(textarea);
//
//             if (successful) {
//                 showToast(`已复制 ${formulaCount} 个LaTeX公式`, 'success');
//             } else {
//                 showToast('复制失败，请手动复制', 'error');
//             }
//         } catch (err) {
//             document.body.removeChild(textarea);
//             console.error('复制失败:', err);
//             showToast('复制失败，请手动复制', 'error');
//         }
//     } else {
//         showToast('无LaTeX公式可复制', 'warning');
//     }
// }
//
// // 模态框控制
// function closeModal() {
//     document.getElementById('formulaModal').style.display = 'none';
// }
//
// function closeAllModals() {
//     document.getElementById('formulaModal').style.display = 'none';
//     document.getElementById('progressModal').style.display = 'none';
//     closeImageModal();
// }
//
// // 点击模态框外部关闭
// window.onclick = function(event) {
//     const modal = document.getElementById('formulaModal');
//     const progressModal = document.getElementById('progressModal');
//
//     if (event.target === modal) {
//         closeModal();
//     }
//     if (event.target === progressModal) {
//         progressModal.style.display = 'none';
//     }
// };
//
// // 消息提示
// function showToast(message, type = 'info') {
//     if (!toast) return;
//
//     toast.textContent = message;
//     toast.className = 'toast show';
//
//     // 移除旧的类型类
//     toast.classList.remove('success', 'error', 'warning');
//
//     // 添加新的类型类
//     if (type === 'success') {
//         toast.classList.add('success');
//     } else if (type === 'error') {
//         toast.classList.add('error');
//     } else if (type === 'warning') {
//         toast.classList.add('warning');
//     }
//
//     // 3秒后自动隐藏
//     setTimeout(() => {
//         toast.className = 'toast';
//     }, 3000);
// }

let currentTaskId = null;
let checkInterval = null;
let selectedFiles = [];
let currentResults = null;
let checkAttempts = 0;
const MAX_CHECK_ATTEMPTS = 300;
let lastProgress = 0;

// DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const selectedFilesDiv = document.getElementById('selectedFiles');
const uploadBtn = document.getElementById('uploadBtn');
const clearBtn = document.getElementById('clearBtn');
const resultCount = document.getElementById('resultCount');
const imageResults = document.getElementById('imageResults');
const historyList = document.getElementById('historyList');
const toast = document.getElementById('toast');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化拖放效果
    initDragDrop();

    // 加载历史记录
    loadHistory();

    // 设置事件监听器
    fileInput.addEventListener('change', handleFileSelect);
    uploadBtn.addEventListener('click', uploadFiles);
    clearBtn.addEventListener('click', clearFiles);

    // 键盘快捷键
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllModals();
        }
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            copyAllLatex();
        }
    });
});

// 初始化拖放效果
function initDragDrop() {
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.style.borderColor = '#4361ee';
        uploadArea.style.backgroundColor = 'rgba(67, 97, 238, 0.05)';
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.style.borderColor = '';
        uploadArea.style.backgroundColor = '';
    });

    uploadArea.addEventListener('drop', handleDrop);

    // 点击上传区域选择文件
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
}

// 处理文件选择
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    uploadArea.style.borderColor = '';
    uploadArea.style.backgroundColor = '';

    const files = Array.from(e.dataTransfer.files).filter(file => {
        const extension = file.name.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'tiff'].includes(extension);
    });

    addFiles(files);
    showToast(`已添加 ${files.length} 个文件`, 'success');
}

function addFiles(files) {
    let newFilesCount = 0;
    files.forEach(file => {
        // 检查文件类型
        const extension = file.name.split('.').pop().toLowerCase();
        if (!['jpg', 'jpeg', 'png', 'bmp', 'gif', 'tiff'].includes(extension)) {
            showToast(`文件 ${file.name} 格式不支持`, 'warning');
            return;
        }

        // 检查文件大小（10MB限制）
        if (file.size > 10 * 1024 * 1024) {
            showToast(`文件 ${file.name} 太大（超过10MB）`, 'warning');
            return;
        }

        // 检查是否已存在
        const existingFile = selectedFiles.find(f =>
            f.name === file.name && f.size === file.size
        );

        if (!existingFile) {
            selectedFiles.push(file);
            newFilesCount++;
        }
    });

    if (newFilesCount > 0) {
        updateSelectedFilesList();
        showToast(`成功添加 ${newFilesCount} 个文件`, 'success');
    }
}

function updateSelectedFilesList() {
    if (selectedFiles.length === 0) {
        selectedFilesDiv.innerHTML = '<div class="empty-files"><i class="fas fa-folder-open"></i><span>暂无选择文件</span></div>';
        uploadBtn.disabled = true;
        return;
    }

    let html = '';
    selectedFiles.forEach((file, index) => {
        const size = formatFileSize(file.size);
        html += `
            <div class="file-item">
                <div class="file-info">
                    <i class="fas fa-file-image"></i>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${size}</div>
                    </div>
                </div>
                <button class="btn-remove" onclick="removeFile(${index})" title="移除文件">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });

    selectedFilesDiv.innerHTML = html;
    uploadBtn.disabled = false;
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateSelectedFilesList();
    showToast('已移除文件', 'info');
}

function clearFiles() {
    if (selectedFiles.length === 0) {
        showToast('没有可清除的文件', 'info');
        return;
    }

    selectedFiles = [];
    fileInput.value = '';
    updateSelectedFilesList();
    showToast('已清空所有文件', 'success');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 上传文件
async function uploadFiles() {
    if (selectedFiles.length === 0) {
        showToast('请先选择文件', 'warning');
        return;
    }

    // 禁用上传按钮
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 上传中...';

    const formData = new FormData();
    selectedFiles.forEach(file => {
        formData.append('files', file);
    });

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            currentTaskId = data.task_id;
            lastProgress = 0;
            showProgress();
            startProgressCheck();
            showToast('文件上传成功，开始处理...', 'success');
        } else {
            showToast('上传失败: ' + (data.error || '未知错误'), 'error');
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-rocket"></i> 开始检测';
        }
    } catch (error) {
        console.error('上传错误:', error);
        showToast('上传失败: ' + error.message, 'error');
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-rocket"></i> 开始检测';
    }
}

// 进度监控
function showProgress() {
    const modal = document.getElementById('progressModal');
    const progressFill = document.getElementById('modalProgressFill');
    const progressText = document.getElementById('modalProgressText');
    const progressDetails = document.getElementById('modalProgressDetails');

    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    progressDetails.textContent = '正在初始化...';
    checkAttempts = 0;

    modal.style.display = 'flex';
}

function startProgressCheck() {
    if (checkInterval) {
        clearInterval(checkInterval);
    }

    checkProgress();
    checkInterval = setInterval(checkProgress, 1000);
}

async function checkProgress() {
    if (currentTaskId === null || currentTaskId === undefined) {
        return;
    }

    checkAttempts++;
    if (checkAttempts > MAX_CHECK_ATTEMPTS) {
        clearInterval(checkInterval);
        const modal = document.getElementById('progressModal');
        const progressDetails = document.getElementById('modalProgressDetails');

        progressDetails.textContent = '处理超时，请重试';
        showToast('处理超时，请重试', 'error');

        setTimeout(() => {
            modal.style.display = 'none';
        }, 2000);

        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-rocket"></i> 开始检测';
        return;
    }

    try {
        const response = await fetch(`/task_status/${currentTaskId}?_=${Date.now()}`);

        if (!response.ok) {
            const progressDetails = document.getElementById('modalProgressDetails');
            progressDetails.textContent = '请求失败，重试中...';
            return;
        }

        const data = await response.json();

        const modal = document.getElementById('progressModal');
        const progressFill = document.getElementById('modalProgressFill');
        const progressText = document.getElementById('modalProgressText');
        const progressDetails = document.getElementById('modalProgressDetails');

        if (data.status === 'processing') {
            const backendProgress = data.progress || 0;
            const actualProgress = Math.max(lastProgress, backendProgress);

            progressFill.style.width = `${actualProgress}%`;
            progressText.textContent = `${actualProgress}%`;
            lastProgress = actualProgress;

            if (data.stage) {
                progressDetails.textContent = data.stage;
                if (data.current_file && data.total_files) {
                    progressDetails.textContent += ` (正在处理第 ${data.current_file} 个文件，共 ${data.total_files} 个文件)`;
                }
            } else if (data.message) {
                progressDetails.textContent = data.message;
            } else {
                if (actualProgress < 20) {
                    progressDetails.textContent = '正在上传和处理图片...';
                } else if (actualProgress < 40) {
                    progressDetails.textContent = '正在预处理...';
                } else if (actualProgress < 70) {
                    progressDetails.textContent = '正在检测公式...';
                } else if (actualProgress < 95) {
                    progressDetails.textContent = '正在识别LaTeX公式...';
                } else {
                    progressDetails.textContent = '正在生成结果...';
                }

                if (data.current_file && data.total_files) {
                    progressDetails.textContent += ` (${data.current_file}/${data.total_files})`;
                }
            }

        } else if (data.status === 'completed') {
            progressFill.style.width = '100%';
            progressText.textContent = '100%';
            progressDetails.textContent = '处理完成!';
            lastProgress = 100;

            clearInterval(checkInterval);
            currentResults = data.results;
            showResults(data.results);
            loadHistory();

            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-rocket"></i> 开始检测';

            setTimeout(() => {
                modal.style.display = 'none';
            }, 1000);

            showToast('处理完成!', 'success');

        } else if (data.status === 'error') {
            clearInterval(checkInterval);
            progressFill.style.width = `${lastProgress}%`;
            progressText.textContent = `${lastProgress}%`;
            progressDetails.textContent = '处理失败';

            showToast('处理失败: ' + data.error, 'error');

            setTimeout(() => {
                modal.style.display = 'none';
            }, 2000);

            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-rocket"></i> 开始检测';

        } else if (data.status === 'queued') {
            const queueProgress = data.queue_position ? Math.max(1, Math.min(5, data.queue_position * 10)) : 5;
            const actualQueueProgress = Math.max(lastProgress, queueProgress);

            progressFill.style.width = `${actualQueueProgress}%`;
            progressText.textContent = `${actualQueueProgress}%`;
            lastProgress = actualQueueProgress;

            progressDetails.textContent = data.queue_position
                ? `正在排队等待处理... (当前队列位置: ${data.queue_position})`
                : '正在排队等待处理...';

        } else if (data.status === 'pending') {
            const pendingProgress = 10;
            const actualPendingProgress = Math.max(lastProgress, pendingProgress);

            progressFill.style.width = `${actualPendingProgress}%`;
            progressText.textContent = `${actualPendingProgress}%`;
            lastProgress = actualPendingProgress;

            progressDetails.textContent = '任务已提交，等待处理...';
        }
    } catch (error) {
        console.error('检查进度失败:', error);
        const progressDetails = document.getElementById('modalProgressDetails');
        progressDetails.textContent = '连接错误，重试中...';
    }
}

// 显示结果
function showResults(summary) {
    if (!summary) {
        showToast('无结果数据', 'warning');
        imageResults.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>暂无检测结果</p>
                <p style="font-size: 0.8rem; color: var(--gray-500); margin-top: 0.5rem;">
                    上传图片并开始检测后，结果将显示在这里
                </p>
            </div>
        `;
        resultCount.textContent = '0 个结果';
        return;
    }

    // 更新统计摘要
    document.getElementById('statImages').textContent = summary.total_images;
    document.getElementById('statDetections').textContent = summary.total_detections;
    document.getElementById('statAvgConfidence').textContent =
        (summary.overall_average_confidence * 100).toFixed(1) + '%';
    document.getElementById('statAccuracy').textContent =
        summary.overall_accuracy ? summary.overall_accuracy.toFixed(1) + '%' : 'N/A';

    // 显示图片结果
    let resultsHtml = '';
    let totalResults = 0;

    if (summary.results && summary.results.length > 0) {
        totalResults = summary.results.length;
        summary.results.forEach((result, index) => {
            const detections = result.detections || [];
            const hasLatex = detections.some(d => d.latex_formula);
            const hasError = result.error;

            resultsHtml += `
                <div class="image-result-card" onclick="showFormulaDetail(${index})">
                    <div class="result-image-container">
                        ${hasError ? `
                            <div class="error-overlay">
                                <i class="fas fa-exclamation-triangle"></i>
                                <span>处理出错</span>
                            </div>
                        ` : ''}
                        <img src="/results/${result.result_image || 'static/images/placeholder.jpg'}" 
                             alt="${result.image_name}" class="result-image">
                        <div class="result-overlay">
                            <i class="fas fa-search-plus"></i>
                            <span>查看详情</span>
                        </div>
                    </div>
                    <div class="result-info">
                        <div class="result-header">
                            <div class="result-title">
                                <div class="result-name">${result.image_name}</div>
                            </div>
                            <div class="result-tags">
                                <span class="tag tag-count">
                                    <i class="fas fa-calculator"></i> ${result.detection_count || 0}
                                </span>
                                ${result.average_confidence ? `
                                    <span class="tag tag-confidence">
                                        <i class="fas fa-chart-line"></i> ${(result.average_confidence * 100).toFixed(1)}%
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                        
                        ${result.error ? `
                            <div class="error-message">
                                <i class="fas fa-exclamation-circle"></i>
                                <span>${result.error}</span>
                            </div>
                        ` : `
                            <div class="result-stats">
                                <div class="stat-item">
                                    <i class="fas fa-ruler-combined"></i>
                                    <span>尺寸: <strong>${result.original_size ? result.original_size[0] + '×' + result.original_size[1] : 'N/A'}</strong></span>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-percentage"></i>
                                    <span>置信度: <strong>${(result.average_confidence * 100).toFixed(1)}%</strong></span>
                                </div>
                            </div>
                            ${hasLatex ? `
                                <div class="latex-indicator">
                                    <i class="fas fa-code"></i>
                                    <span>LaTeX识别: ${detections.filter(d => d.latex_formula).length} 个公式</span>
                                </div>
                            ` : ''}
                        `}
                    </div>
                </div>
            `;
        });
    } else {
        resultsHtml = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>未检测到公式</h3>
                <p>请尝试上传包含数学公式的图片</p>
            </div>
        `;
    }

    imageResults.innerHTML = resultsHtml;
    resultCount.textContent = `${totalResults} 个结果`;
}

// 显示公式详情 - 使用更简单的图片放大方法
function showFormulaDetail(resultIndex) {
    if (!currentResults || !currentResults.results) {
        showToast('无结果数据', 'warning');
        return;
    }

    const result = currentResults.results[resultIndex];
    if (!result) return;

    const detections = result.detections || [];
    currentFormulaIndex = resultIndex;

    // 创建模态框内容
    const modalContent = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-calculator"></i>公式检测详情 - ${result.image_name}</h3>
                <div style="display:flex;gap:10px;align-items:center;">
                    <button class="btn-copy-all" onclick="copyAllLatexFromDetail()">
                        <i class="fas fa-copy"></i> 复制所有公式
                    </button>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
            </div>
            <div class="modal-body">
                <div class="modal-grid">
                    <div class="modal-section">
                        <h4><i class="fas fa-image"></i>检测结果图（带红框）</h4>
                        <div style="text-align:center;margin-bottom:15px;">
                            <div class="clickable-image" data-src="/results/${result.result_image || 'static/images/placeholder.jpg'}" data-alt="检测结果" style="display:inline-block;cursor:zoom-in;border-radius:8px;overflow:hidden;">
                                <img src="/results/${result.result_image || 'static/images/placeholder.jpg'}"
                                     alt="检测结果"
                                     class="modal-image" style="margin-bottom:0;">
                            </div>
                            <p style="margin-top:10px;color:var(--gray-500);font-size:0.82rem;">点击图片放大查看</p>
                        </div>
                        <div class="image-stats">
                            <div class="stat-row">
                                <span class="stat-label">检测数量：</span>
                                <span class="stat-value">${result.detection_count || 0} 个</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">平均置信度：</span>
                                <span class="stat-value">${(result.average_confidence * 100).toFixed(1)}%</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">识别准确率：</span>
                                <span class="stat-value">${result.accuracy ? result.accuracy.toFixed(1) + '%' : 'N/A'}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">图片尺寸：</span>
                                <span class="stat-value">${result.original_size ? result.original_size[0] + '×' + result.original_size[1] : 'N/A'}</span>
                            </div>
                        </div>
                        ${result.latex_txt_file ? `
                            <div style="margin-top:15px;text-align:center;">
                                <a href="/results/${result.latex_txt_file}"
                                   target="_blank"
                                   class="download-link">
                                    <i class="fas fa-download"></i> 下载LaTeX结果(TXT)
                                </a>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-section">
                        <h4><i class="fas fa-list"></i>检测到的公式 (${detections.length})</h4>
                        <div class="formula-list">
                            ${detections.length > 0 ? detections.map((detection, idx) => `
                                <div class="formula-item">
                                    <div class="formula-header">
                                        <div class="formula-title">
                                            <i class="fas fa-hashtag"></i>
                                            <span>公式 ${detection.id || idx + 1}</span>
                                        </div>
                                        <span class="formula-confidence">
                                            <i class="fas fa-chart-line"></i> ${(detection.confidence * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div class="formula-content">
                                        <div class="formula-crop">
                                            <div class="clickable-image" data-src="${detection.crop_path ? '/results/' + detection.crop_path : '/static/images/placeholder.jpg'}" data-alt="公式 ${idx + 1}" style="display:inline-block;cursor:zoom-in;border-radius:6px;overflow:hidden;">
                                                <img src="${detection.crop_path ? '/results/' + detection.crop_path : '/static/images/placeholder.jpg'}"
                                                     alt="公式区域"
                                                     style="max-width:100%;max-height:150px;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.1);">
                                            </div>
                                            <p>公式区域</p>
                                        </div>
                                        <div class="formula-rendered">
                                            ${detection.latex_formula ? `\\(${detection.latex_formula}\\)` : '<em style="color:var(--gray-400);">无LaTeX公式</em>'}
                                        </div>
                                    </div>
                                    <div class="formula-actions">
                                        <div class="formula-latex-code">
                                            <code>${detection.latex_formula || '未识别'}</code>
                                        </div>
                                        <button class="btn-copy-small" onclick="copyLatexText(${idx})">
                                            <i class="fas fa-copy"></i> 复制代码
                                        </button>
                                    </div>
                                </div>
                            `).join('') : `
                                <div class="empty-state">
                                    <i class="fas fa-search"></i>
                                    <p>未检测到公式</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 更新模态框
    const modal = document.getElementById('formulaModal');
    modal.innerHTML = modalContent;
    modal.style.display = 'flex';

    // 为所有可点击图片添加事件监听器
    setTimeout(() => {
        const clickableImages = modal.querySelectorAll('.clickable-image');
        clickableImages.forEach(container => {
            container.addEventListener('click', function() {
                const src = this.getAttribute('data-src');
                const alt = this.getAttribute('data-alt');
                openImageModal(src, alt);
            });
        });
    }, 100);

    // 重新渲染MathJax
    if (window.MathJax) {
        setTimeout(() => {
            MathJax.typesetPromise();
        }, 100);
    }
}

// 图片放大模态框功能 - 简化版本
function openImageModal(src, alt) {
    console.log('尝试打开图片:', src, alt);

    // 检查图片路径
    if (!src || src === '/results/static/images/placeholder.jpg') {
        showToast('图片路径无效或未找到图片', 'error');
        return;
    }

    // 创建图片放大模态框
    const modal = document.createElement('div');
    modal.id = 'imageZoomModal';
    modal.className = 'image-modal';

    modal.innerHTML = `
        <span class="image-modal-close">&times;</span>
        <img class="image-modal-content" src="${src}" alt="${alt}">
    `;

    document.body.appendChild(modal);

    // 关闭按钮事件
    const closeBtn = modal.querySelector('.image-modal-close');
    const removeModal = () => {
        if (modal.parentNode) document.body.removeChild(modal);
    };
    closeBtn.addEventListener('click', removeModal);

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) removeModal();
    });

    // ESC键关闭
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            removeModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);

    showToast('点击图片外部或按ESC键关闭', 'info');
}

// 从详情页复制单个公式
function copyLatexText(index) {
    if (!currentResults || !currentResults.results[currentFormulaIndex]) {
        showToast('无公式数据', 'warning');
        return;
    }

    const detections = currentResults.results[currentFormulaIndex].detections || [];
    if (index >= detections.length) {
        showToast('公式索引错误', 'error');
        return;
    }

    const latex = detections[index].latex_formula;
    if (!latex || latex === '未识别') {
        showToast('无LaTeX代码可复制', 'warning');
        return;
    }

    navigator.clipboard.writeText(latex).then(() => {
        showToast(`公式 ${index + 1} 的LaTeX代码已复制到剪贴板`, 'success');
    }).catch(err => {
        console.error('复制失败:', err);
        showToast('复制失败，请手动复制', 'error');
    });
}

// 从详情页复制所有公式
function copyAllLatexFromDetail() {
    if (!currentResults || !currentResults.results[currentFormulaIndex]) {
        showToast('无公式数据', 'warning');
        return;
    }

    const detections = currentResults.results[currentFormulaIndex].detections || [];
    if (detections.length === 0) {
        showToast('无公式可复制', 'warning');
        return;
    }

    let allLatex = '';
    detections.forEach((detection, idx) => {
        if (detection.latex_formula && detection.latex_formula !== '未识别') {
            allLatex += `公式 ${idx + 1}: ${detection.latex_formula}\n\n`;
        }
    });

    if (allLatex) {
        navigator.clipboard.writeText(allLatex.trim()).then(() => {
            showToast(`已复制 ${detections.length} 个LaTeX公式到剪贴板`, 'success');
        }).catch(err => {
            console.error('复制失败:', err);
            showToast('复制失败，请手动复制', 'error');
        });
    } else {
        showToast('无LaTeX公式可复制', 'warning');
    }
}

// 加载历史记录
async function loadHistory() {
    try {
        const response = await fetch('/recent_sessions');
        const data = await response.json();

        if (data.sessions.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>暂无历史记录</p>
                </div>
            `;
            return;
        }

        let html = '';
        data.sessions.forEach(session => {
            const displayTime = formatTimestamp(session.timestamp);
            html += `
                <div class="history-item" onclick="loadSession('${session.id}')">
                    <div class="history-info">
                        <h4>会话 ${displayTime}</h4>
                        <p>${session.id}</p>
                    </div>
                    <div class="history-stats">
                        <div class="history-stat">
                            <div class="value">${session.image_count}</div>
                            <div class="label">图片</div>
                        </div>
                        <div class="history-stat">
                            <div class="value">${session.detection_count}</div>
                            <div class="label">公式</div>
                        </div>
                        <div class="history-stat">
                            <div class="value">${(session.avg_confidence * 100).toFixed(1)}%</div>
                            <div class="label">置信度</div>
                        </div>
                    </div>
                </div>
            `;
        });

        historyList.innerHTML = html;
    } catch (error) {
        console.error('加载历史记录失败:', error);
    }
}

function formatTimestamp(timestamp) {
    if (timestamp.length >= 12) {
        const date = timestamp.substring(0, 8);
        const time = timestamp.substring(8, 12);
        return `${date} ${time.substring(0, 2)}:${time.substring(2, 4)}`;
    }
    return timestamp;
}

// 加载历史会话
async function loadSession(sessionId) {
    try {
        const response = await fetch(`/results/${sessionId}/results/summary.json`);
        if (!response.ok) {
            showToast('无法加载会话数据', 'error');
            return;
        }

        const summary = await response.json();
        currentResults = summary;
        showResults(summary);
        showToast('已加载历史会话', 'success');
    } catch (error) {
        console.error('加载会话失败:', error);
        showToast('加载会话失败', 'error');
    }
}

// 复制所有LaTeX
function copyAllLatex() {
    if (!currentResults || !currentResults.results) {
        showToast('无公式数据', 'warning');
        return;
    }

    let allLatex = '';
    let formulaCount = 0;

    currentResults.results.forEach(result => {
        if (result.detections) {
            result.detections.forEach(detection => {
                if (detection.latex_formula && detection.latex_formula !== '未识别') {
                    allLatex += detection.latex_formula + '\n\n';
                    formulaCount++;
                }
            });
        }
    });

    if (allLatex) {
        navigator.clipboard.writeText(allLatex.trim()).then(() => {
            showToast(`已复制 ${formulaCount} 个LaTeX公式`, 'success');
        }).catch(err => {
            console.error('复制失败:', err);
            showToast('复制失败，请手动复制', 'error');
        });
    } else {
        showToast('无LaTeX公式可复制', 'warning');
    }
}

// 模态框控制
function closeModal() {
    document.getElementById('formulaModal').style.display = 'none';
}

function closeAllModals() {
    document.getElementById('formulaModal').style.display = 'none';
    document.getElementById('progressModal').style.display = 'none';
    // Remove any open image zoom modals
    document.querySelectorAll('.image-modal').forEach(m => m.remove());
}

// 消息提示
function showToast(message, type = 'info') {
    if (!toast) return;

    toast.textContent = message;
    toast.className = 'toast show';

    toast.classList.remove('success', 'error', 'warning', 'info');

    if (type === 'success') {
        toast.classList.add('success');
    } else if (type === 'error') {
        toast.classList.add('error');
    } else if (type === 'warning') {
        toast.classList.add('warning');
    } else if (type === 'info') {
        toast.classList.add('info');
    }

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}