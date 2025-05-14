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
?>
