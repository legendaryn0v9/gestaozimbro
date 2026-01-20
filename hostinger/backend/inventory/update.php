<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

$authUser = requireAuth();

$id = $_GET['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'ID do item é obrigatório']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

$database = new Database();
$db = $database->getConnection();

try {
    // Campos permitidos para atualização
    $fields = [];
    $values = [];
    
    $allowedFields = ['name', 'description', 'quantity', 'min_quantity', 'unit', 'sector', 'category', 'image_url', 'price'];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $fields[] = "$field = ?";
            $values[] = $data[$field];
        }
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nenhum campo para atualizar']);
        exit();
    }
    
    $values[] = $id;
    $sql = "UPDATE inventory_items SET " . implode(', ', $fields) . " WHERE id = ?";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($values);
    
    // Registrar histórico de edições se houver changes
    if (isset($data['changes']) && is_array($data['changes'])) {
        foreach ($data['changes'] as $change) {
            $historyId = generateUUID();
            $stmtHistory = $db->prepare("
                INSERT INTO product_edit_history (id, item_id, user_id, item_name_snapshot, field_changed, old_value, new_value)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmtHistory->execute([
                $historyId,
                $id,
                $authUser['user_id'],
                $data['name'] ?? '',
                $change['field'],
                $change['oldValue'],
                $change['newValue']
            ]);
        }
    }
    
    // Retornar o item atualizado
    $stmt = $db->prepare("SELECT * FROM inventory_items WHERE id = ?");
    $stmt->execute([$id]);
    $item = $stmt->fetch();
    
    echo json_encode($item);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao atualizar item: ' . $e->getMessage()]);
}
?>
