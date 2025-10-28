<?php
header('Content-Type: application/json');
require_once 'conexion.php';

$db = new Database();
$conn = $db->getConnection();

$action = $_GET['action'] ?? '';

try {
    switch($action) {
        case 'get_marcas':
            getMarcas($conn);
            break;
        case 'get_modelos':
            getModelos($conn);
            break;
        case 'get_documentos':
            getDocumentos($conn);
            break;
        case 'add_marca':
            addMarca($conn);
            break;
        case 'add_modelo':
            addModelo($conn);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
} catch(Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

function getMarcas($conn) {
    $stmt = $conn->prepare("SELECT id, nombre FROM marcas WHERE activo = 1 ORDER BY nombre");
    $stmt->execute();
    $marcas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'marcas' => $marcas]);
}

function getModelos($conn) {
    $marca_id = $_GET['marca_id'] ?? null;
    
    if (!$marca_id) {
        echo json_encode(['success' => false, 'message' => 'ID de marca no proporcionado']);
        return;
    }

    $stmt = $conn->prepare("
        SELECT m.id, m.nombre, m.tipo_equipo, ma.nombre as marca_nombre 
        FROM modelos m 
        INNER JOIN marcas ma ON m.marca_id = ma.id 
        WHERE m.marca_id = ? AND m.activo = 1 
        ORDER BY m.nombre
    ");
    $stmt->execute([$marca_id]);
    $modelos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'modelos' => $modelos]);
}

function getDocumentos($conn) {
    $modelo_id = $_GET['modelo_id'] ?? null;
    
    if (!$modelo_id) {
        echo json_encode(['success' => false, 'message' => 'ID de modelo no proporcionado']);
        return;
    }

    $stmt = $conn->prepare("
        SELECT * FROM documentos 
        WHERE modelo_id = ? 
        ORDER BY tipo_documento
    ");
    $stmt->execute([$modelo_id]);
    $documentos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'documentos' => $documentos]);
}

function addMarca($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $nombre = trim($data['nombre'] ?? '');

    if (empty($nombre)) {
        echo json_encode(['success' => false, 'message' => 'El nombre de la marca es requerido']);
        return;
    }

    $stmt = $conn->prepare("INSERT INTO marcas (nombre) VALUES (?)");
    $stmt->execute([$nombre]);
    
    echo json_encode(['success' => true, 'message' => 'Marca agregada correctamente', 'id' => $conn->lastInsertId()]);
}

function addModelo($conn) {
    $marca_id = $_POST['marca_id'] ?? '';
    $nombre = trim($_POST['nombre'] ?? '');
    $tipo_equipo = trim($_POST['tipo_equipo'] ?? '');

    if (empty($marca_id) || empty($nombre) || empty($tipo_equipo)) {
        echo json_encode(['success' => false, 'message' => 'Todos los campos son requeridos']);
        return;
    }

    // Insertar modelo
    $stmt = $conn->prepare("INSERT INTO modelos (marca_id, nombre, tipo_equipo) VALUES (?, ?, ?)");
    $stmt->execute([$marca_id, $nombre, $tipo_equipo]);
    $modelo_id = $conn->lastInsertId();

    // Directorio para guardar archivos
    $upload_dir = '../uploads/documentos/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    // Procesar archivos subidos
    $documentos_subidos = [];

    if (isset($_FILES['manual_file']) && $_FILES['manual_file']['error'] === UPLOAD_ERR_OK) {
        $manual_file = guardarDocumento($conn, $modelo_id, 'manual', $_FILES['manual_file'], $upload_dir);
        if ($manual_file) $documentos_subidos[] = $manual_file;
    }

    if (isset($_FILES['partes_file']) && $_FILES['partes_file']['error'] === UPLOAD_ERR_OK) {
        $partes_file = guardarDocumento($conn, $modelo_id, 'lista_partes', $_FILES['partes_file'], $upload_dir);
        if ($partes_file) $documentos_subidos[] = $partes_file;
    }

    echo json_encode([
        'success' => true, 
        'message' => 'Modelo agregado correctamente', 
        'id' => $modelo_id,
        'documentos' => $documentos_subidos
    ]);
}

function guardarDocumento($conn, $modelo_id, $tipo, $file, $upload_dir) {
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    if (strtolower($extension) !== 'pdf') {
        return false;
    }

    $nombre_archivo = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $file['name']);
    $ruta_completa = $upload_dir . $nombre_archivo;

    if (move_uploaded_file($file['tmp_name'], $ruta_completa)) {
        $stmt = $conn->prepare("
            INSERT INTO documentos (modelo_id, tipo_documento, nombre_archivo, ruta_archivo) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$modelo_id, $tipo, $file['name'], $ruta_completa]);
        return ['tipo' => $tipo, 'nombre' => $file['name']];
    }

    return false;
}
?>