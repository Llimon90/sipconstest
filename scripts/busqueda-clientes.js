fetch('busqueda-clientes.php', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ consulta }),
})
.then(response => {
    if (!response.ok) {
        // Si la respuesta no es exitosa, lanza un error con el estado
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.text(); // Lee la respuesta como texto
})
.then(text => {
    try {
        const data = JSON.parse(text); // Intenta analizar el texto como JSON
        // Procesa los datos aquí
    } catch (error) {
        console.error('Error al analizar JSON:', error);
        console.log('Respuesta del servidor:', text);
    }
})
.catch(error => {
    console.error('Error en la solicitud Fetch:', error);
});
