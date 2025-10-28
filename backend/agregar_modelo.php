<?php
// backend/agregar_modelo.php
include 'conexion.php';

header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $marca_id = $_POST['marca'];
    $modelo_nombre = $_POST['modelo_nombre'];
    $modelo_tipo = $_POST['modelo_tipo'];
    
    try {
        // Insertar el modelo en la base de datos
        $stmt = $conn->prepare("INSERT INTO modelos (marca_id, nombre, tipo) VALUES (?, ?, ?)");
        $stmt->execute([$marca_id, $modelo_nombre, $modelo_tipo]);
        $modelo_id = $conn->lastInsertId();
        
        // Obtener nombre de la marca
        $stmt = $conn->prepare("SELECT nombre FROM marcas WHERE id = ?");
        $stmt->execute([$marca_id]);
        $marca_nombre = $stmt->fetchColumn();
        
        // Crear la estructura de carpetas
        $base_path = "../manuales/" . sanitizeFileName($marca_nombre) . "/" . sanitizeFileName($modelo_nombre) . "/";
        
        // Crear carpetas si no existen
        if (!file_exists($base_path)) {
            mkdir($base_path, 0777, true);
        }
        
        // Procesar archivos subidos
        $archivos_procesados = [];
        
        if (isset($_FILES['manual_file']) && $_FILES['manual_file']['error'] === UPLOAD_ERR_OK) {
            $archivos_procesados[] = procesarArchivo($_FILES['manual_file'], $base_path, 'manual', $modelo_id, $conn, $marca_nombre, $modelo_nombre);
        }
        
        if (isset($_FILES['partes_file']) && $_FILES['partes_file']['error'] === UPLOAD_ERR_OK) {
            $archivos_procesados[] = procesarArchivo($_FILES['partes_file'], $base_path, 'partes', $modelo_id, $conn, $marca_nombre, $modelo_nombre);
        }
        
        echo json_encode([
            'success' => true, 
            'message' => 'Modelo agregado correctamente.',
            'carpeta' => $base_path,
            'archivos' => $archivos_procesados
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function sanitizeFileName($name) {
    return preg_replace('/[^a-zA-Z0-9_-]/', '_', $name);
}

function procesarArchivo($archivo, $base_path, $tipo, $modelo_id, $conn, $marca_nombre, $modelo_nombre) {
    if ($archivo['error'] === UPLOAD_ERR_OK) {
        $extension = pathinfo($archivo['name'], PATHINFO_EXTENSION);
        $nombre_base = ($tipo == 'manual') ? 'Manual_Usuario' : 'Lista_Partes';
        $nombre_archivo = $modelo_nombre . '_' . $nombre_base . '.' . $extension;
        $ruta_completa = $base_path . $nombre_archivo;
        
        if (move_uploaded_file($archivo['tmp_name'], $ruta_completa)) {
            // Guardar en la base de datos
            $stmt = $conn->prepare("INSERT INTO documentos (modelo_id, tipo, nombre, archivo) VALUES (?, ?, ?, ?)");
            $nombre_documento = ($tipo == 'manual') ? 'Manual de Usuario' : 'Lista de Números de Parte';
            $stmt->execute([$modelo_id, $tipo, $nombre_documento, $nombre_archivo]);
            
            return [
                'tipo' => $tipo,
                'archivo' => $nombre_archivo,
                'ruta' => $ruta_completa
            ];
        }
    }
    return null;
}
?>