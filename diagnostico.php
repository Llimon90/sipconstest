<?php
// ARCHIVO TEMPORAL DE DIAGNÓSTICO — eliminar después de usarlo
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

$resultado = [];

// 1. Versión de PHP
$resultado['php_version'] = PHP_VERSION;

// 2. ¿Existe .env?
$envPath = __DIR__ . '/.env';
$resultado['env_existe'] = file_exists($envPath);

// 3. Cargar .env y leer vars
if ($resultado['env_existe']) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) continue;
        [$k, $v] = explode('=', $line, 2);
        $_ENV[trim($k)] = trim($v);
    }
    $resultado['db_host'] = $_ENV['DB_HOST'] ?? 'NO DEFINIDO';
    $resultado['db_user'] = $_ENV['DB_USER'] ?? 'NO DEFINIDO';
    $resultado['db_name'] = $_ENV['DB_NAME'] ?? 'NO DEFINIDO';
    $resultado['app_url'] = $_ENV['APP_URL'] ?? 'NO DEFINIDO';
    $resultado['db_pass_len'] = strlen($_ENV['DB_PASS'] ?? ''); // solo longitud, no el valor
} else {
    $resultado['env_error'] = 'El archivo .env NO existe en: ' . $envPath;
}

// 4. Conexión a BD
try {
    $conn = new mysqli(
        $_ENV['DB_HOST'] ?? '',
        $_ENV['DB_USER'] ?? '',
        $_ENV['DB_PASS'] ?? '',
        $_ENV['DB_NAME'] ?? ''
    );
    if ($conn->connect_error) {
        $resultado['db_conexion'] = 'ERROR: ' . $conn->connect_error;
    } else {
        $resultado['db_conexion'] = 'OK';
        $conn->close();
    }
} catch (Exception $e) {
    $resultado['db_conexion'] = 'EXCEPCION: ' . $e->getMessage();
}

// 5. Sesión
session_start();
$resultado['session_id']      = session_id();
$resultado['session_user_id'] = $_SESSION['user_id'] ?? 'NO HAY SESIÓN';
$resultado['session_usuario'] = $_SESSION['usuario'] ?? '-';
$resultado['session_rol']     = $_SESSION['rol']     ?? '-';

// 6. Archivos críticos
$archivos = [
    'auth/middleware.php',
    'auth/login.php',
    'auth/session_check.php',
    'config/database.php',
    'config/auth.php',
    'backend/conexion.php',
    'backend/server.php',
];
foreach ($archivos as $archivo) {
    $resultado['archivos'][$archivo] = file_exists(__DIR__ . '/' . $archivo) ? 'OK' : 'FALTA';
}

echo json_encode($resultado, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
