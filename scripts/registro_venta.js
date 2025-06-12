document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const form = document.getElementById('form-venta');
    const btnRegistrar = document.getElementById('btn-registrar-venta');
    const mensajeElement = document.getElementById('mensaje');
    
    // Verificar que los elementos existen
    if (!form || !btnRegistrar || !mensajeElement) {
        console.error('Error: No se encontraron todos los elementos necesarios');
        return;
    }
    
    // Función para mostrar mensajes
    function showMessage(message, type = 'info') {
        mensajeElement.textContent = message;
        mensajeElement.className = type;
        
        if (type === 'success') {
            setTimeout(() => {
                mensajeElement.textContent = '';
                mensajeElement.className = '';
            }, 5000);
        }
    }
    
    // Función para validar el formulario
    function validateForm() {
        const requiredFields = [
            { id: 'cliente', name: 'Cliente' },
            { id: 'equipo', name: 'Equipo' },
            { id: 'garantia', name: 'Garantía' }
        ];
        
        const missingFields = [];
        
        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (!element || !element.value.trim()) {
                missingFields.push(field.name);
            }
        });
        
        if (missingFields.length > 0) {
            showMessage(`Faltan campos obligatorios: ${missingFields.join(', ')}`, 'error');
            return false;
        }
        
        return true;
    }
    
    // Función para obtener los datos del formulario
    function getFormData() {
        return {
            cliente: document.getElementById('cliente').value.trim(),
            sucursal: document.getElementById('sucursal').value.trim(),
            equipo: document.getElementById('equipo').value.trim(),
            marca: document.getElementById('marca').value.trim(),
            modelo: document.getElementById('modelo').value.trim(),
            numero_serie: document.getElementById('numero_serie').value.trim(),
            qty: document.getElementById('qty').value.trim() || '1',
            garantia: document.getElementById('garantia').value.trim(),
            servicio: document.getElementById('servicio').checked,
            notas: document.getElementById('notas').value.trim()
        };
    }
    
    // Función para enviar los datos
    async function submitForm() {
        if (!validateForm()) return;
        
        const formData = getFormData();
        
        try {
            showMessage('Enviando datos...', 'info');
            
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
                throw new Error('La respuesta del servidor no es JSON');
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.mensaje || `Error ${response.status}`);
            }
            
            showMessage(data.mensaje || 'Venta registrada exitosamente', 'success');
            
            if (data.exito) {
                form.reset();
            }
            
        } catch (error) {
            console.error('Error:', error);
            showMessage(error.message || 'Error al conectar con el servidor', 'error');
        }
    }
    
    // Event listeners
    btnRegistrar.addEventListener('click', submitForm);
    
    // También manejamos el evento submit por si acaso
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitForm();
    });
});