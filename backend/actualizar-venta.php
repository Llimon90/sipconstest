<?php
header('Content-Type: application/json');
require 'conexion.php';

// Como ahora recibimos FormData (texto + archivos), usamos $_POST en lugar de php://input
$idVenta = $_POST['venta_id'] ?? null;

if (!$idVenta) {
    echo json_encode(['exito' => false, 'mensaje' => 'ID de venta inválido o no recibido']);
    exit;
}

try {
    $pdo->beginTransaction();

  // ==========================================
    // 1. ACTUALIZAR CABECERA (Tabla: ventas)
    // ==========================================
    $stmtV = $pdo->prepare("UPDATE ventas SET 
        cliente = ?, 
        sucursal = ?,
        fecha_actualizacion = NOW() 
        WHERE id = ?");
    
    $stmtV->execute([
        $_POST['cliente'] ?? '',
        $_POST['sucursal'] ?? '',
        $idVenta
    ]);
    // ==========================================
    // 2. ACTUALIZAR DATOS GENERALES DEL EQUIPO (Tabla: venta_detalles)
    // ==========================================
    $stmtD = $pdo->prepare("UPDATE venta_detalles SET 
        equipo = ?, 
        marca = ?, 
        modelo = ?, 
        garantia = ?, 
        calibracion = ?, 
        servicio = ?, 
        notas = ? 
        WHERE venta_id = ?");
        
    $stmtD->execute([
        $_POST['equipo'] ?? '',
        $_POST['marca'] ?? '',
        $_POST['modelo'] ?? '',
        $_POST['garantia'] ?? 0,
        $_POST['calibracion'] ?? 0,
        $_POST['servicio'] ?? 0,
        $_POST['notas'] ?? '',
        $idVenta
    ]);

    // ==========================================
    // 3. ACTUALIZAR SERIES INDIVIDUALES
    // ==========================================
    // El JS nos manda las series como un string JSON, lo decodificamos aquí
    if (isset($_POST['series_json'])) {
        $series = json_decode($_POST['series_json'], true);
        if (!empty($series)) {
            $stmtS = $pdo->prepare("UPDATE venta_detalles SET numero_serie = ? WHERE id = ? AND venta_id = ?");
            foreach ($series as $s) {
                $stmtS->execute([$s['serie'], $s['id_detalle'], $idVenta]);
            }
        }
    }

    // ==========================================
    // 4. SUBIR ARCHIVOS NUEVOS (Si el usuario seleccionó alguno)
    // ==========================================
    if (isset($_FILES['nuevos_facturas']) && !empty($_FILES['nuevos_facturas']['name'][0])) {
        // Sacamos el folio y cliente para armar bien el nombre y la carpeta
        $infoVenta = $pdo->query("SELECT folio, cliente FROM ventas WHERE id = $idVenta")->fetch(PDO::FETCH_ASSOC);
        
        $carpetaLimpia = preg_replace('/[^A-Za-z0-9_\-]/', '_', $infoVenta['cliente']);
        $uploadDir = "../uploads/ventas/{$carpetaLimpia}/";
        
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $sqlArch = "INSERT INTO venta_archivos (venta_id, nombre_archivo, ruta_archivo, tipo_archivo) VALUES (?, ?, ?, ?)";
        $stmtArch = $pdo->prepare($sqlArch);

        foreach ($_FILES['nuevos_facturas']['name'] as $k => $nomOriginal) {
            if ($_FILES['nuevos_facturas']['error'][$k] === UPLOAD_ERR_OK) {
                $ext = pathinfo($nomOriginal, PATHINFO_EXTENSION);
                $tipo = $_FILES['nuevos_facturas']['type'][$k];
                // Nombre único: Folio_Timestamp_Indice
                $nuevoNombre = "{$infoVenta['folio']}_" . time() . "_{$k}.{$ext}";
                $rutaCompleta = $uploadDir . $nuevoNombre;

                if (move_uploaded_file($_FILES['nuevos_facturas']['tmp_name'][$k], $rutaCompleta)) {
                    $stmtArch->execute([$idVenta, $nomOriginal, $rutaCompleta, $tipo]);
                }
            }
        }
    }

    $pdo->commit();
    echo json_encode(['exito' => true, 'mensaje' => 'Venta actualizada correctamente con todos sus detalles']);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log("Error BD al actualizar venta: " . $e->getMessage());
    echo json_encode(['exito' => false, 'mensaje' => 'Error de BD: ' . $e->getMessage()]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['exito' => false, 'mensaje' => 'Error: ' . $e->getMessage()]);
}
?>