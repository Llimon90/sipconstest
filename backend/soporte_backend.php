<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Configuración de errores para desarrollo
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Incluir conexión
require_once 'conexion.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Obtener la acción desde GET o POST
    $action = $_GET['action'] ?? ($_POST['action'] ?? '');
    
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
            echo json_encode(['success' => false, 'message' => 'Acción no válida: ' . $action]);
    }
} catch(Exception $e) {
    error_log("Error en soporte_backend.php: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => 'Error del servidor: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}

function getMarcas($conn) {
    try {
        $stmt = $conn->prepare("SELECT id, nombre FROM marcas WHERE activo = 1 ORDER BY nombre");
        $stmt->execute();
        $marcas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true, 
            'marcas' => $marcas,
            'count' => count($marcas)
        ]);
    } catch(PDOException $e) {
        throw new Exception("Error al obtener marcas: " . $e->getMessage());
    }
}

function getModelos($conn) {
    try {
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
        
        echo json_encode([
            'success' => true, 
            'modelos' => $modelos,
            'count' => count($modelos)
        ]);
    } catch(PDOException $e) {
        throw new Exception("Error al obtener modelos: " . $e->getMessage());
    }
}

function getDocumentos($conn) {
    try {
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
        
        echo json_encode([
            'success' => true, 
            'documentos' => $documentos,
            'count' => count($documentos)
        ]);
    } catch(PDOException $e) {
        throw new Exception("Error al obtener documentos: " . $e->getMessage());
    }
}

function addMarca($conn) {
    try {
        // Leer datos JSON
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('JSON inválido: ' . json_last_error_msg());
        }
        
        $nombre = trim($data['nombre'] ?? '');

        if (empty($nombre)) {
            echo json_encode(['success' => false, 'message' => 'El nombre de la marca es requerido']);
            return;
        }

        // Verificar si la marca ya existe
        $stmt = $conn->prepare("SELECT id FROM marcas WHERE nombre = ?");
        $stmt->execute([$nombre]);
        
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'La marca ya existe']);
            return;
        }

        $stmt = $conn->prepare("INSERT INTO marcas (nombre) VALUES (?)");
        $stmt->execute([$nombre]);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Marca agregada correctamente', 
            'id' => $conn->lastInsertId()
        ]);
    } catch(PDOException $e) {
        throw new Exception("Error al agregar marca: " . $e->getMessage());
    }
}

function addModelo($conn) {
    try {
        $marca_id = $_POST['marca_id'] ?? '';
        $nombre = trim($_POST['nombre'] ?? '');
        $tipo_equipo = trim($_POST['tipo_equipo'] ?? '');

        if (empty($marca_id) || empty($nombre) || empty($tipo_equipo)) {
            echo json_encode(['success' => false, 'message' => 'Todos los campos son requeridos']);
            return;
        }

        // Verificar si el modelo ya existe para esta marca
        $stmt = $conn->prepare("SELECT id FROM modelos WHERE marca_id = ? AND nombre = ?");
        $stmt->execute([$marca_id, $nombre]);
        
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'El modelo ya existe para esta marca']);
            return;
        }

        // Insertar modelo
        $stmt = $conn->prepare("INSERT INTO modelos (marca_id, nombre, tipo_equipo) VALUES (?, ?, ?)");
        $stmt->execute([$marca_id, $nombre, $tipo_equipo]);
        $modelo_id = $conn->lastInsertId();

        // Directorio para guardar archivos
        $upload_dir = '../uploads/documentos/';
        if (!is_dir($upload_dir)) {
            if (!mkdir($upload_dir, 0755, true)) {
                throw new Exception("No se pudo crear el directorio de uploads");
            }
        }

        // Procesar archivos subidos
        $documentos_subidos = [];

        // Procesar manual
        if (isset($_FILES['manual_file']) && $_FILES['manual_file']['error'] === UPLOAD_ERR_OK) {
            $manual_file = guardarDocumento($conn, $modelo_id, 'manual', $_FILES['manual_file'], $upload_dir);
            if ($manual_file) $documentos_subidos[] = $manual_file;
        }

        // Procesar lista de partes
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
    } catch(PDOException $e) {
        throw new Exception("Error al agregar modelo: " . $e->getMessage());
    }
}

function guardarDocumento($conn, $modelo_id, $tipo, $file, $upload_dir) {
    // Validar que sea PDF
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime_type = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if ($mime_type !== 'application/pdf') {
        error_log("Tipo de archivo no permitido: " . $mime_type);
        return false;
    }

    // Generar nombre seguro para el archivo
    $extension = 'pdf';
    $nombre_base = preg_replace('/[^a-zA-Z0-9._-]/', '_', pathinfo($file['name'], PATHINFO_FILENAME));
    $nombre_archivo = $nombre_base . '_' . uniqid() . '.' . $extension;
    $ruta_completa = $upload_dir . $nombre_archivo;

    if (move_uploaded_file($file['tmp_name'], $ruta_completa)) {
        $stmt = $conn->prepare("
            INSERT INTO documentos (modelo_id, tipo_documento, nombre_archivo, ruta_archivo) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$modelo_id, $tipo, $file['name'], $ruta_completa]);
        
        return [
            'tipo' => $tipo, 
            'nombre' => $file['name'],
            'ruta' => $ruta_completa
        ];
    }

    error_log("Error al mover archivo subido: " . $file['name']);
    return false;
}
?>