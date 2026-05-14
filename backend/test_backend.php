<?php
// TEST TEMPORAL — eliminar después
require_once __DIR__ . '/../auth/middleware.php';

echo json_encode([
    'middleware' => 'OK',
    'session_user' => $_SESSION['usuario'] ?? 'NO SESSION',
    'conn_status'  => $conn->connect_error ? 'ERROR: ' . $conn->connect_error : 'OK',
]);
