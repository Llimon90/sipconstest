<?php
require_once 'conexion.php';

// Función para limpiar nombres de carpetas
function limpiarNombreCarpeta($nombre) {
    return preg_replace('/[^A-Za-z0-9_\-]/', '_', $nombre);
}

try {
    $pdo->beginTransaction();

    // 1. Insertar en tabla 'ventas' (Cabecera)
    $sqlVenta = "INSERT INTO ventas (folio, cliente, sucursal, servicio, notas) 
                 VALUES (:folio, :cliente, :sucursal, :servicio, :notas)";
    $stmtVenta = $pdo->prepare($sqlVenta);
    $stmtVenta->execute([
        ':folio'    => $_POST['folio'],
        ':cliente'  => $_POST['cliente'],
        ':sucursal' => $_POST['sucursal'],
        ':servicio' => isset($_POST['servicio']) ? 1 : 0,
        ':notas'    => $_POST['notas']
    ]);
    $ventaId = $pdo->lastInsertId();

    // 2. Insertar Detalles (Series)
    // Convertimos el string de series (enviado desde JS) de vuelta a array
    $series = json_decode($_POST['numero_series'], true);
    $sqlDetalle = "INSERT INTO venta_detalles (venta_id, equipo, marca, modelo, numero_serie, garantia) 
                   VALUES (:v_id, :eq, :ma, :mo, :sn, :ga)";
    $stmtDetalle = $pdo->prepare($sqlDetalle);

    foreach ($series as $sn) {
        $stmtDetalle->execute([
            ':v_id' => $ventaId,
            ':eq'   => $_POST['equipo'],
            ':ma'   => $_POST['marca'],
            ':mo'   => $_POST['modelo'],
            ':sn'   => trim($sn),
            ':ga'   => (int)$_POST['garantia']
        ]);
    }

    // 3. Manejo de Archivos y Carpetas por Cliente
    if (!empty($_FILES['archivos']['name'][0])) {
        $clienteCarpeta = limpiarNombreCarpeta($_POST['cliente']);
        $targetDir = "../uploads/ventas/" . $clienteCarpeta . "/";

        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        foreach ($_FILES['archivos']['tmp_name'] as $key => $tmpName) {
            $fileName = time() . "_" . basename($_FILES['archivos']['name'][$key]);
            $targetFilePath = $targetDir . $fileName;

            if (move_uploaded_file($tmpName, $targetFilePath)) {
                $sqlFile = "INSERT INTO venta_archivos (venta_id, ruta_archivo, nombre_original, tipo_archivo) 
                            VALUES (?, ?, ?, ?)";
                $pdo->prepare($sqlFile)->execute([
                    $ventaId, 
                    "uploads/ventas/$clienteCarpeta/$fileName", 
                    $_FILES['archivos']['name'][$key],
                    $_FILES['archivos']['type'][$key]
                ]);
            }
        }
    }

    $pdo->commit();
    echo json_encode(['exito' => true, 'mensaje' => 'Venta y archivos registrados correctamente']);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['exito' => false, 'mensaje' => $e->getMessage()]);
}