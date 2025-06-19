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
    // Consulta para obtener solo técnicos y administrativos/técnicos
    $sql = "SELECT id, nombre FROM usuarios 
            WHERE rol IN ('Técnico', 'Administrativo/Técnico') 
            AND activo = 1
            ORDER BY nombre";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    
    $tecnicos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($tecnicos);
} catch(PDOException $e) {
    echo json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]);
}
?>