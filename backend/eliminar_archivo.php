<?php
header('Content-Type: application/json');

// Configuración de conexión a la base de datos
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

// Obtener y validar datos del POST
$idIncidencia = isset($_POST['id_incidencia']) ? (int)$_POST['id_incidencia'] : null;
$nombreArchivo = isset($_POST['url_archivo']) ? $_POST['url_archivo'] : null;

if (!$idIncidencia || !$nombreArchivo) {
    echo json_encode([
        'success' => false,
        'error' => 'Datos incompletos',
        'received' => [
            'id_incidencia' => $idIncidencia,
            'url_archivo' => $nombreArchivo
        ]
    ]);
    exit;
}

// Construir la ruta completa del archivo (asumiendo que está en /uploads/)
$rutaBase = $_SERVER['DOCUMENT_ROOT'] . '/uploads/';
$rutaCompleta = $rutaBase . $nombreArchivo;

// Verificar si el archivo existe y eliminarlo
if (file_exists($rutaCompleta)) {
    if (!is_writable($rutaCompleta)) {
        echo json_encode([
            'success' => false,
            'error' => 'Permisos insuficientes para eliminar el archivo.'
        ]);
        exit;
    }

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

// Eliminar el registro de la base de datos
try {
    $sql = "DELETE FROM archivos WHERE id_incidencia = :id_incidencia AND url_archivo LIKE :nombre_archivo";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':id_incidencia', $idIncidencia, PDO::PARAM_INT);
    $stmt->bindValue(':nombre_archivo', '%' . $nombreArchivo, PDO::PARAM_STR); // Usamos LIKE para evitar problemas con rutas completas
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