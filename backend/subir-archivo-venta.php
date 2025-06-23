<?php
header('Content-Type: application/json');
require 'conexion.php';

$venta_id = $_POST['venta_id'] ?? null;

if (!$venta_id || empty($_FILES['archivos'])) {
    echo json_encode(['exito' => false, 'mensaje' => 'Datos incompletos']);
    exit;
}

try {
    $pdo->beginTransaction();
    
    // Crear directorio de uploads si no existe
    if (!file_exists('../uploads/ventas')) {
        mkdir('../uploads/ventas', 0777, true);
    }
    
    $archivosSubidos = [];
    
    foreach ($_FILES['archivos']['tmp_name'] as $key => $tmp_name) {
        $nombre = $_FILES['archivos']['name'][$key];
        $tipo = $_FILES['archivos']['type'][$key];
        $tamano = $_FILES['archivos']['size'][$key];
        
        // Generar nombre único para el archivo
        $extension = pathinfo($nombre, PATHINFO_EXTENSION);
        $nombreUnico = uniqid() . '.' . $extension;
        $ruta = '../uploads/ventas' . $nombreUnico;
        
        if (move_uploaded_file($tmp_name, $ruta)) {
            $stmt = $pdo->prepare("INSERT INTO archivos_ventas 
                (venta_id, nombre, nombre_original, tipo, tamano, ruta) 
                VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $venta_id,
                $nombreUnico,
                $nombre,
                $tipo,
                $tamano,
                $ruta
            ]);
            
            $archivosSubidos[] = $nombre;
        }
    }
    
    $pdo->commit();
    echo json_encode([
        'exito' => true, 
        'mensaje' => 'Archivos subidos correctamente',
        'archivos' => $archivosSubidos
    ]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['exito' => false, 'mensaje' => 'Error: ' . $e->getMessage()]);
}
?>