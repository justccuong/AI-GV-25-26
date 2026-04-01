import os
import subprocess
import sys
import io

# Force UTF-8 encoding for stdout to handle Vietnamese characters in paths on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def main():
    # Xác định đường dẫn tuyệt đối đến thư mục backend
    # Khi chạy từ root, os.getcwd() sẽ là thư mục gốc của project
    base_dir = os.getcwd()
    backend_dir = os.path.join(base_dir, 'backend')
    
    # Logic nhận diện hệ điều hành
    if os.name == 'nt':  # Dành cho hệ Windows 
        python_exec = os.path.join(backend_dir, '.venv', 'Scripts', 'python.exe')
    else:                # Dành cho hệ MacOS / Linux
        python_exec = os.path.join(backend_dir, '.venv', 'bin', 'python')

    if not os.path.exists(python_exec):
        print("❌ Chà, tớ không tìm thấy môi trường ảo (.venv) đâu cả!")
        print(f"Đường dẫn đang tìm: {python_exec}")
        print("Cậu nhớ tạo .venv và cài đặt thư viện trước khi chạy nhé.")
        sys.exit(1)

    print(f"🚀 Bắt đầu gọi Uvicorn bằng: {python_exec}")
    
    # Setup đòn đánh: gọi thẳng uvicorn từ python trong .venv
    command = [python_exec, "-m", "uvicorn", "main:app", "--reload"]
    
    try:
        # Tung chiêu: Chạy lệnh, nhớ set cwd=backend_dir để nó chạy đúng bối cảnh thư mục
        subprocess.run(command, cwd=backend_dir, check=True)
    except KeyboardInterrupt:
        print("\n🛑 Đã ngắt kết nối server Backend gọn gàng.")
    except Exception as e:
        print(f"\n❌ Oái, có lỗi văng ra kìa: {e}")

if __name__ == "__main__":
    main()
