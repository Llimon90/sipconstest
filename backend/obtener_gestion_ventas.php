<?php
header('Content-Type: application/json');
require_once 'conexion.php';

try {
    // 1. Estadísticas Rápidas (KPIs)
    $stats = [];
    $stats['total_ventas'] = $pdo->query("SELECT COUNT(*) FROM ventas")->fetchColumn();
    $stats['total_equipos'] = $pdo->query("SELECT COUNT(*) FROM venta_detalles")->fetchColumn();
    $stats['con_servicio'] = $pdo->query("SELECT COUNT(*) FROM venta_detalles WHERE servicio = 1")->fetchColumn();
    
    // 2. Obtener listado detallado con agregación de equipos
    $sql = "SELECT 
                v.id, 
                v.folio, 
                v.cliente, 
                v.sucursal, 
                v.fecha_registro,
                COUNT(d.id) as cantidad_equipos,
                GROUP_CONCAT(DISTINCT d.marca SEPARATOR ', ') as marcas,
                (SELECT COUNT(*) FROM venta_archivos va WHERE va.venta_id = v.id) as total_archivos
            FROM ventas v
            LEFT JOIN venta_detalles d ON v.id = d.venta_id
            GROUP BY v.id
            ORDER BY v.fecha_registro DESC";
            
    $stmt = $pdo->query($sql);
    $ventas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'exito' => true,
        'stats' => $stats,
        'ventas' => $ventas
    ]);

} catch (Exception $e) {
    echo json_encode(['exito' => false, 'mensaje' => $e->getMessage()]);
}