<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

requireAuth();

$database = new Database();
$db = $database->getConnection();

try {
    $sector = $_GET['sector'] ?? null;
    
    if ($sector) {
        $stmt = $db->prepare("SELECT * FROM inventory_items WHERE sector = ? ORDER BY category, name");
        $stmt->execute([$sector]);
    } else {
        $stmt = $db->query("SELECT * FROM inventory_items ORDER BY sector, category, name");
    }
    
    $items = $stmt->fetchAll();
    echo json_encode($items);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar itens: ' . $e->getMessage()]);
}
?>
