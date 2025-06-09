<?php
header('Content-Type: application/json');
ini_set('display_errors', 0); // Desactivar visualización de errores en producción
error_reporting(E_ALL); // Pero registrar todos los errores

// ==============================================
// 1. Configuración de conexión a la base de datos
// ==============================================
require_once 'conexion.php';

// Verificar conexión (asumiendo que $conn es MySQLi y $pdo es PDO)
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'error' => 'Error de conexión MySQLi: ' . $conn->connect_error
    ]));
}

// ==============================================
// 2. Validación de datos POST
// ==============================================
$idIncidencia = isset($_POST['id_incidencia']) ? (int)$_POST['id_incidencia'] : null;
$nombreArchivo = isset($_POST['url_archivo']) ? $_POST['url_archivo'] : null;

// Validación extra: Elimina posibles rutas maliciosas
$nombreArchivo = basename($nombreArchivo);

if (!$idIncidencia || !$nombreArchivo) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'error' => 'Datos incompletos o inválidos',
        'received' => [
            'id_incidencia' => $idIncidencia,
            'nombre_archivo' => $nombreArchivo
        ]
    ]));
}

// ==============================================
// 3. Configuración y validación de rutas
// ==============================================
$rutaBase = $_SERVER['DOCUMENT_ROOT'] . '/apptest/uploads/';
$rutaCompleta = $rutaBase . $nombreArchivo;

// Verificación de seguridad mejorada
if (!file_exists($rutaCompleta)) {
    http_response_code(404);
    die(json_encode([
        'success' => false,
        'error' => 'El archivo no existe',
        'debug' => [
            'ruta_base' => $rutaBase,
            'ruta_completa' => $rutaCompleta,
            'archivo_solicitado' => $nombreArchivo
        ]
    ]));
}

// Verificación de permisos
if (!is_writable($rutaCompleta)) {
    http_response_code(403);
    die(json_encode([
        'success' => false,
        'error' => 'El archivo no tiene permisos de escritura',
        'permisos' => substr(sprintf('%o', fileperms($rutaCompleta)), -4)
    ]));
}

// ==============================================
// 4. Eliminación del archivo físico
// ==============================================
if (!unlink($rutaCompleta)) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'error' => 'Error al eliminar el archivo físico',
        'ruta' => $rutaCompleta,
        'php_error' => error_get_last()
    ]));
}

// ==============================================
// 5. Eliminación del registro en la base de datos
// ==============================================
try {
    // Usar la misma conexión PDO que en conexion.php
    $rutaRelativa = 'uploads/' . $nombreArchivo;
    $sql = "DELETE FROM archivos 
            WHERE id_incidencia = :id_incidencia 
            AND url_archivo = :ruta_relativa";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':id_incidencia', $idIncidencia, PDO::PARAM_INT);
    $stmt->bindParam(':ruta_relativa', $rutaRelativa, PDO::PARAM_STR);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        die(json_encode([
            'success' => false,
            'error' => 'El archivo se eliminó físicamente pero no se encontró en la base de datos',
            'debug' => [
                'id_incidencia' => $idIncidencia,
                'ruta_relativa' => $rutaRelativa
            ]
        ]));
    }

    // Éxito - limpiar buffer antes de enviar JSON
    if (ob_get_length()) ob_clean();
    echo json_encode([
        'success' => true,
        'message' => 'Archivo eliminado correctamente'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'error' => 'Error al eliminar el registro de la base de datos',
        'details' => $e->getMessage(),
        'sql' => $sql,
        'params' => [
            'id_incidencia' => $idIncidencia,
            'ruta_relativa' => $rutaRelativa
        ]
    ]));
}
?>