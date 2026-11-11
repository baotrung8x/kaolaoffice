import os
import sys
import urllib.request
import zipfile
import shutil
import time

RUNTIME_URL = "https://github.com/ONLYOFFICE/DesktopEditors/releases/download/v10.0.0/DesktopEditors_x64.zip"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOWNLOAD_CACHE = os.path.join(BASE_DIR, "DesktopEditors_x64.zip")
TARGET_DIR = os.path.join(BASE_DIR, "app")

def format_size(bytes_num):
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_num < 1024.0:
            return f"{bytes_num:.2f} {unit}"
        bytes_num /= 1024.0
    return f"{bytes_num:.2f} TB"

def download_file(url, target_path):
    print(f"Downloading from {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    with urllib.request.urlopen(req) as response, open(target_path, 'wb') as out_file:
        total_size = int(response.headers.get('Content-Length', 0))
        downloaded = 0
        block_size = 1024 * 1024 # 1MB chunks
        start_time = time.time()
        last_print = 0

        while True:
            buffer = response.read(block_size)
            if not buffer:
                break
            downloaded += len(buffer)
            out_file.write(buffer)
            
            now = time.time()
            if now - last_print > 1.5 or downloaded == total_size:
                elapsed = max(now - start_time, 0.1)
                speed = downloaded / elapsed
                percent = (downloaded / total_size) * 100 if total_size else 0
                print(f"Progress: {format_size(downloaded)} / {format_size(total_size)} ({percent:.1f}%) - Speed: {format_size(speed)}/s")
                last_print = now

    print(f"Download complete: {target_path}")

def extract_zip(zip_path, target_dir):
    print(f"Extracting {zip_path} to {target_dir}...")
    os.makedirs(target_dir, exist_ok=True)
    with zipfile.ZipFile(zip_path, 'r') as zf:
        members = zf.namelist()
        total = len(members)
        print(f"Total files in archive: {total}")
        zf.extractall(target_dir)
    print("Extraction completed successfully!")

def main():
    print(f"Base Directory: {BASE_DIR}")
    print(f"Target App Directory: {TARGET_DIR}")

    if not os.path.exists(DOWNLOAD_CACHE):
        download_file(RUNTIME_URL, DOWNLOAD_CACHE)
    else:
        print(f"Using existing archive: {DOWNLOAD_CACHE}")

    if not os.path.exists(os.path.join(TARGET_DIR, "DesktopEditors.exe")):
        extract_zip(DOWNLOAD_CACHE, TARGET_DIR)
    else:
        print(f"Runtime is already extracted in {TARGET_DIR}")

    print("\n--- Runtime Setup Finished ---")

if __name__ == "__main__":
    main()
