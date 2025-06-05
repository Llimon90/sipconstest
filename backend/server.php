<?php
// Configurar conexión con la base de datos
require_once 'conexion.php';

// Verificar la conexión
if ($conn->connect_error) {
    die(json_encode(["error" => "Error de conexión: " . $conn->connect_error]));
}

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER["REQUEST_METHOD"];

if ($method === "GET") {
    $sql = "SELECT * FROM incidencias WHERE estatus IN ('Abierto','Asignado', 'Pendiente', 'Completado') ORDER BY numero_incidente DESC;";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $incidencias = [];
        while($row = $result->fetch_assoc()) {
            $incidencias[] = $row;
        }
        echo json_encode($incidencias);
    } else {
        echo json_encode(["message" => "No hay incidencias abiertas"]);
    }
    
} elseif ($method === "POST") {
    // Leer los datos enviados desde fetch()
    $data = json_decode(file_get_contents("php://input"), true);

    // Validar solo los campos obligatorios
    if (!isset($data["cliente"], $data["contacto"], $data["status"])) {
        echo json_encode(["error" => "Los campos cliente, contacto y estatus son obligatorios"]);
        exit();
    }

    // Asignar valores por defecto a campos no obligatorios
    $numero = isset($data["numero"]) ? $data["numero"] : "";
    $sucursal = isset($data["sucursal"]) ? $data["sucursal"] : "";
    $fecha = isset($data["fecha"]) ? $data["fecha"] : date('Y-m-d'); // Fecha actual por defecto
    $tecnico = isset($data["tecnicos"]) ? implode("/", $data["tecnicos"]) : "";
    $falla = isset($data["falla"]) ? $data["falla"] : "";
    $notas = isset($data["notas"]) ? $data["notas"] : "";

    // Obtener el último número de incidencia
    $sqlUltimoNumero = "SELECT numero_incidente FROM incidencias ORDER BY id DESC LIMIT 1";
    $result = $conn->query($sqlUltimoNumero);

    $nuevoNumeroIncidente = "SIP-0001"; // Valor inicial si no hay registros

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $ultimoNumero = $row["numero_incidente"];
        $numeroIncremental = intval(explode("-", $ultimoNumero)[1]) + 1;
        $nuevoNumeroIncidente = "SIP-" . str_pad($numeroIncremental, 4, "0", STR_PAD_LEFT);
    }

    // Insertar la nueva incidencia
    $sql = "INSERT INTO incidencias (numero, cliente, contacto, sucursal, fecha, tecnico, estatus, falla, notas, numero_incidente) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssssssssss", $numero, $data["cliente"], $data["contacto"], $sucursal, $fecha, $tecnico, $data["status"], $falla, $notas, $nuevoNumeroIncidente);

    if ($stmt->execute()) {
        echo json_encode([
            "message" => "Incidencia registrada correctamente", 
            "numero_incidente" => $nuevoNumeroIncidente, 
            "id" => $stmt->insert_id
        ]);
    } else {
        echo json_encode(["error" => "Error al insertar incidencia: " . $stmt->error]);
    }

    $stmt->close();
}

$conn->close();
?>