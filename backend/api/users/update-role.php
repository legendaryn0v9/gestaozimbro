<?php
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

requireAdmin();

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['user_id']) || !isset($data['role'])) {
    http_response_code(400);
    echo json_encode(['error' => 'user_id and role are required']);
    exit();
}

if (!in_array($data['role'], ['admin', 'funcionario'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid role']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    // Check if user exists
    $stmt = $db->prepare("SELECT id FROM users WHERE id = ?");
    $stmt->execute([$data['user_id']]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit();
    }
    
    // Update or insert role
    $stmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = ?");
    $stmt->execute([$data['user_id']]);
    
    if ($stmt->fetch()) {
        $stmt = $db->prepare("UPDATE user_roles SET role = ? WHERE user_id = ?");
        $stmt->execute([$data['role'], $data['user_id']]);
    } else {
        $roleId = bin2hex(random_bytes(16));
        $stmt = $db->prepare("INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)");
        $stmt->execute([$roleId, $data['user_id'], $data['role']]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Role updated']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update role: ' . $e->getMessage()]);
}
?>
