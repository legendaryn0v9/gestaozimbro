<?php
require_once '../config/database.php';
require_once '../lib/branding.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

$authUser = requireDono();

$type = $_GET['type'] ?? null;
if (!in_array($type, ['dashboard', 'login'], true)) {
    http_response_code(400);
    echo json_encode(['error' => 'type inválido (dashboard|login)']);
    exit();
}

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Arquivo "file" é obrigatório']);
    exit();
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Erro no upload']);
    exit();
}

// Basic validation
$maxBytes = 3 * 1024 * 1024; // 3MB
if ($file['size'] > $maxBytes) {
    http_response_code(400);
    echo json_encode(['error' => 'Arquivo muito grande (máx 3MB)']);
    exit();
}

$tmpPath = $file['tmp_name'];
$imageInfo = @getimagesize($tmpPath);
if ($imageInfo === false) {
    http_response_code(400);
    echo json_encode(['error' => 'Arquivo não é uma imagem válida']);
    exit();
}

$mime = $imageInfo['mime'] ?? '';
$allowed = [
    'image/png' => 'png',
    'image/jpeg' => 'jpg',
    'image/webp' => 'webp',
];

if (!isset($allowed[$mime])) {
    http_response_code(400);
    echo json_encode(['error' => 'Formato inválido. Use PNG, JPG ou WEBP']);
    exit();
}

$ext = $allowed[$mime];

$baseDir = __DIR__ . '/../uploads/branding';
if (!is_dir($baseDir)) {
    @mkdir($baseDir, 0755, true);
}

$fileName = $type . '-' . date('Ymd-His') . '-' . bin2hex(random_bytes(6)) . '.' . $ext;
$destPath = $baseDir . '/' . $fileName;

if (!@move_uploaded_file($tmpPath, $destPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Falha ao salvar o arquivo no servidor']);
    exit();
}

// Public URL served by Apache as static file under /api/uploads/...
$publicUrl = '/api/uploads/branding/' . $fileName;

$saveOk = branding_save_settings([
    $type === 'dashboard' ? 'dashboard_logo_url' : 'login_logo_url' => $publicUrl,
]);

if (!$saveOk) {
    http_response_code(500);
    echo json_encode(['error' => 'Falha ao salvar configurações da logo']);
    exit();
}

echo json_encode([
    'success' => true,
    'data' => [
        'url' => $publicUrl,
        'type' => $type,
    ]
]);
