<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

requireDono(); // Apenas Dono pode editar dados de usuários

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['user_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'user_id é obrigatório']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    // Verificar se usuário existe
    $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$data['user_id']]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'Usuário não encontrado']);
        exit();
    }
    
    // Atualizar senha se fornecida
    if (isset($data['password']) && !empty($data['password'])) {
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        $stmt = $db->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->execute([$hashedPassword, $data['user_id']]);
    }
    
    // Atualizar outros campos
    $fields = [];
    $values = [];
    
    if (isset($data['full_name'])) {
        $fields[] = "full_name = ?";
        $values[] = $data['full_name'];
    }
    if (isset($data['phone'])) {
        $normalizedPhone = normalizePhone($data['phone']);
        $fields[] = "phone = ?";
        $values[] = $normalizedPhone;
        // Atualizar email fake também
        $fields[] = "email = ?";
        $values[] = $normalizedPhone . '@phone.local';
    }
    if (isset($data['sector'])) {
        $fields[] = "sector = ?";
        $values[] = $data['sector'];
    }
    if (isset($data['avatar_url'])) {
        $fields[] = "avatar_url = ?";
        $values[] = $data['avatar_url'];
    }
    
    if (!empty($fields)) {
        $values[] = $data['user_id'];
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($values);
    }
    
    // Atualizar role se fornecido
    if (isset($data['role'])) {
        $stmt = $db->prepare("UPDATE user_roles SET role = ? WHERE user_id = ?");
        $stmt->execute([$data['role'], $data['user_id']]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Usuário atualizado']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao atualizar usuário: ' . $e->getMessage()]);
}
?>
