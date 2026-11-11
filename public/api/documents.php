<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$baseStorageDir = realpath(__DIR__ . '/../storage');
$templatesDir = realpath(__DIR__ . '/../templates');

if (!$baseStorageDir) {
    mkdir(__DIR__ . '/../storage', 0777, true);
    $baseStorageDir = realpath(__DIR__ . '/../storage');
}

// 1. Xác định thư mục đồng bộ Kaola Drive Office (ưu tiên thư mục trên máy tính cục bộ)
$officeDir = realpath(__DIR__ . '/../storage/office');
if (!$officeDir || !is_dir($officeDir)) {
    $userHome = getenv('USERPROFILE') ?: 'C:/Users/' . (getenv('USERNAME') ?: 'TrungNguyen');
    $candOffice = $userHome . '/KaolaDrive/Office';
    if (is_dir($candOffice)) {
        $officeDir = realpath($candOffice) ?: $candOffice;
    }
}

// Lấy user_id từ request (Kaola ID đăng nhập)
$userId = trim($_GET['user_id'] ?? $_POST['user_id'] ?? '');
$action = $_GET['action'] ?? $_POST['action'] ?? 'list';

// Nếu có user_id: ưu tiên lưu vào Kaola Drive Office
if (!empty($userId)) {
    $safeUserId = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $userId);
    if ($officeDir && is_dir($officeDir)) {
        $storageDir = $officeDir;
        $urlPrefix = getBaseUrl() . '/storage/office/';
        $isKaolaDrive = true;
    } else {
        $storageDir = $baseStorageDir . '/users/' . $safeUserId;
        if (!file_exists($storageDir)) {
            @mkdir($storageDir, 0777, true);
        }
        $urlPrefix = getBaseUrl() . '/storage/users/' . $safeUserId . '/';
        $isKaolaDrive = false;
    }
} else {
    // Không cho phép khách vãng lai lưu trữ tài liệu
    $storageDir = null;
    $urlPrefix = '';
    $isKaolaDrive = false;
}

switch ($action) {
    case 'list':
        // Nếu chưa đăng nhập, trả về danh sách rỗng và yêu cầu đăng nhập
        if (empty($userId) || !$storageDir || !file_exists($storageDir)) {
            echo json_encode([
                'success' => true,
                'authenticated' => false,
                'message' => 'Vui lòng đăng nhập tài khoản Kaola ID để xem và quản lý tài liệu.',
                'documents' => []
            ]);
            break;
        }

        $files = [];
        $items = scandir($storageDir);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..' || is_dir($storageDir . '/' . $item)) continue;
            
            $path = $storageDir . '/' . $item;
            $ext = strtolower(pathinfo($item, PATHINFO_EXTENSION));
            $type = 'other';
            if (in_array($ext, ['doc', 'docx', 'odt', 'rtf', 'txt'])) $type = 'word';
            elseif (in_array($ext, ['xls', 'xlsx', 'ods', 'csv'])) $type = 'cell';
            elseif (in_array($ext, ['ppt', 'pptx', 'odp'])) $type = 'slide';
            elseif ($ext === 'pdf') $type = 'pdf';

            $files[] = [
                'id' => md5($item),
                'name' => $item,
                'extension' => $ext,
                'type' => $type,
                'size' => filesize($path),
                'sizeFormatted' => formatBytes(filesize($path)),
                'updatedAt' => filemtime($path),
                'updatedAtFormatted' => date('d/m/Y H:i', filemtime($path)),
                'url' => $urlPrefix . rawurlencode($item),
                'location' => $isKaolaDrive ? 'Kaola Drive (Office)' : 'Kaola Cloud / Lưu trữ cá nhân',
                'key' => md5($item . '_' . filemtime($path))
            ];
        }

        usort($files, function($a, $b) {
            return $b['updatedAt'] - $a['updatedAt'];
        });

        echo json_encode([
            'success' => true,
            'authenticated' => true,
            'is_drive_connected' => $isKaolaDrive,
            'drive_path' => $storageDir ?: '',
            'documents' => $files
        ]);
        break;

    case 'create':
        if (empty($userId) || !$storageDir) {
            echo json_encode([
                'success' => false,
                'require_login' => true,
                'message' => 'Vui lòng đăng nhập tài khoản Kaola ID để tạo và lưu trữ văn bản trên đám mây.'
            ]);
            exit;
        }

        $type = $_POST['type'] ?? 'word';
        $name = trim($_POST['name'] ?? '');
        $template = $_POST['template'] ?? '';

        $extMap = ['word' => 'docx', 'cell' => 'xlsx', 'slide' => 'pptx', 'pdf' => 'pdf'];
        $ext = $extMap[$type] ?? 'docx';

        if (empty($name)) {
            $dateStr = date('Ymd_His');
            if ($type === 'word') $name = "Tai_lieu_$dateStr";
            elseif ($type === 'cell') $name = "Bang_tinh_$dateStr";
            elseif ($type === 'slide') $name = "Bai_thuyet_trinh_$dateStr";
            elseif ($type === 'pdf') $name = "Tai_lieu_$dateStr";
            else $name = "Van_ban_$dateStr";
        }

        if (!str_ends_with(strtolower($name), '.' . $ext)) {
            $name .= '.' . $ext;
        }

        $filename = $name;
        $counter = 1;
        while (file_exists($storageDir . '/' . $filename)) {
            $info = pathinfo($name);
            $filename = $info['filename'] . " ($counter)." . $info['extension'];
            $counter++;
        }

        $sourceTemplate = $templatesDir . '/new.' . $ext;
        if (!empty($template)) {
            $cleanTmpl = basename($template);
            if (file_exists($templatesDir . '/' . $template)) {
                $sourceTemplate = $templatesDir . '/' . $template;
            } elseif (file_exists($templatesDir . '/files/' . $cleanTmpl)) {
                $sourceTemplate = $templatesDir . '/files/' . $cleanTmpl;
            } elseif (file_exists($templatesDir . '/' . $cleanTmpl)) {
                $sourceTemplate = $templatesDir . '/' . $cleanTmpl;
            }
        }

        if (file_exists($sourceTemplate)) {
            copy($sourceTemplate, $storageDir . '/' . $filename);
        } else {
            file_put_contents($storageDir . '/' . $filename, "");
        }

        $filePath = $storageDir . '/' . $filename;
        echo json_encode([
            'success' => true,
            'document' => [
                'id' => md5($filename),
                'name' => $filename,
                'extension' => $ext,
                'type' => $type,
                'size' => filesize($filePath),
                'url' => $urlPrefix . rawurlencode($filename),
                'location' => $isKaolaDrive ? 'Kaola Drive (Office)' : 'Kaola Cloud / Lưu trữ cá nhân',
                'key' => md5($filename . '_' . filemtime($filePath))
            ]
        ]);
        break;

    case 'upload':
        if (empty($userId) || !$storageDir) {
            echo json_encode([
                'success' => false,
                'require_login' => true,
                'message' => 'Vui lòng đăng nhập tài khoản Kaola ID để tải tệp lên đám mây.'
            ]);
            exit;
        }

        if (!isset($_FILES['file'])) {
            echo json_encode(['success' => false, 'message' => 'Không có tệp tải lên']);
            exit;
        }

        $uploadedFile = $_FILES['file'];
        if ($uploadedFile['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(['success' => false, 'message' => 'Lỗi khi tải tệp lên: ' . $uploadedFile['error']]);
            exit;
        }

        $originalName = basename($uploadedFile['name']);
        $filename = $originalName;
        $counter = 1;
        while (file_exists($storageDir . '/' . $filename)) {
            $info = pathinfo($originalName);
            $filename = $info['filename'] . " ($counter)." . ($info['extension'] ?? '');
            $counter++;
        }

        if (move_uploaded_file($uploadedFile['tmp_name'], $storageDir . '/' . $filename)) {
            $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            $type = 'other';
            if (in_array($ext, ['doc', 'docx', 'odt', 'rtf', 'txt'])) $type = 'word';
            elseif (in_array($ext, ['xls', 'xlsx', 'ods', 'csv'])) $type = 'cell';
            elseif (in_array($ext, ['ppt', 'pptx', 'odp'])) $type = 'slide';
            elseif ($ext === 'pdf') $type = 'pdf';

            $filePath = $storageDir . '/' . $filename;
            echo json_encode([
                'success' => true,
                'document' => [
                    'id' => md5($filename),
                    'name' => $filename,
                    'extension' => $ext,
                    'type' => $type,
                    'size' => filesize($filePath),
                    'url' => $urlPrefix . rawurlencode($filename),
                    'location' => $isKaolaDrive ? 'Kaola Drive (Office)' : 'Kaola Cloud / Lưu trữ cá nhân',
                    'key' => md5($filename . '_' . filemtime($filePath))
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Không thể lưu tệp vào thư mục người dùng']);
        }
        break;

    case 'delete':
        if (empty($userId) || !$storageDir) {
            echo json_encode(['success' => false, 'message' => 'Yêu cầu đăng nhập']);
            exit;
        }

        $filename = $_POST['filename'] ?? $_GET['filename'] ?? '';
        $filename = basename($filename);
        $target = $storageDir . '/' . $filename;
        if (!empty($filename) && file_exists($target)) {
            unlink($target);
            echo json_encode(['success' => true, 'message' => 'Đã xóa tệp']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Không tìm thấy tệp để xóa']);
        }
        break;

    case 'open_local_folder':
        $folderPath = $officeDir ?: (realpath(__DIR__ . '/../storage/office') ?: 'C:\\Users\\TrungNguyen\\KaolaDrive\\Office');
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            pclose(popen("start explorer " . escapeshellarg($folderPath), "r"));
            echo json_encode(['success' => true, 'message' => 'Đã mở thư mục trên máy tính', 'path' => $folderPath]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Tính năng này hỗ trợ hệ điều hành Windows']);
        }
        break;

    case 'drive_info':
        $folderPath = $officeDir ?: (realpath(__DIR__ . '/../storage/office') ?: 'C:\\Users\\TrungNguyen\\KaolaDrive\\Office');
        echo json_encode([
            'success' => true,
            'is_connected' => true,
            'folder_path' => $folderPath,
            'cloud_url' => 'https://drive.kaola.vn',
            'sync_agent' => 'Kaola Drive Desktop (Active)'
        ]);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Hành động không hợp lệ']);
        break;
}

function formatBytes($bytes, $precision = 1) {
    $units = ['B', 'KB', 'MB', 'GB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= pow(1024, $pow);
    return round($bytes, $precision) . ' ' . $units[$pow];
}

function getBaseUrl() {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'] ?? 'kaolaoffice.test';
    return $protocol . $host;
}
