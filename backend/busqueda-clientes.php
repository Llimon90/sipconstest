<?php
require_once 'conexion.php';

if (isset($_POST['consulta'])) {
    $consulta = $conexion->real_escape_string($_POST['consulta']);
    $sql = "SELECT nombre, rfc, direccion, telefono, contactos, email FROM clientes WHERE nombre LIKE '%$consulta%' LIMIT 5";
    $resultado = $conexion->query($sql);

    if ($resultado->num_rows > 0) {
        while ($fila = $resultado->fetch_assoc()) {
            echo '<tr>';
            echo '<td>' . htmlspecialchars($fila['nombre']) . '</td>';
            echo '<td>' . htmlspecialchars($fila['rfc']) . '</td>';
            echo '<td>' . htmlspecialchars($fila['direccion']) . '</td>';
            echo '<td>' . htmlspecialchars($fila['telefono']) . '</td>';
            echo '<td>' . htmlspecialchars($fila['contactos']) . '</td>';
            echo '<td>' . htmlspecialchars($fila['email']) . '</td>';
            echo '<td><button class="editar">Editar</button> <button class="eliminar">Eliminar</button></td>';
            echo '</tr>';
        }
    } else {
        echo '<tr><td colspan="7">No se encontraron resultados</td></tr>';
    }
}
?>
