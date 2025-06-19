

//ENVIA INCIDENCIAS A BD


document.getElementById('new-incidencia-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevenir envío por defecto
    
    const nuevaIncidencia = {
        numero: document.getElementById('numero').value,
        cliente: document.getElementById('cliente').value,
        contacto: document.getElementById('contacto').value,
        sucursal: document.getElementById('sucursal').value,
        falla: document.getElementById('falla').value,
        fecha: document.getElementById('fecha').value,
        tecnico: document.getElementById('tecnico').value,
        status: document.getElementById('estatus').value,
        notas: document.getElementById('notas').value,
    };

    fetch('../backend/server.php', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaIncidencia),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Respuesta del servidor:', data);
        alert(data.message || data.error);
    })
    .catch(error => {
        console.error('Error al enviar los datos:', error);
        alert('Hubo un error al enviar los datos');
    });
});



//FUNCION PARA TENER FECHA ACTUAL EN INPUT FECHA INCIDENCIA
const fechaActual = new Date().toISOString().split('T')[0];

document.getElementById('fecha').value = fechaActual;

//OBTENER USURAIOS TECNICOS DESDE BD


// Función específica para cargar solo técnicos en el select
async function cargarTecnicosEnSelect() {
    try {
        const response = await fetch('../backend/obtener-tecnicos.php');
        if (!response.ok) {
            throw new Error('Error al obtener los técnicos');
        }
        
        const tecnicos = await response.json();
    
        const selectTecnico = document.getElementById('tecnico');
        selectTecnico.innerHTML = '<option value="">Seleccione un técnico</option>';
    
        tecnicos.forEach(tecnico => {
            const option = document.createElement('option');
            option.value = tecnico.id; // Usar ID es mejor práctica
            option.textContent = tecnico.nombre;
            selectTecnico.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar técnicos:', error);
        alert('Error al cargar la lista de técnicos');
    }
}

// Llamar la función cuando se cargue la página
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("fecha").value = new Date().toISOString().split('T')[0];
    cargarTecnicosEnSelect(); // Esta es la nueva función específica para técnicos
    // Tu función para cargar todos los usuarios puede seguir aquí si es necesaria
});