document.addEventListener('DOMContentLoaded', function() {
  // Configurar fecha actual
  document.getElementById("fecha").value = new Date().toISOString().split('T')[0];
  
  // Obtener todas las opciones originales de técnicos
  const originalOptions = Array.from(document.querySelector('.select-tecnico').options)
    .map(option => option.value)
    .filter(value => value); // Eliminar la opción vacía
  
  // Manejar el botón de agregar técnico
  const agregarTecnicoBtn = document.getElementById('agregar-tecnico');
  const tecnicosContainer = document.getElementById('tecnicos-container');
  
  // Función para crear un nuevo select de técnico
  function createNewTechnicianSelect() {
    // Clonar el primer select de técnico
    const originalSelect = tecnicosContainer.querySelector('.select-tecnico');
    const newSelect = originalSelect.cloneNode(true);
    
    // Resetear el valor del nuevo select
    newSelect.value = '';
    
    // Agregar botón para eliminar este select
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Eliminar';
    removeBtn.className = 'eliminar-tecnico';
    removeBtn.addEventListener('click', function() {
      newSelect.remove();
      removeBtn.nextElementSibling?.remove(); // Eliminar el <br> si existe
      removeBtn.remove();
      updateSelectsAvailability(); // Actualizar disponibilidad al eliminar
    });
    
    // Evento para actualizar disponibilidad cuando se cambia la selección
    newSelect.addEventListener('change', updateSelectsAvailability);
    
    return { newSelect, removeBtn };
  }
  
  // Función para actualizar la disponibilidad de opciones en todos los selects
  function updateSelectsAvailability() {
    const allSelects = tecnicosContainer.querySelectorAll('.select-tecnico');
    const selectedValues = Array.from(allSelects)
      .map(select => select.value)
      .filter(value => value);
    
    allSelects.forEach(select => {
      const currentValue = select.value;
      
      Array.from(select.options).forEach(option => {
        if (!option.value) return; // No afectar la opción vacía
        
        // Habilitar/deshabilitar según si está seleccionado en otro select
        option.disabled = selectedValues.includes(option.value) && option.value !== currentValue;
      });
    });
    
    // Habilitar/deshabilitar botón de agregar técnico
    const currentSelects = tecnicosContainer.querySelectorAll('.select-tecnico');
    agregarTecnicoBtn.disabled = currentSelects.length >= originalOptions.length;
  }
  
  // Evento para el botón de agregar técnico
  agregarTecnicoBtn.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Obtener todos los selects actuales
    const currentSelects = tecnicosContainer.querySelectorAll('.select-tecnico');
    
    // Verificar si ya se alcanzó el máximo de técnicos
    if (currentSelects.length >= originalOptions.length) {
      alert('No hay más técnicos disponibles para agregar');
      return;
    }
    
    // Crear nuevo select
    const { newSelect, removeBtn } = createNewTechnicianSelect();
    
    // Agregar elementos al contenedor
    tecnicosContainer.appendChild(newSelect);
    tecnicosContainer.appendChild(removeBtn);
    tecnicosContainer.appendChild(document.createElement('br'));
    
    // Actualizar disponibilidad de opciones
    updateSelectsAvailability();
  });
  
  // Inicializar disponibilidad
  updateSelectsAvailability();
  
  // Manejar el envío del formulario
  document.getElementById('new-incidencia-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Recolectar todos los técnicos seleccionados (puede ser vacío)
    const tecnicosSelects = document.querySelectorAll('.select-tecnico');
    const tecnicos = Array.from(tecnicosSelects)
      .map(select => select.value)
      .filter(value => value); // Filtrar valores vacíos
    
    const nuevaIncidencia = {
      numero: document.getElementById('numero').value,
      cliente: document.getElementById('cliente').value,
      contacto: document.getElementById('contacto').value,
      sucursal: document.getElementById('sucursal').value,
      falla: document.getElementById('falla').value,
      fecha: document.getElementById('fecha').value,
      tecnicos: tecnicos, // Puede ser array vacío
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
});