const form = document.getElementById('new-incidencia-form');

  // Establecer la fecha actual
  document.getElementById('fecha').value = new Date().toISOString().split('T')[0];

  form.addEventListener('submit', function(event) {
    event.preventDefault();

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
      alert(data.message || data.error);
      form.reset();  // ⇒ Limpia todo el formulario
      // Opcional: volver a establecer la fecha actual tras reset
      document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
    })
    .catch(error => {
      console.error('Error al enviar los datos:', error);
      alert('Hubo un error al enviar los datos');
    });
  });