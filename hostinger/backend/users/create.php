<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

requireAdmin();

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['phone']) || !isset($data['password']) || !isset($data['full_name'])) {
    http_response_code(400);
    echo json_encode(['error' => 'phone, password e full_name são obrigatórios']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    $normalizedPhone = normalizePhone($data['phone']);
    
    // Verificar se telefone já existe
    $stmt = $db->prepare("SELECT id FROM users WHERE phone = ?");
    $stmt->execute([$normalizedPhone]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Telefone já cadastrado']);
        exit();
    }
    
    // Criar usuário
    $userId = generateUUID();
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
    $fakeEmail = $normalizedPhone . '@phone.local';
    
    $stmt = $db->prepare("INSERT INTO users (id, email, password, full_name, phone, sector, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $userId, 
        $fakeEmail, 
        $hashedPassword, 
        $data['full_name'],
        $normalizedPhone,
        $data['sector'] ?? null,
        $data['avatar_url'] ?? null
    ]);
    
    // Atribuir role
    $roleId = generateUUID();
    $role = $data['role'] ?? 'funcionario';
    $stmt = $db->prepare("INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)");
    $stmt->execute([$roleId, $userId, $role]);
    
    echo json_encode([
        'id' => $userId,
        'email' => $fakeEmail,
        'full_name' => $data['full_name'],
        'phone' => $normalizedPhone,
        'sector' => $data['sector'] ?? null,
        'role' => $role
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao criar usuário: ' . $e->getMessage()]);
}
?>
