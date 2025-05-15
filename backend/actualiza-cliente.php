<?php
header('Content-Type: application/json');

require_once 'conexion.php';

try {
    // Verificar método HTTP
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Método no permitido", 405);
    }

    // Verificar conexión
    if ($conn->connect_error) {
        throw new Exception("Error de conexión: " . $conn->connect_error);
    }

    // Obtener datos del POST
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        $data = $_POST; // Fallback a POST tradicional
    }

    // Validar datos requeridos
    if (empty($data['id']) || empty($data['nombre'])) {
        throw new Exception("Datos incompletos", 400);
    }

    // Asignar valores con valores por defecto para evitar undefined index
    $id = $data['id'];
    $nombre = $data['nombre'];
    $rfc = $data['rfc'] ?? null;
    $direccion = $data['direccion'] ?? null;
    $telefono = $data['telefono'] ?? null;
    $contactos = $data['contactos'] ?? null;
    $email = $data['email'] ?? null;

    // Preparar consulta
    $sql = "UPDATE clientes SET 
            nombre = ?, 
            rfc = ?, 
            direccion = ?, 
            telefono = ?, 
            contactos = ?, 
            email = ?, 
            WHERE id = ?";
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }

    $stmt->bind_param("ssssss", $nombre, $rfc, $direccion, $telefono, $contactos, $email, $id);

    if (!$stmt->execute()) {
        throw new Exception("Error al ejecutar la consulta: " . $stmt->error);
    }

    // Verificar si realmente se actualizó algún registro
    if ($stmt->affected_rows === 0) {
        throw new Exception("No se actualizó ningún registro. ¿Existe el ID?");
    }

    echo json_encode([
        "success" => true,
        "affected_rows" => $stmt->affected_rows,
        "message" => "Cliente actualizado correctamente"
    ]);

} catch (Exception $e) {
    http_response_code($e->getCode() ?: 500);
    echo json_encode([
        "error" => $e->getMessage(),
        "trace" => $e->getTrace() // Solo para desarrollo, quitar en producción
    ]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
?>