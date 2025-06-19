<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'conexion.php';

try {
    // Verificar conexión
    if (!$conn instanceof PDO) {
        throw new Exception("Conexión a BD no es válida");
    }

    // Consulta SQL con marcadores más claros
    $sql = "SELECT id, nombre FROM usuarios 
            WHERE rol IN (:rol1, :rol2) 
            AND activo = 1
            ORDER BY nombre";
    
    $stmt = $conn->prepare($sql);
    
    // Bind de parámetros
    $stmt->bindValue(':rol1', 'Técnico', PDO::PARAM_STR);
    $stmt->bindValue(':rol2', 'Técnico/Administrativo', PDO::PARAM_STR);
    
    if (!$stmt->execute()) {
        throw new Exception("Error al ejecutar la consulta");
    }
    
    $tecnicos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($tecnicos)) {
        echo json_encode([
            'status' => 'warning',
            'message' => 'No se encontraron técnicos con los criterios especificados',
            'data' => []
        ]);
    } else {
        echo json_encode([
            'status' => 'success',
            'data' => $tecnicos
        ]);
    }
    
} catch(PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ]);
} catch(Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>