<?php
// Habilitar reporte de errores para desarrollo
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configurar conexión con la base de datos
require_once 'conexion.php';

// Headers primero, antes de cualquier salida
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Verificar si la solicitud es POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['exito' => false, 'mensaje' => 'Método no permitido']);
    exit;
}

// Obtener datos del POST
$input = file_get_contents('php://input');
if (!empty($input)) {
    $_POST = json_decode($input, true);
}

try {
    // Validar campos requeridos
    $required = ['cliente', 'equipo', 'garantia'];
    foreach ($required as $field) {
        if (empty($_POST[$field])) {
            http_response_code(400);
            echo json_encode(['exito' => false, 'mensaje' => "El campo $field es obligatorio"]);
            exit;
        }
    }

    // Asignar valores
    $cliente = $_POST['cliente'];
    $sucursal = $_POST['sucursal'] ?? '';
    $equipo = $_POST['equipo'];
    $marca = $_POST['marca'] ?? '';
    $modelo = $_POST['modelo'] ?? '';
    $numero_serie = $_POST['numero_serie'] ?? '';
    $garantia = $_POST['garantia'];
    $notas = $_POST['notas'] ?? '';

    // Preparar consulta SQL
    $sql = "INSERT INTO ventas (cliente, sucursal, equipo, marca, modelo, numero_serie, garantia, notas) 
            VALUES (:cliente, :sucursal, :equipo, :marca, :modelo, :numero_serie, :garantia, :notas)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':cliente' => $cliente,
        ':sucursal' => $sucursal,
        ':equipo' => $equipo,
        ':marca' => $marca,
        ':modelo' => $modelo,
        ':numero_serie' => $numero_serie,
        ':garantia' => $garantia,
        ':notas' => $notas
    ]);

    // Éxito
    http_response_code(200);
    echo json_encode(['exito' => true, 'mensaje' => 'Venta registrada exitosamente']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'exito' => false, 
        'mensaje' => 'Error en la base de datos',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'exito' => false, 
        'mensaje' => 'Error en el servidor',
        'error' => $e->getMessage()
    ]);
}
?>