$(document).ready(function() {
    $('#busqueda').keyup(function() {
        var consulta = $(this).val();
        if (consulta.length > 0) {
            $.ajax({
                url: 'busqueda-clientes.php',
                method: 'POST',
                data: { consulta: consulta },
                success: function(data) {
                    $('#resultados').fadeIn();
                    $('#resultados').html(data);
                }
            });
        } else {
            $('#resultados').fadeOut();
        }
    });

    $(document).on('click', 'li', function() {
        $('#busqueda').val($(this).text());
        $('#resultados').fadeOut();
    });
});
