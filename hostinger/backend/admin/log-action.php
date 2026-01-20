<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

$authUser = requireAdmin();

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['action_type'])) {
    http_response_code(400);
    echo json_encode(['error' => 'action_type é obrigatório']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    $id = generateUUID();
    
    $stmt = $db->prepare("
        INSERT INTO admin_actions (id, user_id, action_type, target_user_id, details)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $id,
        $authUser['user_id'],
        $data['action_type'],
        $data['target_user_id'] ?? null,
        $data['details'] ?? null
    ]);
    
    http_response_code(201);
    echo json_encode(['success' => true, 'id' => $id]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao registrar ação: ' . $e->getMessage()]);
}
?>
