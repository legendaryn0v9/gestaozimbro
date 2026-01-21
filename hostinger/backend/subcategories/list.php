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
    $categoryId = $_GET['category_id'] ?? null;

    if ($categoryId) {
        $stmt = $db->prepare("SELECT * FROM subcategories WHERE category_id = ? ORDER BY sort_order, name");
        $stmt->execute([$categoryId]);
        $rows = $stmt->fetchAll();
        echo json_encode($rows);
        exit();
    }

    if ($sector) {
        // List subcategories by sector (join categories)
        $stmt = $db->prepare("
            SELECT s.*
            FROM subcategories s
            INNER JOIN categories c ON c.id = s.category_id
            WHERE c.sector = ?
            ORDER BY c.name, s.sort_order, s.name
        ");
        $stmt->execute([$sector]);
        $rows = $stmt->fetchAll();
        echo json_encode($rows);
        exit();
    }

    $stmt = $db->query("SELECT * FROM subcategories ORDER BY category_id, sort_order, name");
    $rows = $stmt->fetchAll();
    echo json_encode($rows);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar subcategorias: ' . $e->getMessage()]);
}
?>
