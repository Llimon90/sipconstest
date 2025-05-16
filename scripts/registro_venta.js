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
    showMessage('Por favor, complete todos los campos obligatorios.', 'error');
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

    // Verificar si la respuesta es JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Respuesta inesperada del servidor: ${text.substring(0, 100)}...`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || `Error ${response.status}`);
    }

    showMessage(data.mensaje, 'success');
    
    if (data.exito) {
      document.getElementById('form-venta').reset();
    }

  } catch (error) {
    console.error('Error:', error);
    showMessage(error.message || 'Error al conectar con el servidor', 'error');
  }
});

function showMessage(message, type) {
  const element = document.getElementById('mensaje');
  element.textContent = message;
  element.className = type;
  
  // Opcional: desvanecer el mensaje después de 5 segundos
  if (type === 'success') {
    setTimeout(() => {
      element.textContent = '';
      element.className = '';
    }, 5000);
  }
}