<?php
// backend/generador_tickets.php
require_once 'conexion.php';

try {
    $pdo->beginTransaction();

    // Función para generar folio de incidencia (Ej: INC-00015)
    function obtenerNuevoFolio($pdo) {
        $stmt = $pdo->query("SELECT numero_incidente FROM incidencias ORDER BY id DESC LIMIT 1");
        $ultimo = $stmt->fetchColumn();
        $num = $ultimo ? (int) preg_replace('/[^0-9]/', '', $ultimo) : 0;
        return "INC-" . str_pad($num + 1, 5, "0", STR_PAD_LEFT);
    }

    // ========================================================
    // 1. BUSCAR Y GENERAR TICKETS DE CALIBRACIÓN RECOMENDADA
    // ========================================================
    $sqlCal = "SELECT d.id, v.cliente, v.sucursal, d.equipo, d.marca, d.modelo, d.numero_serie, d.calibracion, d.proxima_calibracion 
               FROM venta_detalles d JOIN ventas v ON d.venta_id = v.id 
               WHERE d.calibracion > 0 AND d.proxima_calibracion <= CURDATE()";
    
    $equiposCalibracion = $pdo->query($sqlCal)->fetchAll(PDO::FETCH_ASSOC);

    $stmtInsertIncidencia = $pdo->prepare("INSERT INTO incidencias (numero_incidente, cliente, sucursal, equipo, fecha, estatus, falla, notas) VALUES (?, ?, ?, ?, CURDATE(), 'Abierto', ?, ?)");
    $stmtUpdateCal = $pdo->prepare("UPDATE venta_detalles SET proxima_calibracion = DATE_ADD(proxima_calibracion, INTERVAL ? MONTH) WHERE id = ?");

    foreach ($equiposCalibracion as $eq) {
        $folio = obtenerNuevoFolio($pdo);
        $descripcionEquipo = "{$eq['equipo']} {$eq['marca']} {$eq['modelo']} (Serie: {$eq['numero_serie']})";
        $falla = "TICKET AUTOMÁTICO: Calibración Recomendada";
        $notas = "El sistema detectó que han pasado {$eq['calibracion']} meses. Se recomienda contactar al cliente para programar calibración del equipo: $descripcionEquipo.";

        // Crear la incidencia
        $stmtInsertIncidencia->execute([$folio, $eq['cliente'], $eq['sucursal'], $eq['equipo'], $falla, $notas]);
        // Empujar la fecha para la SIGUIENTE calibración
        $stmtUpdateCal->execute([$eq['calibracion'], $eq['id']]);
    }

    // ========================================================
    // 2. BUSCAR Y GENERAR TICKETS DE SERVICIO (CLÁUSULA)
    // ========================================================
    $sqlServ = "SELECT d.id, v.cliente, v.sucursal, d.equipo, d.marca, d.modelo, d.numero_serie, d.frecuencia_servicio, d.proximo_servicio 
                FROM venta_detalles d JOIN ventas v ON d.venta_id = v.id 
                WHERE d.servicio = 1 AND d.frecuencia_servicio > 0 AND d.proximo_servicio <= CURDATE()";
    
    $equiposServicio = $pdo->query($sqlServ)->fetchAll(PDO::FETCH_ASSOC);
    $stmtUpdateServ = $pdo->prepare("UPDATE venta_detalles SET proximo_servicio = DATE_ADD(proximo_servicio, INTERVAL ? MONTH) WHERE id = ?");

    foreach ($equiposServicio as $eq) {
        $folio = obtenerNuevoFolio($pdo);
        $descripcionEquipo = "{$eq['equipo']} {$eq['marca']} {$eq['modelo']} (Serie: {$eq['numero_serie']})";
        $falla = "TICKET AUTOMÁTICO: Mantenimiento Preventivo (Cláusula Activa)";
        $notas = "Mantenimiento correspondiente a la cláusula de servicio de {$eq['frecuencia_servicio']} meses. Equipo: $descripcionEquipo.";

        // Crear la incidencia
        $stmtInsertIncidencia->execute([$folio, $eq['cliente'], $eq['sucursal'], $eq['equipo'], $falla, $notas]);
        // Empujar la fecha para el SIGUIENTE servicio
        $stmtUpdateServ->execute([$eq['frecuencia_servicio'], $eq['id']]);
    }

    $pdo->commit();
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log("Error generando tickets automáticos: " . $e->getMessage());
}
?>