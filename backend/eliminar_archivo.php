<?php
header('Content-Type: application/json');

// 1. Configuración de conexión a la base de datos
$host = "localhost";
$user = "sipcons1_test";
$password = "sip*SYS2025";
$database = "sipcons1_sipcons_test";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error de conexión a la base de datos',
        'details' => $e->getMessage()
    ]);
    exit;
}

// 2. Obtener y validar datos del POST
$idIncidencia = isset($_POST['id_incidencia']) ? (int)$_POST['id_incidencia'] : null;
$urlArchivo = isset($_POST['url_archivo']) ? $_POST['url_archivo'] : null;

if (!$idIncidencia || !$urlArchivo) {
    echo json_encode([
        'success' => false,
        'error' => 'Datos incompletos',
        'received' => [
            'id_incidencia' => $idIncidencia,
            'url_archivo' => $urlArchivo
        ]
    ]);
    exit;
}

// 3. Construir la ruta completa del archivo
$rutaBase = $_SERVER['DOCUMENT_ROOT'] . '/uploads/';
$rutaCompleta = $rutaBase . ltrim($urlArchivo, '/');

// 4. Verificar si el archivo existe y eliminarlo
if (file_exists($rutaCompleta)) {
    if (!unlink($rutaCompleta)) {
        echo json_encode([
            'success' => false,
            'error' => 'No se pudo eliminar el archivo del sistema de archivos.'
        ]);
        exit;
    }
} else {
    echo json_encode([
        'success' => false,
        'error' => 'El archivo no existe en el sistema de archivos.'
    ]);
    exit;
}

// 5. Eliminar el registro de la base de datos
try {
    $sql = "DELETE FROM archivos WHERE id_incidencia = :id_incidencia AND url_archivo = :url_archivo";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':id_incidencia', $idIncidencia, PDO::PARAM_INT);
    $stmt->bindParam(':url_archivo', $urlArchivo, PDO::PARAM_STR);
    $stmt->execute();

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al eliminar el registro de la base de datos.',
        'details' => $e->getMessage()
    ]);
}
?>
