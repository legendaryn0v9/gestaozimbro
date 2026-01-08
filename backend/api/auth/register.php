<?php
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['email']) || !isset($data['password']) || !isset($data['full_name'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email, password and full_name are required']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    // Check if email already exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already registered']);
        exit();
    }
    
    // Create user
    $userId = bin2hex(random_bytes(16));
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
    
    $stmt = $db->prepare("INSERT INTO users (id, email, password, full_name) VALUES (?, ?, ?, ?)");
    $stmt->execute([$userId, $data['email'], $hashedPassword, $data['full_name']]);
    
    // Assign default role
    $roleId = bin2hex(random_bytes(16));
    $stmt = $db->prepare("INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'funcionario')");
    $stmt->execute([$roleId, $userId]);
    
    $token = generateToken($userId, $data['email'], 'funcionario');
    
    echo json_encode([
        'token' => $token,
        'user' => [
            'id' => $userId,
            'email' => $data['email'],
            'full_name' => $data['full_name'],
            'role' => 'funcionario'
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Registration failed: ' . $e->getMessage()]);
}
?>
