

//ENVIA INCIDENCIAS A BD


document.getElementById('new-incidencia-form').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevenir envío por defecto

  // Obtener todos los técnicos seleccionados
  const tecnicosSelects = document.querySelectorAll('select[name="tecnicos[]"]');
  const tecnicos = [];
  tecnicosSelects.forEach(select => {
    if (select.value) {
      tecnicos.push(select.value);
    }
  });

  const nuevaIncidencia = {
    numero: document.getElementById('numero').value,
    cliente: document.getElementById('cliente').value,
    contacto: document.getElementById('contacto').value,
    sucursal: document.getElementById('sucursal').value,
    falla: document.getElementById('falla').value,
    fecha: document.getElementById('fecha').value,
    tecnicos: tecnicos,
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


