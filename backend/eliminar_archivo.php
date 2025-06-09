<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(E_ALL);

// ==============================================
// 1. Configuración de conexión a la base de datos
// ==============================================
require_once 'conexion.php';

// Verificar solo la conexión PDO que realmente usas
if (!$pdo) {
    http_response_code(500);
    die(json_encode(['success' => false, 'error' => 'Error de conexión a la BD']));
}

// ==============================================
// 2. Validación de datos POST
// ==============================================
$idIncidencia = filter_input(INPUT_POST, 'id_incidencia', FILTER_VALIDATE_INT);
$nombreArchivo = basename(filter_input(INPUT_POST, 'url_archivo', FILTER_SANITIZE_STRING));

if (!$idIncidencia || !$nombreArchivo) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'error' => 'Datos incompletos o inválidos'
    ]));
}

// ==============================================
// 3. Eliminación del archivo físico
// ==============================================
$rutaBase = $_SERVER['DOCUMENT_ROOT'] . '/apptest/uploads/';
$rutaCompleta = $rutaBase . $nombreArchivo;

// Verificación de seguridad
if (!file_exists($rutaCompleta) || !is_writable($rutaCompleta)) {
    http_response_code(404);
    die(json_encode(['success' => false, 'error' => 'Archivo no encontrado o sin permisos']));
}

if (!unlink($rutaCompleta)) {
    http_response_code(500);
    die(json_encode(['success' => false, 'error' => 'Error al eliminar archivo físico']));
}

// ==============================================
// 4. Eliminación del registro en la BD - VERSIÓN CORREGIDA
// ==============================================
try {
    // Opción 1: Si guardas solo el nombre del archivo
    $sql = "DELETE FROM archivos WHERE id_incidencia = ? AND url_archivo LIKE ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$idIncidencia, '%'.$nombreArchivo]);
    
    // Opción 2: Si guardas la ruta completa (ajusta según tu caso)
    // $sql = "DELETE FROM archivos WHERE id_incidencia = ? AND url_archivo = ?";
    // $stmt->execute([$idIncidencia, 'uploads/'.$nombreArchivo]);
    
    if ($stmt->rowCount() === 0) {
        // El archivo físico se borró pero no el registro
        error_log("Registro no encontrado en BD para: id=$idIncidencia, archivo=$nombreArchivo");
    }

    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'message' => 'Archivo eliminado completamente',
        'deleted_from_db' => ($stmt->rowCount() > 0)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Error BD: " . $e->getMessage());
    die(json_encode([
        'success' => false,
        'error' => 'Error en base de datos',
        'debug' => $e->getMessage()
    ]));
}
?>