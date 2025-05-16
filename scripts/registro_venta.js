document.getElementById('form-venta').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const mensajeElement = document.getElementById('mensaje');
  mensajeElement.textContent = '';
  mensajeElement.className = '';

  // Obtener valores del formulario
  const formData = {
    cliente: document.getElementById('cliente').value.trim(),
    sucursal: document.getElementById('sucursal').value.trim(),
    equipo: document.getElementById('equipo').value.trim(),
    marca: document.getElementById('marca').value.trim(),
    modelo: document.getElementById('modelo').value.trim(),
    numero_serie: document.getElementById('numero_serie').value.trim(),
    garantia: document.getElementById('garantia').value.trim(),
    notas: document.getElementById('notas').value.trim()
  };

  // Validar campos requeridos
  if (!formData.cliente || !formData.equipo || !formData.garantia) {
    mensajeElement.textContent = 'Por favor, complete todos los campos obligatorios.';
    mensajeElement.className = 'error';
    return;
  }

  try {
    const response = await fetch('../backend/registro_ventas.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error en el servidor');
    }

    mensajeElement.textContent = data.mensaje;
    mensajeElement.className = 'success';

    if (data.exito) {
      document.getElementById('form-venta').reset();
    }

  } catch (error) {
    console.error('Error:', error);
    mensajeElement.textContent = error.message || 'Error al conectar con el servidor';
    mensajeElement.className = 'error';
  }
});