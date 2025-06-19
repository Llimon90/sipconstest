<?php
header('Content-Type: application/json');

// Configuración de la base de datos (ajusta con tus credenciales)
include('../backend/conexion.php'); // O incluye directamente la configuración

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