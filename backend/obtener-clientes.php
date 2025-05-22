<?php
// Asegurar que el contenido devuelto sea JSON
header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', 0);

$host = "localhost";
$user = "sipcons1_appweb";
$password = "sip*SYS2025";
$database = "sipcons1_appweb";

// Conexión a la base de datos
$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión: ' . $conn->connect_error]);
    exit;
}

$sql = "SELECT * FROM clientes ORDER BY nombre";
$result = $conn->query($sql);

$clientes = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $clientes[] = $row;
    }
}

$busqueda = isset($_GET['busqueda']) ? $_GET['busqueda'] : '';

if ($busqueda) {
  // Preparar la consulta con búsqueda
  $stmt = $pdo->prepare("SELECT * FROM clientes WHERE nombre LIKE :busqueda OR rfc LIKE :busqueda OR direccion LIKE :busqueda OR telefono LIKE :busqueda OR contactos LIKE :busqueda OR email LIKE :busqueda");
  $stmt->execute(['busqueda' => '%' . $busqueda . '%']);
} else {
  // Obtener todos los clientes
  $stmt = $pdo->query("SELECT * FROM clientes");
}

$clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Devolver los resultados en formato JSON
echo json_encode($clientes);
echo json_encode($clientes);

$conn->close();
exit;

