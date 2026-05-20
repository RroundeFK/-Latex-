from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from pathlib import Path
import json
import threading
import time
import numpy as np
from decimal import Decimal
import traceback


# ========== 自定义JSON编码器 ==========
class CustomJSONEncoder(json.JSONEncoder):
    """自定义JSON编码器，处理numpy和Decimal类型"""

    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, (set, tuple)):
            return list(obj)
        elif hasattr(obj, 'to_dict'):
            return obj.to_dict()
        return super(CustomJSONEncoder, self).default(obj)


# ========== 配置参数 ==========
MODEL_PATH = 'models/best.pt'
# =============================

app = Flask(__name__, static_folder='static')
app.json_encoder = CustomJSONEncoder  # 使用自定义JSON编码器
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB限制
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['SECRET_KEY'] = 'math-formula-detection-secret-key'

# 创建必要的目录
for folder in [app.config['UPLOAD_FOLDER'], 'static/results']:
    Path(folder).mkdir(parents=True, exist_ok=True)

# 允许的文件扩展名
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp', 'gif', 'tiff', 'pdf'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# 全局模型实例
detector = None
tasks = {}  # 存储任务状态
task_counter = 0
model_loading = False
task_lock = threading.Lock()  # 添加锁防止并发问题


def init_model():
    """初始化模型"""
    global detector, model_loading, MODEL_PATH  # 添加 MODEL_PATH

    if model_loading:
        return

    model_loading = True

    try:
        print(f"正在初始化公式检测模型: {MODEL_PATH}")
        from model_inference import FormulaDetector

        # 检查模型文件是否存在
        if not os.path.exists(MODEL_PATH):
            print(f"警告: 模型文件不存在: {MODEL_PATH}")
            # 尝试使用相对路径
            current_dir = Path.cwd()
            full_path = current_dir / MODEL_PATH
            if full_path.exists():
                MODEL_PATH = str(full_path)  # 修改全局变量
                print(f"使用相对路径: {MODEL_PATH}")

        detector = FormulaDetector(MODEL_PATH)
        print("✅ 公式检测模型初始化成功!")

        # 检查pix2tex是否加载成功
        if not detector.use_pix2tex:
            print("⚠️ 警告: pix2tex模型未加载成功，LaTeX识别功能不可用")

    except Exception as e:
        print(f"模型初始化失败: {str(e)}")
        traceback.print_exc()
        detector = None
        # 不允许模拟模式，直接退出
        print("模型初始化失败，无法启动服务")
        os._exit(1)
    finally:
        model_loading = False


def check_model_initialized():
    """检查模型是否已初始化"""
    global detector
    if detector is None and not model_loading:
        thread = threading.Thread(target=init_model)
        thread.daemon = True
        thread.start()
        thread.join(timeout=30)


# 应用启动时初始化模型
print("正在初始化模型...")
init_model_thread = threading.Thread(target=init_model)
init_model_thread.daemon = True
init_model_thread.start()


@app.route('/')
def index():
    """主页面"""
    check_model_initialized()
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload_files():
    """处理文件上传"""
    global task_counter

    check_model_initialized()

    if detector is None:
        return jsonify({'error': '模型正在加载中，请稍后再试...', 'code': 'MODEL_LOADING'}), 503

    if 'files' not in request.files:
        return jsonify({'error': '没有选择文件', 'code': 'NO_FILES'}), 400

    files = request.files.getlist('files')
    if len(files) == 0 or (len(files) == 1 and files[0].filename == ''):
        return jsonify({'error': '没有选择文件', 'code': 'NO_FILES'}), 400

    # 创建会话目录
    session_dir = detector.create_session()
    upload_dir = session_dir / 'uploads'
    upload_dir.mkdir(parents=True, exist_ok=True)

    # 保存上传的文件
    saved_files = []
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # 添加时间戳避免重名
            name, ext = os.path.splitext(filename)
            timestamp = int(time.time() * 1000)
            unique_filename = f"{name}_{timestamp}{ext}"
            file_path = upload_dir / unique_filename
            file.save(str(file_path))
            saved_files.append(file_path)  # 存储Path对象

    if not saved_files:
        return jsonify({'error': '没有有效的图片文件', 'code': 'INVALID_FILES'}), 400

    # 创建任务
    with task_lock:
        task_id = task_counter
        task_counter += 1

    tasks[task_id] = {
        'status': 'processing',
        'session_id': session_dir.name,
        'files': [str(f) for f in saved_files],  # 转换为字符串用于JSON
        'start_time': time.time(),
        'results': None,
        'progress': 10,  # 初始进度设为10%
        'current_file': 0,
        'total_files': len(saved_files),
        'last_update': time.time()
    }

    # 启动后台处理任务
    thread = threading.Thread(target=process_task, args=(task_id, session_dir, upload_dir))
    thread.daemon = True
    thread.start()

    return jsonify({
        'task_id': task_id,
        'session_id': session_dir.name,
        'message': f'已上传 {len(saved_files)} 个文件，正在检测...',
        'code': 'SUCCESS'
    })


def process_task(task_id, session_dir, upload_dir):
    """后台处理任务"""
    try:
        # 获取上传的文件列表
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff'}
        image_files = [f for f in upload_dir.iterdir()
                       if f.suffix.lower() in image_extensions and f.is_file()]

        total_images = len(image_files)

        if total_images == 0:
            with task_lock:
                tasks[task_id]['status'] = 'error'
                tasks[task_id]['error'] = '没有找到图片文件'
            return

        all_results = []

        for i, img_file in enumerate(image_files):
            # 更新进度 - 更细粒度的进度更新
            base_progress = 10  # 初始进度
            progress_per_image = 85.0 / total_images  # 85%分配给图片处理

            # 每个图片处理分为4个阶段（新流程：预处理、推理裁剪、识别、格式转换）
            stages = ['haubu_fuzhi预处理', 'YOLO推理裁剪', 'pix2tex识别', '格式转换保存']
            stage_progress = progress_per_image / len(stages)

            for stage_idx, stage_name in enumerate(stages):
                stage_start_progress = base_progress + (i * progress_per_image) + (stage_idx * stage_progress)
                stage_end_progress = stage_start_progress + stage_progress

                # 短暂延迟，让前端能捕获进度变化
                time.sleep(0.05)

                with task_lock:
                    if task_id in tasks:
                        tasks[task_id]['progress'] = int(stage_end_progress)
                        tasks[task_id]['current_file'] = i + 1
                        tasks[task_id]['last_update'] = time.time()
                        print(
                            f"[TASK {task_id}] 进度更新: {tasks[task_id]['progress']}%, 阶段: {stage_name}, 文件: {i + 1}/{total_images}")

            try:
                print(f"处理图片 {i + 1}/{total_images}: {img_file.name}")

                # 为每张图片创建子目录
                img_output_dir = session_dir / 'results' / img_file.stem
                img_output_dir.mkdir(parents=True, exist_ok=True)

                # 单张图片预测 - 使用完整流程
                result = detector.predict_single_image(img_file, img_output_dir)
                all_results.append(result)

                # 更新进度 - 完成一张图片
                with task_lock:
                    if task_id in tasks:
                        progress_after_image = base_progress + ((i + 1) * progress_per_image)
                        tasks[task_id]['progress'] = int(progress_after_image)
                        tasks[task_id]['current_file'] = i + 1
                        tasks[task_id]['last_update'] = time.time()
                        print(f"[TASK {task_id}] 图片处理完成: {img_file.name}, 进度: {tasks[task_id]['progress']}%")

            except Exception as e:
                print(f"处理图片 {img_file.name} 时出错: {str(e)}")
                traceback.print_exc()
                # 添加错误结果
                all_results.append({
                    'image_name': img_file.name,
                    'error': str(e),
                    'detection_count': 0,
                    'average_confidence': 0.0,
                    'accuracy': 0.0,
                    'detections': []
                })

        # 计算总体统计
        valid_results = [r for r in all_results if 'error' not in r]
        total_valid = len(valid_results)

        if total_valid > 0:
            total_detections = sum(r.get('detection_count', 0) for r in valid_results)
            overall_avg_confidence = np.mean([r.get('average_confidence', 0.0) for r in valid_results])
            overall_accuracy = np.mean([r.get('accuracy', 0.0) for r in valid_results])
        else:
            total_detections = 0
            overall_avg_confidence = 0.0
            overall_accuracy = 0.0

        summary = {
            'total_images': total_valid,
            'total_detections': total_detections,
            'overall_average_confidence': float(overall_avg_confidence),
            'overall_accuracy': float(overall_accuracy),
            'results': all_results,
            'has_errors': any('error' in r for r in all_results)
        }

        # 保存总结文件
        summary_path = session_dir / 'results' / 'summary.json'
        summary_path.parent.mkdir(parents=True, exist_ok=True)
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)

        # 更新任务状态 - 确保进度为100%
        with task_lock:
            if task_id in tasks:
                tasks[task_id]['results'] = summary
                tasks[task_id]['status'] = 'completed'
                tasks[task_id]['end_time'] = time.time()
                tasks[task_id]['progress'] = 100  # 确保进度为100%
                tasks[task_id]['current_file'] = total_images
                tasks[task_id]['last_update'] = time.time()
                print(f"[TASK {task_id}] 任务处理完成，进度: 100%")

        # 清理旧会话
        detector.cleanup_old_sessions(keep_last_n=10)

        print(f"任务 {task_id} 处理完成，结果已保存")

    except Exception as e:
        with task_lock:
            if task_id in tasks:
                tasks[task_id]['status'] = 'error'
                tasks[task_id]['error'] = str(e)
                tasks[task_id]['progress'] = 0
        print(f"任务 {task_id} 处理失败: {str(e)}")
        traceback.print_exc()


@app.route('/task_status/<int:task_id>')
def get_task_status(task_id):
    """获取任务状态"""
    print(f"[DEBUG] 获取任务状态: task_id={task_id}")

    with task_lock:
        if task_id not in tasks:
            print(f"[DEBUG] 任务不存在: {task_id}")
            return jsonify({'error': '任务不存在', 'code': 'TASK_NOT_FOUND'}), 404

        task = tasks[task_id]
        print(f"[DEBUG] 任务状态: {task['status']}, 进度: {task.get('progress', 0)}")

        response = {
            'task_id': task_id,
            'status': task['status'],
            'session_id': task.get('session_id', ''),
            'progress': task.get('progress', 0),
            'current_file': task.get('current_file', 0),
            'total_files': task.get('total_files', 0)
        }

        if task['status'] == 'completed':
            print(f"[DEBUG] 任务已完成，返回结果")
            response['results'] = task['results']
            if 'start_time' in task and 'end_time' in task:
                response['processing_time'] = round(task['end_time'] - task['start_time'], 2)

        elif task['status'] == 'error':
            print(f"[DEBUG] 任务错误: {task.get('error')}")
            response['error'] = task.get('error', '未知错误')

        print(f"[DEBUG] 返回响应: status={response.get('status')}, progress={response.get('progress')}")
        return jsonify(response)


@app.route('/results/<session_id>/<path:subpath>')
def serve_result(session_id, subpath):
    """提供结果文件"""
    file_path = Path('static/results') / session_id / subpath
    if not file_path.exists():
        return "文件不存在", 404

    # 确定MIME类型
    if file_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.bmp']:
        mimetype = f'image/{file_path.suffix.lower().lstrip(".")}'
        if file_path.suffix.lower() == '.jpg':
            mimetype = 'image/jpeg'
    elif file_path.suffix.lower() == '.json':
        mimetype = 'application/json'
    elif file_path.suffix.lower() == '.txt':
        mimetype = 'text/plain; charset=utf-8'
    else:
        mimetype = 'application/octet-stream'

    # 读取文件内容
    with open(file_path, 'rb') as f:
        content = f.read()

    return content, 200, {'Content-Type': mimetype}


@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)


@app.route('/model_status')
def model_status():
    """检查模型状态"""
    check_model_initialized()
    if detector is None:
        return jsonify({'status': 'loading', 'message': '模型正在加载中...', 'code': 'LOADING'})
    else:
        pix2tex_status = 'loaded' if detector.use_pix2tex else 'failed'
        return jsonify({
            'status': 'ready',
            'message': '模型已就绪',
            'pix2tex_status': pix2tex_status,
            'code': 'READY'
        })


@app.route('/recent_sessions')
def get_recent_sessions():
    """获取最近的会话列表"""
    results_dir = Path('static/results')
    sessions = []

    if not results_dir.exists():
        return jsonify({'sessions': []})

    for session_dir in sorted(results_dir.iterdir(), reverse=True):
        if session_dir.is_dir():
            summary_file = session_dir / 'results' / 'summary.json'
            if summary_file.exists():
                try:
                    with open(summary_file, 'r', encoding='utf-8') as f:
                        summary = json.load(f)

                    sessions.append({
                        'id': session_dir.name,
                        'timestamp': session_dir.name,
                        'image_count': summary.get('total_images', 0),
                        'detection_count': summary.get('total_detections', 0),
                        'avg_confidence': float(summary.get('overall_average_confidence', 0)),
                        'accuracy': float(summary.get('overall_accuracy', 0))
                    })
                except Exception as e:
                    print(f"读取会话 {session_dir.name} 失败: {str(e)}")
                    continue

    return jsonify({'sessions': sessions[:10]})


@app.route('/test_model')
def test_model():
    """测试模型端点"""
    check_model_initialized()
    if detector is None:
        return jsonify({'status': 'error', 'message': '模型未初始化'})

    return jsonify({
        'status': 'ok',
        'model_path': MODEL_PATH,
        'pix2tex_loaded': detector.use_pix2tex
    })


# 清理任务线程
def cleanup_tasks():
    """清理旧任务"""
    current_time = time.time()
    tasks_to_remove = []

    with task_lock:
        for task_id, task in tasks.items():
            if current_time - task.get('last_update', current_time) > 3600:  # 1小时前的任务
                tasks_to_remove.append(task_id)

        for task_id in tasks_to_remove:
            del tasks[task_id]
            print(f"清理旧任务: {task_id}")


def schedule_cleanup():
    """定时清理任务"""
    while True:
        time.sleep(300)  # 每5分钟清理一次
        cleanup_tasks()


# 启动定时清理线程
cleanup_thread = threading.Thread(target=schedule_cleanup)
cleanup_thread.daemon = True
cleanup_thread.start()

if __name__ == '__main__':
    print("=" * 60)
    print("数学公式识别与LaTeX转换系统")
    print("=" * 60)
    print(f"模型路径: {MODEL_PATH}", flush=True)
    print("预处理方法: haubu_fuzhi_test.py预处理", flush=True)
    print("检测方法: TEST.py YOLO推理裁剪", flush=True)
    print("识别方法: pix2tex", flush=True)
    print("访问地址: http://127.0.0.1:5000", flush=True)
    print("=" * 60, flush=True)

    # ====================== 🔥 关键修改：永久等待，无超时 ======================
    print("⏳ 正在后台加载模型（不会自动中断，请等待模型下载完成）...", flush=True)

    # 无限循环等待，直到模型加载完成
    while True:
        if detector is not None:
            print("✅ 模型初始化完成！服务已启动", flush=True)
            break
        time.sleep(2)  # 每2秒检查一次，不打印日志

    # 检查pix2tex状态
    if not detector.use_pix2tex:
        print("⚠️ 警告: pix2tex模型加载失败，LaTeX识别功能不可用", flush=True)
        print("但公式检测功能仍然可用", flush=True)

    # 启动服务
    app.run(host='127.0.0.1', port=5000, debug=False, threaded=True)