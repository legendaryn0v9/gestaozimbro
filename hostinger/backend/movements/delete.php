<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

$authUser = requireAdmin();

$id = $_GET['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'ID da movimentação é obrigatório']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    $db->beginTransaction();
    
    // Buscar movimentação
    $stmt = $db->prepare("SELECT * FROM stock_movements WHERE id = ?");
    $stmt->execute([$id]);
    $movement = $stmt->fetch();
    
    if (!$movement) {
        $db->rollBack();
        http_response_code(404);
        echo json_encode(['error' => 'Movimentação não encontrada']);
        exit();
    }
    
    // Buscar item atual
    $stmt = $db->prepare("SELECT quantity FROM inventory_items WHERE id = ?");
    $stmt->execute([$movement['item_id']]);
    $item = $stmt->fetch();
    
    if ($item) {
        $currentQty = floatval($item['quantity']);
        $moveQty = floatval($movement['quantity']);
        
        // Reverter a quantidade
        if ($movement['movement_type'] === 'entrada') {
            $newQuantity = $currentQty - $moveQty;
        } else {
            $newQuantity = $currentQty + $moveQty;
        }
        
        if ($newQuantity < 0) {
            $db->rollBack();
            http_response_code(400);
            echo json_encode(['error' => 'Não é possível cancelar: resultaria em estoque negativo']);
            exit();
        }
        
        // Atualizar quantidade do item
        $stmt = $db->prepare("UPDATE inventory_items SET quantity = ? WHERE id = ?");
        $stmt->execute([$newQuantity, $movement['item_id']]);
    }
    
    // Deletar movimentação
    $stmt = $db->prepare("DELETE FROM stock_movements WHERE id = ?");
    $stmt->execute([$id]);
    
    $db->commit();
    
    echo json_encode(['success' => true, 'message' => 'Movimentação cancelada']);
} catch (PDOException $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao cancelar movimentação: ' . $e->getMessage()]);
}
?>
