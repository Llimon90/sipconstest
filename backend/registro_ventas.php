<?php
// Configuración inicial
header_remove(); // Limpiar headers anteriores
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Desactivar visualización de errores PHP en producción
ini_set('display_errors', 0);
error_reporting(0);

// Función para enviar respuestas JSON consistentes
function sendResponse($success, $message, $data = [], $statusCode = 200) {
    http_response_code($statusCode);
    die(json_encode([
        'exito' => $success,
        'mensaje' => $message,
        'data' => $data
    ]));
}

try {
    // Verificar método HTTP
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(false, 'Método no permitido', [], 405);
    }

    // Obtener datos JSON del cuerpo de la solicitud
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    // Si no hay datos JSON, intentar con $_POST normal
    if (json_last_error() !== JSON_ERROR_NONE) {
        $data = $_POST;
    }

    // Validar campos requeridos
    $required = ['cliente', 'equipo', 'garantia'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendResponse(false, "El campo $field es obligatorio", [], 400);
        }
    }

    // Incluir conexión a BD
    require_once 'conexion.php';

    // Preparar consulta SQL con parámetros nombrados
    $sql = "INSERT INTO ventas (cliente, sucursal, equipo, marca, modelo, numero_serie, garantia, notas) 
            VALUES (:cliente, :sucursal, :equipo, :marca, :modelo, :numero_serie, :garantia, :notas)";
    
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([
        ':cliente' => $data['cliente'],
        ':sucursal' => $data['sucursal'] ?? null,
        ':equipo' => $data['equipo'],
        ':marca' => $data['marca'] ?? null,
        ':modelo' => $data['modelo'] ?? null,
        ':numero_serie' => $data['numero_serie'] ?? null,
        ':garantia' => $data['garantia'],
        ':notas' => $data['notas'] ?? null
    ]);

    if ($success) {
        sendResponse(true, 'Venta registrada exitosamente');
    } else {
        sendResponse(false, 'Error al registrar la venta');
    }

} catch (PDOException $e) {
    // Registrar error en logs sin exponer detalles al cliente
    error_log("Error en registro_venta.php: " . $e->getMessage());
    sendResponse(false, 'Error en la base de datos', [], 500);
} catch (Exception $e) {
    error_log("Error general en registro_venta.php: " . $e->getMessage());
    sendResponse(false, 'Error en el servidor', [], 500);
}
?>