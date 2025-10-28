<?php
// backend/obtener_datos.php
include 'conexion.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    // Obtener marcas
    $stmt = $conn->query("SELECT * FROM marcas ORDER BY nombre");
    $marcas = $stmt->fetchAll();
    
    // Obtener modelos con información de marca
    $stmt = $conn->query("
        SELECT m.*, mar.nombre as marca_nombre 
        FROM modelos m 
        JOIN marcas mar ON m.marca_id = mar.id 
        ORDER BY mar.nombre, m.nombre
    ");
    $modelosData = $stmt->fetchAll();
    
    // Obtener documentos
    $stmt = $conn->query("
        SELECT d.*, m.nombre as modelo_nombre, mar.nombre as marca_nombre 
        FROM documentos d 
        JOIN modelos m ON d.modelo_id = m.id 
        JOIN marcas mar ON m.marca_id = mar.id 
        ORDER BY d.modelo_id, d.tipo
    ");
    $documentosData = $stmt->fetchAll();
    
    // Estructurar datos para el frontend
    $modelos = [];
    foreach ($modelosData as $modelo) {
        if (!isset($modelos[$modelo['marca_id']])) {
            $modelos[$modelo['marca_id']] = [];
        }
        $modelos[$modelo['marca_id']][] = [
            'id' => $modelo['id'],
            'nombre' => $modelo['nombre'],
            'tipo' => $modelo['tipo'],
            'marca_nombre' => $modelo['marca_nombre']
        ];
    }
    
    $documentos = [];
    foreach ($documentosData as $doc) {
        if (!isset($documentos[$doc['modelo_id']])) {
            $documentos[$doc['modelo_id']] = [];
        }
        $documentos[$doc['modelo_id']][] = [
            'id' => $doc['id'],
            'tipo' => $doc['tipo'],
            'nombre' => $doc['nombre'],
            'archivo' => $doc['archivo'],
            'marca_nombre' => $doc['marca_nombre'],
            'modelo_nombre' => $doc['modelo_nombre']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'marcas' => $marcas,
        'modelos' => $modelos,
        'documentos' => $documentos
    ]);
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>