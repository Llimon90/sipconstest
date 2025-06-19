<?php
// Asegurar que el contenido devuelto sea JSON
header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', 0);

// Configurar conexión con la base de datos
require_once 'conexion.php';

// Verificar conexión
if ($conn->connect_error) {
    die(json_encode(["error" => "Error de conexión: " . $conn->connect_error]));
}

try {
    // Consulta SQL para obtener técnicos
    $sql = "SELECT id, nombre FROM usuarios 
            WHERE (rol = 'Técnico' OR rol = 'Técnico/Administrativo') 
            AND activo = 1
            ORDER BY nombre";
    
    // Ejecutar la consulta
    $result = $conn->query($sql);
    
    // Verificar si la consulta fue exitosa
    if (!$result) {
        echo json_encode([
            'success' => false, 
            'message' => 'Error en la consulta: ' . $conn->error
        ]);
        $conn->close();
        exit;
    }
    
    // Obtener los resultados
    $tecnicos = [];
    while ($row = $result->fetch_assoc()) {
        $tecnicos[] = $row;
    }
    
    // Verificar si se encontraron resultados
    if (empty($tecnicos)) {
        echo json_encode([
            'success' => true,
            'message' => 'No se encontraron técnicos con los criterios especificados',
            'data' => []
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'data' => $tecnicos
        ]);
    }
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

// Cerrar la conexión
$conn->close();
exit;
?>