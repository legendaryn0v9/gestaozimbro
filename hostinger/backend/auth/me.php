<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

$authUser = requireAuth();

$database = new Database();
$db = $database->getConnection();

try {
    $stmt = $db->prepare("
        SELECT u.id, u.email, u.full_name, u.phone, u.sector, u.avatar_url, ur.role 
        FROM users u 
        LEFT JOIN user_roles ur ON u.id = ur.user_id 
        WHERE u.id = ?
    ");
    $stmt->execute([$authUser['user_id']]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'Usuário não encontrado']);
        exit();
    }
    
    echo json_encode([
        'id' => $user['id'],
        'email' => $user['email'],
        'full_name' => $user['full_name'],
        'phone' => $user['phone'],
        'sector' => $user['sector'],
        'avatar_url' => $user['avatar_url'],
        'role' => $user['role'] ?? 'funcionario'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar usuário: ' . $e->getMessage()]);
}
?>
