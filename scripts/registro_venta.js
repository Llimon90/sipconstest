document.getElementById('form-venta').addEventListener('submit', function(e) {
  e.preventDefault();

  const cliente = document.getElementById('cliente').value.trim();
  const sucursal = document.getElementById('sucursal').value.trim();
  const equipo = document.getElementById('equipo').value.trim();
  const marca = document.getElementById('marca').value.trim();
  const modelo = document.getElementById('modelo').value.trim();
  const numero_serie = document.getElementById('numero_serie').value.trim();
  const garantia = document.getElementById('garantia').value.trim();
  const notas = document.getElementById('notas').value.trim();

  if (!cliente || !equipo  || !garantia) {
    document.getElementById('mensaje').textContent = 'Por favor, complete todos los campos obligatorios.';
    return;
  }

  const datos = new FormData();
  datos.append('cliente', cliente);
  datos.append('sucursal', sucursal);
  datos.append('equipo', equipo);
  datos.append('marca', marca);
  datos.append('modelo', modelo);
  datos.append('numero_serie', numero_serie);
  datos.append('garantia', garantia);
  datos.append('notas', notas);

  fetch('../backend/registro_venta', {
    method: 'POST',
    body: datos
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById('mensaje').textContent = data.mensaje;
    if (data.exito) {
      document.getElementById('form-venta').reset();
    }
  })
  .catch(error => {
    document.getElementById('mensaje').textContent = 'Error al registrar la venta.';
    console.error('Error:', error);
  });
});
