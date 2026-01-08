<?php
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$authUser = requireAuth();

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['item_id']) || !isset($data['movement_type']) || !isset($data['quantity'])) {
    http_response_code(400);
    echo json_encode(['error' => 'item_id, movement_type and quantity are required']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    $db->beginTransaction();
    
    // Get current item quantity
    $stmt = $db->prepare("SELECT quantity FROM inventory_items WHERE id = ?");
    $stmt->execute([$data['item_id']]);
    $item = $stmt->fetch();
    
    if (!$item) {
        http_response_code(404);
        echo json_encode(['error' => 'Item not found']);
        exit();
    }
    
    // Calculate new quantity
    $newQuantity = $item['quantity'];
    if ($data['movement_type'] === 'entrada') {
        $newQuantity += $data['quantity'];
    } else {
        $newQuantity -= $data['quantity'];
        if ($newQuantity < 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Insufficient stock']);
            exit();
        }
    }
    
    // Update item quantity
    $stmt = $db->prepare("UPDATE inventory_items SET quantity = ? WHERE id = ?");
    $stmt->execute([$newQuantity, $data['item_id']]);
    
    // Create movement record
    $movementId = bin2hex(random_bytes(16));
    $stmt = $db->prepare("
        INSERT INTO stock_movements (id, item_id, user_id, movement_type, quantity, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $movementId,
        $data['item_id'],
        $authUser['user_id'],
        $data['movement_type'],
        $data['quantity'],
        $data['notes'] ?? null
    ]);
    
    $db->commit();
    
    // Fetch and return the created movement
    $stmt = $db->prepare("
        SELECT sm.*, i.name as item_name, u.full_name as user_name
        FROM stock_movements sm
        JOIN inventory_items i ON sm.item_id = i.id
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
    echo json_encode(['error' => 'Failed to create movement: ' . $e->getMessage()]);
}
?>
