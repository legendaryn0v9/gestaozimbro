<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

requireAuth();

$id = $_GET['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'ID do item é obrigatório']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    $stmt = $db->prepare("DELETE FROM inventory_items WHERE id = ?");
    $stmt->execute([$id]);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Item não encontrado']);
        exit();
    }
    
    echo json_encode(['success' => true, 'message' => 'Item removido']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao remover item: ' . $e->getMessage()]);
}
?>
