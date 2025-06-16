<?php
require_once 'conexion.php';

header('Content-Type: application/json');

// Obtener los datos del cuerpo de la solicitud
$data = json_decode(file_get_contents('php://input'), true);
error_log("Datos recibidos: " . print_r($data, true)); // <-- Agrega esto

// ... resto del código
// Validar datos requeridos
if (empty($data['cliente']) || empty($data['equipo']) || empty($data['garantia']) || empty($data['numero_series'])) {
    echo json_encode(['success' => false, 'error' => 'Datos incompletos: cliente, equipo, garantia y numero_series son requeridos']);
    exit;
}

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->beginTransaction();

    // 1. Insertar la venta principal
    $stmtVenta = $conn->prepare("INSERT INTO ventas 
                               (cliente, sucursal, equipo, marca, modelo, garantia, calibracion, notas, servicio, fecha_registro) 
                               VALUES 
                               (:cliente, :sucursal, :equipo, :marca, :modelo, :garantia, :calibracion, :notas, :servicio, NOW())");
    
    $stmtVenta->execute([
        ':cliente' => $data['cliente'],
        ':sucursal' => $data['sucursal'] ?? null,
        ':equipo' => $data['equipo'],
        ':marca' => $data['marca'] ?? null,
        ':modelo' => $data['modelo'] ?? null,
        ':garantia' => $data['garantia'],
        ':calibracion' => $data['calibracion'] ?? null,
        ':notas' => $data['notas'] ?? null,
        ':servicio' => isset($data['servicio']) ? 1 : 0
    ]);
    
    // Obtener el ID de la venta recién insertada
    $venta_id = $conn->lastInsertId();
    
    // // 2. Insertar los números de serie en ventas_series
    // $stmtSerie = $conn->prepare("INSERT INTO ventas_series 
    //                             (venta_id, numero_serie) 
    //                             VALUES 
    //                             (:venta_id, :numero_serie)");
    
    // foreach ($data['numero_series'] as $serie) {
    //     if (!empty(trim($serie))) {
    //         $stmtSerie->execute([
    //             ':venta_id' => $venta_id,
    //             ':numero_serie' => trim($serie)
    //         ]);
    //     }
    // }
    
    $conn->commit();
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'message' => 'Venta registrada correctamente',
        'venta_id' => $venta_id
    ]);
    
} catch(PDOException $e) {
    $conn->rollBack();
    echo json_encode([
        'success' => false,
        'error' => 'Error en la base de datos: ' . $e->getMessage()
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error general: ' . $e->getMessage()
    ]);
}
?>