<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(E_ALL);

// ==============================================
// 1. Conexión a la base de datos
// ==============================================
require_once 'conexion.php';

// ==============================================
// 2. Detección Inteligente de Payload (JSON vs POST)
// ==============================================
$es_json = (isset($_SERVER["CONTENT_TYPE"]) && strpos($_SERVER["CONTENT_TYPE"], "application/json") !== false);

if ($es_json) {
    // Si la petición viene del módulo de Ventas (Fetch con JSON)
    $data = json_decode(file_get_contents('php://input'), true);
} else {
    // Si la petición viene del módulo antiguo de Incidencias (Form POST)
    $data = $_POST;
}

// ==============================================
// 3. Enrutamiento del Módulo
// ==============================================
$modulo = null;
$idTabla = null;
$rutaFisica = null;

// A. Lógica para el módulo de INCIDENCIAS (Compatibilidad hacia atrás)
if (!empty($data['id_incidencia'])) {
    $modulo = 'incidencias';
    $idReferencia = filter_var($data['id_incidencia'], FILTER_VALIDATE_INT);
    $rutaArchivo = filter_var($data['url_archivo'], FILTER_SANITIZE_STRING);
    $nombreArchivo = basename($rutaArchivo);
    
    if (!$idReferencia || !$rutaArchivo) {
        http_response_code(400);
        die(json_encode(['success' => false, 'error' => 'Datos incompletos de incidencia.']));
    }
} 
// B. Lógica para el módulo de VENTAS
else if (!empty($data['id']) && !empty($data['ruta'])) {
    $modulo = 'ventas';
    $idTabla = filter_var($data['id'], FILTER_VALIDATE_INT);
    $rutaArchivo = filter_var($data['ruta'], FILTER_SANITIZE_STRING);
    
    if (!$idTabla || !$rutaArchivo) {
        http_response_code(400);
        die(json_encode(['success' => false, 'error' => 'Datos incompletos de venta.']));
    }
} else {
    http_response_code(400);
    die(json_encode(['success' => false, 'error' => 'Parámetros no reconocidos por el servidor.', 'recibido' => $data]));
}

// ==============================================
// 4. Iniciar transacción
// ==============================================
$pdo->beginTransaction();

try {
    // ==============================================
    // 5. Eliminar registro de la BD según el módulo
    // ==============================================
    if ($modulo === 'incidencias') {
        $sql = "DELETE FROM archivos_incidencias WHERE incidencia_id = ? AND ruta_archivo LIKE ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$idReferencia, '%' . $nombreArchivo]);
        
        $rutaCompleta = $_SERVER['DOCUMENT_ROOT'] . '/apptest/uploads/' . $nombreArchivo;
    } 
    else if ($modulo === 'ventas') {
        // En ventas eliminamos directamente por el ID único de la tabla venta_archivos
        $sql = "DELETE FROM venta_archivos WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$idTabla]);
        
        // La ruta en ventas ya viene construida desde la base de datos (ej: ../uploads/ventas/Cliente/archivo.pdf)
        $rutaCompleta = $rutaArchivo;
    }

    $deletedFromDb = $stmt->rowCount() > 0;
    
    if (!$deletedFromDb) {
        $pdo->rollBack();
        http_response_code(404);
        die(json_encode([
            'success' => false,
            'error' => 'Registro no encontrado en la base de datos',
            'modulo' => $modulo
        ]));
    }

    // ==============================================
    // 6. Eliminar archivo físico
    // ==============================================
    if (!file_exists($rutaCompleta)) {
        // Si no existe físicamente, cancelamos el borrado de la DB para mantener tu lógica de seguridad estricta
        $pdo->rollBack();
        http_response_code(404);
        die(json_encode([
            'success' => false,
            'error' => 'Archivo no encontrado en el servidor físico',
            'searched_path' => $rutaCompleta
        ]));
    }

    if (!unlink($rutaCompleta)) {
        $pdo->rollBack();
        http_response_code(500);
        die(json_encode([
            'success' => false,
            'error' => 'Error al eliminar archivo físico (Permisos denegados)',
            'file_permissions' => [
                'readable' => is_readable($rutaCompleta),
                'writable' => is_writable($rutaCompleta)
            ]
        ]));
    }

    // ==============================================
    // 7. Confirmar transacción
    // ==============================================
    $pdo->commit();

    echo json_encode([
        'success' => true,
        'exito' => true, // Doble bandera para compatibilidad con JS de ventas e incidencias
        'message' => 'Archivo eliminado completamente del módulo ' . $modulo,
        'details' => [
            'db_deleted' => true,
            'file_deleted' => true,
            'modulo' => $modulo
        ]
    ]);
    
} catch (PDOException $e) {
    $pdo->rollBack();
    error_log("Error BD al eliminar archivo: " . $e->getMessage());
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'error' => 'Error en base de datos',
        'debug' => ['message' => $e->getMessage()]
    ]));
} catch (Exception $e) {
    $pdo->rollBack();
    error_log("Error general: " . $e->getMessage());
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'error' => 'Error interno al procesar',
        'message' => $e->getMessage()
    ]));
}
?>