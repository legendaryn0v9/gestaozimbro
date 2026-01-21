<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

$authUser = requireAuth();

$targetUserId = $_POST['user_id'] ?? null;
if (!$targetUserId) {
    http_response_code(400);
    echo json_encode(['error' => 'user_id é obrigatório']);
    exit();
}

$role = $authUser['role'] ?? 'funcionario';
$isAdmin = in_array($role, ['admin', 'dono'], true);

// Only admin/dono can change other users
if (!$isAdmin && $targetUserId !== $authUser['user_id']) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso negado']);
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

$maxBytes = 2 * 1024 * 1024; // 2MB
if ($file['size'] > $maxBytes) {
    http_response_code(400);
    echo json_encode(['error' => 'Arquivo muito grande (máx 2MB)']);
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

$baseDir = __DIR__ . '/../uploads/avatars';
if (!is_dir($baseDir)) {
    @mkdir($baseDir, 0755, true);
}

$fileName = $targetUserId . '-' . date('Ymd-His') . '-' . bin2hex(random_bytes(6)) . '.' . $ext;
$destPath = $baseDir . '/' . $fileName;

if (!@move_uploaded_file($tmpPath, $destPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Falha ao salvar o arquivo no servidor']);
    exit();
}

$publicUrl = '/api/uploads/avatars/' . $fileName;

$database = new Database();
$db = $database->getConnection();

try {
    // Ensure user exists
    $stmt = $db->prepare('SELECT id FROM users WHERE id = ?');
    $stmt->execute([$targetUserId]);
    $found = $stmt->fetch();
    if (!$found) {
        http_response_code(404);
        echo json_encode(['error' => 'Usuário não encontrado']);
        exit();
    }

    $stmt = $db->prepare('UPDATE users SET avatar_url = ? WHERE id = ?');
    $stmt->execute([$publicUrl, $targetUserId]);

    echo json_encode([
        'success' => true,
        'data' => [
            'url' => $publicUrl,
            'user_id' => $targetUserId,
        ],
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao atualizar foto: ' . $e->getMessage()]);
}
