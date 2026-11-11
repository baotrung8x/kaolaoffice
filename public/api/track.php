<?php
/**
 * ONLYOFFICE Document Server Callback Webhook
 * Khi người dùng sửa văn bản và đóng phiên soạn thảo, Document Server gửi POST thông báo lưu về đây.
 */

header('Content-Type: application/json; charset=utf-8');

$storageDir = realpath(__DIR__ . '/../storage');
$filename = basename($_GET['file'] ?? '');
$userId = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', trim($_GET['user_id'] ?? ''));

$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data) {
    echo json_encode(["error" => 0]);
    exit;
}

$status = $data["status"] ?? 0;
// status 2: Ready for saving
// status 6: Document being edited, but saving is forced (forcesave)
if (($status === 2 || $status === 6) && !empty($data["url"])) {
    $downloadUrl = $data["url"];
    
    if (!empty($userId)) {
        $userDir = $storageDir . '/users/' . $userId;
        if (!file_exists($userDir)) {
            mkdir($userDir, 0777, true);
        }
        $targetFile = $userDir . '/' . $filename;
    } else {
        $targetFile = $storageDir . '/' . $filename;
    }

    if (!empty($filename)) {
        // Tải nội dung tệp mới lưu từ ONLYOFFICE Document Server
        $newContent = file_get_contents($downloadUrl);
        if ($newContent !== false) {
            file_put_contents($targetFile, $newContent);
        }
    }
}

// Bắt buộc trả về {"error": 0} để ONLYOFFICE Document Server xác nhận lưu thành công
echo json_encode(["error" => 0]);
