<?php
// Activar reporte de errores para desarrollo (quitar en producción)
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'conexion.php';

try {
    // Verificar conexión
    if ($conn->connect_error) {
        throw new Exception("Error de conexión: " . $conn->connect_error);
    }

    // Consulta SQL con manejo de errores
    $sql = "SELECT id, nombre, rfc, direccion, telefono, contactos, email, fecha_registro FROM clientes ORDER BY fecha_registro DESC";
    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception("Error en la consulta: " . $conn->error);
    }

    $clientes = [];
    while ($row = $result->fetch_assoc()) {
        $clientes[] = $row;
    }

    // Formato de respuesta consistente
    echo json_encode([
        'success' => true,
        'data' => $clientes,
        'count' => count($clientes)
    ]);

} catch (Exception $e) {
    // Registrar error en el log del servidor
    error_log("Error en obtener-clientes.php: " . $e->getMessage());
    
    // Respuesta de error estructurada
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'code' => $e->getCode()
    ]);
} finally {
    // Cerrar conexión si existe
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
?>