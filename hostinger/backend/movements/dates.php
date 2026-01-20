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
    // Buscar datas únicas de movimentações
    $stmt = $db->query("SELECT DISTINCT DATE(created_at) as date FROM stock_movements ORDER BY date DESC");
    $dates = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode($dates);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar datas: ' . $e->getMessage()]);
}
?>
