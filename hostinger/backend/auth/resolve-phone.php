<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$phone = $data['phone'] ?? null;

if (!$phone) {
    http_response_code(400);
    echo json_encode(['error' => 'Telefone é obrigatório']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    $normalizedPhone = normalizePhone($phone);
    
    $stmt = $db->prepare("SELECT email FROM users WHERE phone = ? OR phone = ?");
    $stmt->execute([$normalizedPhone, $phone]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'Usuário não encontrado']);
        exit();
    }
    
    echo json_encode(['email' => $user['email']]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao resolver telefone: ' . $e->getMessage()]);
}
?>
