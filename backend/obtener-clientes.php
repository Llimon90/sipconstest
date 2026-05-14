<?php
// 1. FORZAR LA VISIBILIDAD DE ERRORES (Solo para depuración)
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

// 2. ATRAPAR ERRORES FATALES Y DEVOLVERLOS COMO JSON
register_shutdown_function(function() {
    $error = error_get_last();
    // Si hay un error fatal, lo imprimimos para que la respuesta no quede en blanco
    if ($error !== NULL && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        echo json_encode([
            "error_php_oculto" => true, 
            "mensaje" => $error['message'], 
            "archivo" => $error['file'], 
            "linea" => $error['line']
        ]);
    }
});

// 3. CARGAR MIDDLEWARE Y CONEXIÓN
require_once __DIR__ . '/../auth/middleware.php';

// 4. VERIFICAR QUE LA CONEXIÓN EXISTE REALMENTE
if (!isset($conn)) {
    die(json_encode(["error" => "La variable \$conn no existe. Revisa tu config/database.php"]));
}
if ($conn->connect_error) {
    die(json_encode(["error" => "Error de conexión BD: " . $conn->connect_error]));
}

// 5. EJECUTAR CONSULTA SQL
$busqueda = isset($_GET['busqueda']) ? $conn->real_escape_string($_GET['busqueda']) : '';

if ($busqueda) {
    $sql = "SELECT * FROM clientes WHERE 
            nombre LIKE '%$busqueda%' OR 
            rfc LIKE '%$busqueda%' OR 
            direccion LIKE '%$busqueda%' OR 
            telefono LIKE '%$busqueda%' OR 
            contactos LIKE '%$busqueda%' OR 
            email LIKE '%$busqueda%' 
            ORDER BY nombre";
} else {
    $sql = "SELECT * FROM clientes ORDER BY nombre";
}

$result = $conn->query($sql);

if (!$result) {
    die(json_encode(['error' => 'Error SQL: ' . $conn->error]));
}

$clientes = [];
while ($row = $result->fetch_assoc()) {
    $clientes[] = $row;
}

echo json_encode($clientes);
$conn->close();
?>