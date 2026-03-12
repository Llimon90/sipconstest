<?php
/**
 * backend/registro_ventas.php
 * Generación de Folio VT-00000 y Registro en DB
 */

header('Content-Type: application/json');
require_once 'conexion.php'; // Tu archivo de conexión PDO

try {
    // 1. Obtener JSON
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!$data) throw new Exception("No se recibieron datos válidos.");

    $pdo->beginTransaction();

    // 2. GENERAR FOLIO (VT-00001)
    // Buscamos el último folio de la tabla ventas
    $stmtFolio = $pdo->query("SELECT folio FROM ventas WHERE folio LIKE 'VT-%' ORDER BY id DESC LIMIT 1");
    $ultimoFolio = $stmtFolio->fetchColumn();

    if ($ultimoFolio) {
        $numero = (int)substr($ultimoFolio, 3);
        $nuevoNumero = $numero + 1;
    } else {
        $nuevoNumero = 1;
    }
    $folioGenerado = "VT-" . str_pad($nuevoNumero, 5, "0", STR_PAD_LEFT);

    // 3. INSERTAR VENTA
    // Asumimos que guardas una fila por cada número de serie para trazabilidad
    $sql = "INSERT INTO ventas (
        folio, cliente, sucursal, equipo, marca, modelo, 
        numero_serie, garantia, servicio, notas, fecha_registro
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

    $stmtInsert = $pdo->prepare($sql);

    foreach ($data['series'] as $serie) {
        $stmtInsert->execute([
            $folioGenerado,
            $data['cliente'],
            $data['sucursal'],
            $data['equipo'],
            $data['marca'],
            $data['modelo'],
            $serie,
            $data['garantia'],
            $data['servicio'] ? 1 : 0,
            $data['notas']
        ]);
    }

    $pdo->commit();
    echo json_encode(['exito' => true, 'folio' => $folioGenerado]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['exito' => false, 'mensaje' => $e->getMessage()]);
}