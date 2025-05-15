<?php
// Configuración de errores
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'conexion.php';

try {
    // Verificar método POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Método no permitido", 405);
    }

    // Obtener y validar parámetro
    $consulta = isset($_POST['consulta']) ? trim($_POST['consulta']) : '';
    
    if (empty($consulta)) {
        echo json_encode(['success' => true, 'data' => []]);
        exit;
    }

    // Consulta preparada con LIKE
    $sql = "SELECT id, nombre, rfc, direccion, telefono, contactos, email 
            FROM clientes 
            WHERE nombre LIKE CONCAT('%', ?, '%')
               OR rfc LIKE CONCAT('%', ?, '%')
               OR direccion LIKE CONCAT('%', ?, '%')
               OR telefono LIKE CONCAT('%', ?, '%')
               OR contactos LIKE CONCAT('%', ?, '%')
               OR email LIKE CONCAT('%', ?, '%')
            ORDER BY nombre
            LIMIT 10";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error al preparar consulta: " . $conn->error);
    }

    // Vincular parámetros
    $stmt->bind_param('ssssss', $consulta, $consulta, $consulta, $consulta, $consulta, $consulta);
    
    // Ejecutar
    if (!$stmt->execute()) {
        throw new Exception("Error al ejecutar consulta: " . $stmt->error);
    }

    $result = $stmt->get_result();
    $clientes = [];
    
    while ($row = $result->fetch_assoc()) {
        $clientes[] = $row;
    }
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'data' => $clientes,
        'count' => count($clientes)
    ]);

} catch (Exception $e) {
    error_log("Error en busqueda-clientes.php: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'code' => $e->getCode()
    ]);
} finally {
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($conn)) {
        $conn->close();
    }
}
?>