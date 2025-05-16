<?php
// Configurar conexión con la base de datos
require_once 'conexion.php';

// Verificar la conexión
if ($conn->connect_error) {
    die(json_encode(["error" => "Error de conexión: " . $conn->connect_error]));
}

// Permitir solicitudes desde el frontend
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Leer el método HTTP
$method = $_SERVER["REQUEST_METHOD"];

if ($method === "GET") {


}

// Validar y obtener los datos
$cliente = $_POST['cliente'] ?? '';
$sucursal = $_POST['sucursal'] ?? '';
$equipo = $_POST['equipo'] ?? '';
$marca = $_POST['marca'] ?? '';
$modelo = $_POST['modelo'] ?? '';
$numero_serie = $_POST['numero_serie'] ?? '';
$garantia = $_POST['garantia'] ?? '';
$notas = $_POST['notas'] ?? '';

if (!$cliente || !$sucursal || !$equipo || !$marca || !$modelo || !$numero_serie || !$garantia) {
  echo json_encode(['exito' => false, 'mensaje' => 'Todos los campos obligatorios deben ser completados.']);
  exit;
}

// Insertar en la base de datos
$sql = "INSERT INTO ventas (cliente, sucursal, equipo, marca, modelo, numero_serie, garantia, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
$stmt = $pdo->prepare($sql);

try {
  $stmt->execute([$cliente, $sucursal, $equipo, $marca, $modelo, $numero_serie, $garantia, $notas]);
  echo json_encode(['exito' => true, 'mensaje' => 'Venta registrada exitosamente.']);
} catch (PDOException $e) {
  echo json_encode(['exito' => false, 'mensaje' => 'Error al registrar la venta.']);
}
?>
