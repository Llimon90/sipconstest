  const form = document.getElementById('new-incidencia-form');

  // Establecer la fecha actual en el input al cargar
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
      // Mostrar alert, bloqueará la ejecución hasta que se cierre
      alert(data.message || data.error);

      // Recargar la página al pulsar "Aceptar" del alert
      window.location.reload();  // recarga completa :contentReference[oaicite:1]{index=1}
    })
    .catch(error => {
      console.error('Error al enviar los datos:', error);
      alert('Hubo un error al enviar los datos');
    });
  });