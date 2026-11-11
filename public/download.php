<?php
/**
 * Kaola Office - Trình tải xuống bộ cài đặt Desktop (KaolaOffice_Setup.exe)
 */

$setupPath = realpath(__DIR__ . '/../package/Output/KaolaOffice_Setup.exe');

if (!$setupPath || !file_exists($setupPath)) {
    // Tìm các đường dẫn dự phòng
    $candidates = [
        __DIR__ . '/../package/Output/KaolaOffice_Setup.exe',
        __DIR__ . '/KaolaOffice_Setup.exe',
        'C:/laragon/www/kaolaoffice/package/Output/KaolaOffice_Setup.exe'
    ];
    foreach ($candidates as $cand) {
        if (file_exists($cand)) {
            $setupPath = realpath($cand);
            break;
        }
    }
}

if (!$setupPath || !file_exists($setupPath)) {
    http_response_code(404);
    echo '<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Bộ cài đặt đang được chuẩn bị</title>';
    echo '<style>body{font-family:sans-serif;text-align:center;padding:50px;background:#f8fafc;color:#1e293b;}</style></head><body>';
    echo '<h2>🚀 Bộ cài đặt KaolaOffice_Setup.exe đang được hệ thống đóng gói</h2>';
    echo '<p>Vui lòng thử lại sau giây lát hoặc liên hệ ban quản trị để nhận file cài đặt mới nhất.</p>';
    echo '<p><a href="/" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Quay lại Trang chủ</a></p>';
    echo '</body></html>';
    exit;
}

$filename = 'KaolaOffice_Setup.exe';
$filesize = filesize($setupPath);

// Tắt giới hạn thời gian chạy PHP để tải file lớn (>280MB)
set_time_limit(0);
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', '1');
}
@ini_set('zlib.output_compression', 'Off');

header('Content-Description: File Transfer');
header('Content-Type: application/vnd.microsoft.portable-executable');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Transfer-Encoding: binary');
header('Expires: 0');
header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
header('Pragma: public');
header('Content-Length: ' . $filesize);

// Xóa bộ đệm đầu ra để truyền trực tiếp
while (ob_get_level()) {
    ob_end_clean();
}

$handle = fopen($setupPath, 'rb');
if ($handle === false) {
    http_response_code(500);
    exit("Không thể đọc tệp bộ cài.");
}

$chunkSize = 1024 * 1024; // 1MB mỗi block
while (!feof($handle) && !connection_aborted()) {
    echo fread($handle, $chunkSize);
    flush();
}
fclose($handle);
exit;
