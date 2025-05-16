<?php
// Configurar conexión con la base de datos
require_once 'conexion.php';

// Permitir solicitudes desde el frontend
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Verificar el método HTTP
$method = $_SERVER["REQUEST_METHOD"];

if ($method === "POST") {
    // Validar y obtener los datos
    $cliente = $_POST['cliente'] ?? '';
    $sucursal = $_POST['sucursal'] ?? '';
    $equipo = $_POST['equipo'] ?? '';
    $marca = $_POST['marca'] ?? '';
    $modelo = $_POST['modelo'] ?? '';
    $numero_serie = $_POST['numero_serie'] ?? '';
    $garantia = $_POST['garantia'] ?? '';
    $notas = $_POST['notas'] ?? '';

    if (empty($cliente) || empty($equipo) || empty($garantia)) {
        http_response_code(400);
        echo json_encode(['exito' => false, 'mensaje' => 'Completa los campos obligatorios']);
        exit;
    }

    try {
        // Insertar en la base de datos
        $sql = "INSERT INTO ventas (cliente, sucursal, equipo, marca, modelo, numero_serie, garantia, notas) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$cliente, $sucursal, $equipo, $marca, $modelo, $numero_serie, $garantia, $notas]);
        
        echo json_encode(['exito' => true, 'mensaje' => 'Venta registrada exitosamente.']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['exito' => false, 'mensaje' => 'Error al registrar la venta: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['exito' => false, 'mensaje' => 'Método no permitido']);
}
?>