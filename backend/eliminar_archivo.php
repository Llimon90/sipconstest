<?php
header('Content-Type: application/json');

// ==============================================
// 1. Configuración de conexión a la base de datos
// ==============================================
require_once 'conexion.php';

if ($conn->connect_error) {
    die(json_encode(["error" => "Error de conexión: " . $conn->connect_error]));
}

// ==============================================
// 2. Validación de datos POST
// ==============================================
$idIncidencia = isset($_POST['id_incidencia']) ? (int)$_POST['id_incidencia'] : null;
$nombreArchivo = isset($_POST['url_archivo']) ? $_POST['url_archivo'] : null;

// Validación extra: Elimina posibles rutas maliciosas (../)
$nombreArchivo = basename($nombreArchivo);

if (!$idIncidencia || !$nombreArchivo) {
    echo json_encode([
        'success' => false,
        'error' => 'Datos incompletos o inválidos',
        'received' => [
            'id_incidencia' => $idIncidencia,
            'nombre_archivo' => $nombreArchivo
        ]
    ]);
    exit;
}

// ==============================================
// 3. Eliminación del registro en la base de datos
// ==============================================
try {
    // Usamos LIKE para mayor flexibilidad en rutas almacenadas
    $sql = "DELETE FROM archivos 
            WHERE id_incidencia = :id_incidencia 
            AND url_archivo LIKE :nombre_archivo";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':id_incidencia', $idIncidencia, PDO::PARAM_INT);
    $stmt->bindValue(':nombre_archivo', '%' . $nombreArchivo, PDO::PARAM_STR);
    $stmt->execute();

    // Verifica si realmente se eliminó el registro
    if ($stmt->rowCount() === 0) {
        echo json_encode([
            'success' => false,
            'error' => 'No se encontró el archivo en la base de datos'
        ]);
        exit;
    }

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al eliminar el registro de la base de datos',
        'details' => $e->getMessage()
    ]);
}
?>