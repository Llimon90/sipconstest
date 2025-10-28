<?php
// backend/obtener_datos.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir conexión
include 'conexion.php';

// Manejar errores
try {
    // Verificar conexión
    if (!$conn) {
        throw new Exception("No se pudo conectar a la base de datos");
    }

    // Obtener marcas
    $stmt = $conn->query("SELECT * FROM marcas ORDER BY nombre");
    if (!$stmt) {
        throw new Exception("Error en consulta de marcas: " . implode(", ", $conn->errorInfo()));
    }
    $marcas = $stmt->fetchAll();

    // Obtener modelos con información de marca
    $stmt = $conn->query("
        SELECT m.*, mar.nombre as marca_nombre 
        FROM modelos m 
        JOIN marcas mar ON m.marca_id = mar.id 
        ORDER BY mar.nombre, m.nombre
    ");
    if (!$stmt) {
        throw new Exception("Error en consulta de modelos: " . implode(", ", $conn->errorInfo()));
    }
    $modelosData = $stmt->fetchAll();

    // Obtener documentos
    $stmt = $conn->query("
        SELECT d.*, m.nombre as modelo_nombre, mar.nombre as marca_nombre 
        FROM documentos d 
        JOIN modelos m ON d.modelo_id = m.id 
        JOIN marcas mar ON m.marca_id = mar.id 
        ORDER BY d.modelo_id, d.tipo
    ");
    if (!$stmt) {
        throw new Exception("Error en consulta de documentos: " . implode(", ", $conn->errorInfo()));
    }
    $documentosData = $stmt->fetchAll();

    // Estructurar datos para el frontend
    $modelos = [];
    foreach ($modelosData as $modelo) {
        if (!isset($modelos[$modelo['marca_id']])) {
            $modelos[$modelo['marca_id']] = [];
        }
        $modelos[$modelo['marca_id']][] = [
            'id' => $modelo['id'],
            'nombre' => $modelo['nombre'],
            'tipo' => $modelo['tipo'],
            'marca_nombre' => $modelo['marca_nombre']
        ];
    }

    $documentos = [];
    foreach ($documentosData as $doc) {
        if (!isset($documentos[$doc['modelo_id']])) {
            $documentos[$doc['modelo_id']] = [];
        }
        $documentos[$doc['modelo_id']][] = [
            'id' => $doc['id'],
            'tipo' => $doc['tipo'],
            'nombre' => $doc['nombre'],
            'archivo' => $doc['archivo'],
            'marca_nombre' => $doc['marca_nombre'],
            'modelo_nombre' => $doc['modelo_nombre']
        ];
    }

    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'marcas' => $marcas,
        'modelos' => $modelos,
        'documentos' => $documentos
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    // Error de base de datos
    error_log("Error PDO: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'error' => 'Error de base de datos: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    // Error general
    error_log("Error general: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} finally {
    // Cerrar conexión si existe
    if (isset($conn)) {
        $conn = null;
    }
}
?>