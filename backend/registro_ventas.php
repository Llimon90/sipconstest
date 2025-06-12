<?php
// Configuración inicial
header_remove();
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Configuración de errores (para desarrollo)
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Función para enviar respuestas JSON
function sendResponse($success, $message, $data = [], $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        'exito' => $success,
        'mensaje' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit;
}

// Manejo de la solicitud
try {
    // Verificar método HTTP
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(false, 'Método no permitido', [], 405);
    }

    // Obtener datos JSON del cuerpo de la solicitud
    $jsonInput = file_get_contents('php://input');
    $data = json_decode($jsonInput, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse(false, 'Error al decodificar JSON: ' . json_last_error_msg(), [], 400);
    }

    // Validar campos requeridos
    $requiredFields = ['cliente', 'equipo', 'garantia'];
    $missingFields = [];
    
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            $missingFields[] = $field;
        }
    }
    
    if (!empty($missingFields)) {
        sendResponse(false, 'Campos obligatorios faltantes: ' . implode(', ', $missingFields), [], 400);
    }

    // Incluir conexión a BD
    require_once 'conexion.php';

    // Preparar consulta SQL
    $sql = "INSERT INTO ventas (
                cliente, 
                sucursal, 
                equipo, 
                marca, 
                modelo, 
                numero_serie, 
                qty,
                garantia, 
                servicio,
                notas,
                fecha_registro
            ) VALUES (
                :cliente, 
                :sucursal, 
                :equipo, 
                :marca, 
                :modelo, 
                :numero_serie, 
                :qty,
                :garantia, 
                :servicio,
                :notas,
                NOW()
            )";
    
    $stmt = $pdo->prepare($sql);
    
    // Parámetros para la consulta
    $params = [
        ':cliente' => $data['cliente'] ?? null,
        ':sucursal' => $data['sucursal'] ?? null,
        ':equipo' => $data['equipo'] ?? null,
        ':marca' => $data['marca'] ?? null,
        ':modelo' => $data['modelo'] ?? null,
        ':numero_serie' => $data['numero_serie'] ?? null,
        ':qty' => $data['qty'] ?? 1,
        ':garantia' => $data['garantia'] ?? null,
        ':servicio' => $data['servicio'] ? 1 : 0,
        ':notas' => $data['notas'] ?? null
    ];
    
    // Ejecutar la consulta
    $success = $stmt->execute($params);
    
    if ($success) {
        $ventaId = $pdo->lastInsertId();
        sendResponse(true, 'Venta registrada exitosamente', ['id_venta' => $ventaId]);
    } else {
        $errorInfo = $stmt->errorInfo();
        error_log("Error al ejecutar consulta: " . print_r($errorInfo, true));
        sendResponse(false, 'Error al registrar la venta en la base de datos', [], 500);
    }

} catch (PDOException $e) {
    error_log("Error PDO: " . $e->getMessage());
    sendResponse(false, 'Error en la base de datos: ' . $e->getMessage(), [], 500);
} catch (Exception $e) {
    error_log("Error general: " . $e->getMessage());
    sendResponse(false, 'Error en el servidor: ' . $e->getMessage(), [], 500);
}
?>