<?php
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$authUser = requireAdmin(); // Only admins can cancel movements

$id = $_GET['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Movement ID is required']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    $db->beginTransaction();
    
    // Get the movement
    $stmt = $db->prepare("SELECT * FROM stock_movements WHERE id = ?");
    $stmt->execute([$id]);
    $movement = $stmt->fetch();
    
    if (!$movement) {
        http_response_code(404);
        echo json_encode(['error' => 'Movement not found']);
        exit();
    }
    
    // Get current item quantity
    $stmt = $db->prepare("SELECT quantity FROM inventory_items WHERE id = ?");
    $stmt->execute([$movement['item_id']]);
    $item = $stmt->fetch();
    
    if (!$item) {
        http_response_code(404);
        echo json_encode(['error' => 'Item not found']);
        exit();
    }
    
    // Calculate reversed quantity
    $currentQty = $item['quantity'];
    if ($movement['movement_type'] === 'entrada') {
        $newQuantity = $currentQty - $movement['quantity'];
    } else {
        $newQuantity = $currentQty + $movement['quantity'];
    }
    
    if ($newQuantity < 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Cannot cancel: would result in negative stock']);
        exit();
    }
    
    // Update item quantity
    $stmt = $db->prepare("UPDATE inventory_items SET quantity = ? WHERE id = ?");
    $stmt->execute([$newQuantity, $movement['item_id']]);
    
    // Delete the movement
    $stmt = $db->prepare("DELETE FROM stock_movements WHERE id = ?");
    $stmt->execute([$id]);
    
    $db->commit();
    
    echo json_encode(['success' => true, 'message' => 'Movement cancelled']);
} catch (PDOException $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Failed to cancel movement: ' . $e->getMessage()]);
}
?>
