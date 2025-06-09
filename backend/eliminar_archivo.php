<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(E_ALL);

// ==============================================
// 1. Conexión a la base de datos
// ==============================================
require_once 'conexion.php';

// ==============================================
// 2. Validación de datos POST
// ==============================================
$idIncidencia = filter_input(INPUT_POST, 'id_incidencia', FILTER_VALIDATE_INT);
$nombreArchivo = basename(filter_input(INPUT_POST, 'url_archivo', FILTER_SANITIZE_STRING));

if (!$idIncidencia || !$nombreArchivo) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'error' => 'Datos incompletos o inválidos',
        'received' => [
            'id_incidencia' => $_POST['id_incidencia'] ?? 'no recibido',
            'url_archivo' => $_POST['url_archivo'] ?? 'no recibido'
        ]
    ]));
}

// ==============================================
// 3. Eliminación del archivo físico
// ==============================================
$rutaBase = $_SERVER['DOCUMENT_ROOT'] . '/apptest/uploads/';
$rutaCompleta = $rutaBase . $nombreArchivo;

// Verificación de seguridad
if (!file_exists($rutaCompleta)) {
    http_response_code(404);
    die(json_encode(['success' => false, 'error' => 'Archivo no encontrado']));
}

if (!is_writable($rutaCompleta)) {
    http_response_code(403);
    die(json_encode(['success' => false, 'error' => 'Sin permisos para eliminar el archivo']));
}

if (!unlink($rutaCompleta)) {
    http_response_code(500);
    die(json_encode(['success' => false, 'error' => 'Error al eliminar archivo físico']));
}

// ==============================================
// 4. Eliminación del registro en la BD
// ==============================================
try {
    // Consulta actualizada para tu tabla archivos_incidencias
    $sql = "DELETE FROM archivos_incidencias WHERE id_incidencia = ? AND nombre_archivo = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$idIncidencia, $nombreArchivo]);
    
    if ($stmt->rowCount() === 0) {
        // El archivo físico se borró pero no el registro
        error_log("Advertencia: Registro no encontrado en BD para id_incidencia=$idIncidencia, archivo=$nombreArchivo");
    }

    echo json_encode([
        'success' => true,
        'message' => 'Archivo eliminado completamente',
        'deleted_from_db' => ($stmt->rowCount() > 0)
    ]);
    
} catch (PDOException $e) {
    error_log("Error BD al eliminar archivo: " . $e->getMessage());
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'error' => 'Error en base de datos',
        'debug' => $e->getMessage()
    ]));
}
?>