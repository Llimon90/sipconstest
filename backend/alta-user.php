<?php
header('Content-Type: application/json');

// Configuración de la base de datos
$host = "localhost";
$user = "sipcons1_test";
$password = "sip*SYS2025";
$database = "sipcons1_sipcons_test";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Obtener y sanitizar los datos del formulario
    $nombre = trim($_POST['nombre'] ?? '');
    $correo = trim($_POST['correo'] ?? '');
    $telefono = trim($_POST['telefono'] ?? '');
    $usuario = trim($_POST['usuario'] ?? '');
    $password = $_POST['password'] ?? '';
    $rol = $_POST['rol'] ?? '';

    // Validar que todos los campos estén completos
    if (empty($nombre) || empty($correo) || empty($telefono) || empty($usuario) || empty($password) || empty($rol)) {
        echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios']);
        exit;
    }

    // Encriptar la contraseña
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insertar los datos en la base de datos
    $stmt = $pdo->prepare("INSERT INTO usuarios (nombre, correo, telefono, usuario, password, rol) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$nombre, $correo, $telefono, $usuario, $hashedPassword, $rol]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error al conectar con la base de datos: ' . $e->getMessage()]);
}
?>
