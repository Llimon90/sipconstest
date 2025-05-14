$(document).ready(function() {
    $('#busqueda').keyup(function() {
        var consulta = $(this).val();
        if (consulta.length > 0) {
            $.ajax({
                url: '../backend/busqueda-clientes.php',
                method: 'POST',
                data: { consulta: consulta },
                success: function(data) {
                    $('#lista-clientes').html(data);
                }
            });
        } else {
            // Si el campo de búsqueda está vacío, podrías cargar todos los clientes o dejar la tabla vacía
            $('#lista-clientes').html('');
        }
    });
});
