document.addEventListener('DOMContentLoaded', () => {
    const busquedaInput = document.getElementById('busqueda');
    const resultados = document.getElementById('lista-clientes');

    busquedaInput.addEventListener('keyup', () => {
        const consulta = busquedaInput.value.trim();

        if (consulta.length > 0) {
            fetch('../backend/busqueda-clientes.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({ consulta }),
            })
            .then(response => response.json())
            .then(data => {
                lista-clientes.innerHTML = '';
                if (data.length > 0) {
                    const ul = document.createElement('ul');
                    data.forEach(cliente => {
                        const li = document.createElement('li');
                        li.textContent = `${cliente.nombre} - ${cliente.rfc}`;
                        ul.appendChild(li);
                    });
                    lista-clientes.appendChild(ul);
                } else {
                    resultados.textContent = 'No se encontraron resultados';
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        } else {
            resultados.innerHTML = '';
        }
    });
});
