<?php
require_once '../config/database.php';
require_once '../lib/branding.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

// Public endpoint (used on login screen before authentication)

try {
    $settings = branding_get_settings();
    echo json_encode([ 'success' => true, 'data' => $settings ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro ao buscar branding']);
}
