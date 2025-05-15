

<?php
header('Content-Type: application/json');

require_once 'conexion.php';

if ($conn->connect_error) {
    die(json_encode(["error" => "Error de conexión: " . $conn->connect_error]));
}

$id = $_POST['id'];
$nombre = $_POST['nombre'];
$rfc = $_POST['rfc'];
$direccion = $_POST['direccion'];
$telefono = $_POST['telefono'];
$contactos = $_POST['contactos'];
$email = $_POST['email'];

$sql = "UPDATE clientes SET nombre = ?, rfc = ?, direccion = ?, telefono = ?, contactos = ?, email = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssssssi", $nombre, $rfc, $direccion, $telefono, $contactos, $email, $id);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["error" => "Error al actualizar el cliente"]);
}

$stmt->close();
$conn->close();
?>