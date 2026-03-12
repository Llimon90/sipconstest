<?php
header('Content-Type: application/json');
require_once 'conexion.php';

try {
    $pdo->beginTransaction();

    // 1. Recoger datos de $_POST (porque ahora es FormData)
    $cliente = $_POST['cliente'] ?? throw new Exception("Cliente requerido");
    $series = json_decode($_POST['series'], true);

    // 2. Generar Folio VT-00000
    $stmtF = $pdo->query("SELECT folio FROM ventas ORDER BY id DESC LIMIT 1");
    $uFolio = $stmtF->fetchColumn();
    $nFolio = "VT-" . str_pad($uFolio ? (int)substr($uFolio, 3) + 1 : 1, 5, "0", STR_PAD_LEFT);

    // 3. Gestión de Archivo (Factura)
    $rutaFactura = null;
    if (isset($_FILES['factura']) && $_FILES['factura']['error'] === UPLOAD_ERR_OK) {
        // Sanitizar nombre de carpeta (quitar espacios y caracteres raros)
        $folderName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $cliente);
        $uploadDir = "../uploads/ventas/{$folderName}/";

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $ext = pathinfo($_FILES['factura']['name'], PATHINFO_EXTENSION);
        $fileName = "{$nFolio}_" . time() . ".{$ext}";
        $fullPath = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES['factura']['tmp_name'], $fullPath)) {
            $rutaFactura = $fullPath;
        }
    }

    // 4. Insertar Cabecera (Tabla: ventas)
    $sqlVenta = "INSERT INTO ventas (folio, cliente, sucursal, factura_path, fecha_registro) VALUES (?, ?, ?, ?, NOW())";
    $stmtV = $pdo->prepare($sqlVenta);
    $stmtV->execute([$nFolio, $cliente, $_POST['sucursal'], $rutaFactura]);
    $venta_id = $pdo->lastInsertId();

    // 5. Insertar Detalles (Tabla: venta_detalles)
    $sqlDetalle = "INSERT INTO venta_detalles (venta_id, equipo, marca, modelo, numero_serie, garantia, servicio, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmtD = $pdo->prepare($sqlDetalle);

    foreach ($series as $s) {
        $stmtD->execute([
            $venta_id,
            $_POST['equipo'],
            $_POST['marca'],
            $_POST['modelo'],
            $s,
            $_POST['garantia'],
            $_POST['servicio'],
            $_POST['notas']
        ]);
    }

    $pdo->commit();
    echo json_encode(['exito' => true, 'folio' => $nFolio]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['exito' => false, 'mensaje' => $e->getMessage()]);
}