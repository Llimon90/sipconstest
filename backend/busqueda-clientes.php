<?php
$conexion = new mysqli('localhost', 'user', 'password', 'database');

if (isset($_POST['consulta'])) {
    $consulta = $conexion->real_escape_string($_POST['consulta']);
    $sql = "SELECT nombre FROM tabla WHERE nombre LIKE '%$consulta%' LIMIT 5";
    $resultado = $conexion->query($sql);

    if ($resultado->num_rows > 0) {
        echo '<ul>';
        while ($fila = $resultado->fetch_assoc()) {
            echo '<li>' . $fila['nombre'] . '</li>';
        }
        echo '</ul>';
    } else {
        echo '<p>No se encontraron resultados</p>';
    }
}
   // **INICIO - FUNCIÓN PARA MOSTRAR LA BASE DE DATOS EN EL DOM**
    
    // Consulta para obtener todas las incidencias sin filtrar
    $sql = "SELECT * FROM incidencias WHERE estatus IN ('Abierto','Asignado', 'Pendiente', 'Completado') ORDER BY numero_incidente DESC; ";






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
?>
