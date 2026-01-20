<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

$authUser = requireAuth();

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['item_id']) || !isset($data['movement_type']) || !isset($data['quantity'])) {
    http_response_code(400);
    echo json_encode(['error' => 'item_id, movement_type e quantity são obrigatórios']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    $db->beginTransaction();
    
    // Buscar item atual
    $stmt = $db->prepare("SELECT * FROM inventory_items WHERE id = ? FOR UPDATE");
    $stmt->execute([$data['item_id']]);
    $item = $stmt->fetch();
    
    if (!$item) {
        $db->rollBack();
        http_response_code(404);
        echo json_encode(['error' => 'Item não encontrado']);
        exit();
    }
    
    $currentQty = floatval($item['quantity']);
    $moveQty = floatval($data['quantity']);
    
    // Calcular nova quantidade
    if ($data['movement_type'] === 'entrada') {
        $newQuantity = $currentQty + $moveQty;
    } else {
        $newQuantity = $currentQty - $moveQty;
        if ($newQuantity < 0) {
            $db->rollBack();
            http_response_code(400);
            echo json_encode(['error' => 'Estoque insuficiente']);
            exit();
        }
    }
    
    // Atualizar quantidade do item
    $stmt = $db->prepare("UPDATE inventory_items SET quantity = ? WHERE id = ?");
    $stmt->execute([$newQuantity, $data['item_id']]);
    
    // Criar movimentação
    $movementId = generateUUID();
    $stmt = $db->prepare("
        INSERT INTO stock_movements (id, item_id, user_id, movement_type, quantity, notes, item_name_snapshot, item_sector, item_unit, item_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $movementId,
        $data['item_id'],
        $authUser['user_id'],
        $data['movement_type'],
        $moveQty,
        $data['notes'] ?? null,
        $item['name'],
        $item['sector'],
        $item['unit'],
        $item['price']
    ]);
    
    $db->commit();
    
    // Retornar movimentação criada
    $stmt = $db->prepare("
        SELECT sm.*, i.name as item_name, i.sector, u.full_name as user_name
        FROM stock_movements sm
        LEFT JOIN inventory_items i ON sm.item_id = i.id
        JOIN users u ON sm.user_id = u.id
        WHERE sm.id = ?
    ");
    $stmt->execute([$movementId]);
    $movement = $stmt->fetch();
    
    http_response_code(201);
    echo json_encode($movement);
} catch (PDOException $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao criar movimentação: ' . $e->getMessage()]);
}
?>
