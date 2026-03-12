<?php
/**
 * backend/registro_ventas.php
 * Proceso: Generar Folio -> Subir Archivos -> Insertar Cabecera -> Insertar Detalles
 */

header('Content-Type: application/json');
require_once 'conexion.php'; // Tu archivo con $pdo

try {
    $pdo->beginTransaction();

    // 1. Validar datos mínimos
    $cliente = $_POST['cliente'] ?? throw new Exception("Selecciona un cliente.");
    $series = json_decode($_POST['series'], true);
    if (empty($series)) throw new Exception("No hay números de serie para registrar.");

    // 2. Generar Folio VT-00000
    $stmtF = $pdo->query("SELECT folio FROM ventas WHERE folio LIKE 'VT-%' ORDER BY id DESC LIMIT 1");
    $uFolio = $stmtF->fetchColumn();
    $nFolio = "VT-" . str_pad($uFolio ? (int)substr($uFolio, 3) + 1 : 1, 5, "0", STR_PAD_LEFT);

    // 3. Procesar Archivos (Uploads)
    $caminosFinales = [];
    if (isset($_FILES['facturas']) && !empty($_FILES['facturas']['name'][0])) {
        // Sanitizar nombre de cliente para carpeta
        $carpetaLimpia = preg_replace('/[^A-Za-z0-9_\-]/', '_', $cliente);
        $rutaBase = "../uploads/ventas/{$carpetaLimpia}/";

        if (!is_dir($rutaBase)) mkdir($rutaBase, 0777, true);

        foreach ($_FILES['facturas']['name'] as $k => $nom) {
            if ($_FILES['facturas']['error'][$k] === UPLOAD_ERR_OK) {
                $ext = pathinfo($nom, PATHINFO_EXTENSION);
                $nomArchivo = "{$nFolio}_" . time() . "_{$k}.{$ext}";
                $destino = $rutaBase . $nomArchivo;

                if (move_uploaded_file($_FILES['facturas']['tmp_name'][$k], $destino)) {
                    $caminosFinales[] = $destino;
                }
            }
        }
    }
    $pathDB = !empty($caminosFinales) ? implode(',', $caminosFinales) : null;

    // 4. Insertar Cabecera (Tabla: ventas)
    $sqlV = "INSERT INTO ventas (folio, cliente, sucursal, factura_path, fecha_registro) VALUES (?, ?, ?, ?, NOW())";
    $stmtV = $pdo->prepare($sqlV);
    $stmtV->execute([$nFolio, $cliente, $_POST['sucursal'], $pathDB]);
    $idVenta = $pdo->lastInsertId();

    // 5. Insertar Detalle (Tabla: venta_detalles)
    $sqlD = "INSERT INTO venta_detalles (venta_id, equipo, marca, modelo, numero_serie, garantia, servicio, notas) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmtD = $pdo->prepare($sqlD);

    foreach ($series as $s) {
        $stmtD->execute([
            $idVenta,
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