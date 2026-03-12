/**
 * scripts/ventas.js
 * Sistema de Control de Incidencias - Módulo de Ventas
 */

document.addEventListener('DOMContentLoaded', () => {
    const formVenta = document.getElementById('form-venta');
    const qtyInput = document.getElementById('qty');
    const seriesContainer = document.getElementById('series-container');
    const btnRegistrar = document.getElementById('btn-registrar-venta');
    const cuerpoTabla = document.getElementById('cuerpo-tabla-ventas');
    const clienteSelect = document.getElementById('cliente');
    const mensajeDiv = document.getElementById('mensaje');

    // --- 1. GENERACIÓN DINÁMICA DE CAMPOS DE SERIE ---
    const actualizarCamposSerie = () => {
        const cantidad = parseInt(qtyInput.value) || 0;
        seriesContainer.innerHTML = ''; // Limpiar anteriores

        if (cantidad > 0) {
            const titulo = document.createElement('h3');
            titulo.innerHTML = `<i class="fas fa-barcode"></i> Números de Serie (${cantidad})`;
            seriesContainer.appendChild(titulo);

            const grid = document.createElement('div');
            grid.className = 'series-grid'; // Asegúrate de añadir este estilo a tu CSS

            for (let i = 1; i <= cantidad; i++) {
                const div = document.createElement('div');
                div.className = 'filtro-item';
                div.innerHTML = `
                    <label>Serie ${i}:</label>
                    <input type="text" name="serie[]" class="serie-input" placeholder="Ingrese serie..." required>
                `;
                grid.appendChild(div);
            }
            seriesContainer.appendChild(grid);
        }
    };

    qtyInput.addEventListener('input', actualizarCamposSerie);
    // Ejecutar al inicio por si hay un valor por defecto
    actualizarCamposSerie();

   
    // --- 3. CARGAR VENTAS (Para la tabla) ---
    const cargarVentas = async () => {
        try {
            const resp = await fetch('../backend/obtener-ventas.php');
            const data = await resp.json();
            renderizarTabla(data.ventas);
        } catch (error) {
            console.error("Error cargando ventas:", error);
        }
    };

    const renderizarTabla = (ventas) => {
        if (!ventas || ventas.length === 0) {
            cuerpoTabla.innerHTML = '<tr><td colspan="9" class="no-data">No hay ventas registradas</td></tr>';
            return;
        }

        cuerpoTabla.innerHTML = ventas.map(v => `
            <tr>
                <td>${v.fecha_registro}</td>
                <td><strong>${v.cliente}</strong></td>
                <td>${v.sucursal || '-'}</td>
                <td>${v.equipo}</td>
                <td>${v.marca}</td>
                <td>${v.modelo}</td>
                <td>${v.numero_serie}</td>
                <td>${v.garantia} meses</td>
                <td>
                    <div class="acciones-tabla">
                        <button onclick="editarVenta(${v.id})" class="btn-edit" title="Editar"><i class="fas fa-edit"></i></button>
                        <button onclick="borrarVenta(${v.id})" class="btn-delete" title="Borrar"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        document.getElementById('total-registros').textContent = ventas.length;
        document.getElementById('registros-mostrados').textContent = ventas.length;
    };

    // --- 4. REGISTRAR VENTA (Envío al servidor) ---
    btnRegistrar.addEventListener('click', async () => {
        // Validación básica
        if (!formVenta.checkValidity()) {
            formVenta.reportValidity();
            return;
        }

        const seriesInputs = document.querySelectorAll('.serie-input');
        const series = Array.from(seriesInputs).map(input => input.value.trim());

        const payload = {
            folio: "", // Puedes agregar un campo folio en el HTML si lo necesitas
            cliente: clienteSelect.value,
            sucursal: document.getElementById('sucursal').value,
            equipo: document.getElementById('equipo').value,
            marca: document.getElementById('marca').value,
            modelo: document.getElementById('modelo').value,
            garantia: document.getElementById('garantia').value,
            servicio: document.getElementById('servicio').checked,
            notas: document.getElementById('notas').value,
            numero_series: series
        };

        try {
            btnRegistrar.disabled = true;
            btnRegistrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

            const resp = await fetch('../backend/registro_ventas.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const resultado = await resp.json();

            if (resultado.exito) {
                mostrarMensaje('¡Venta registrada con éxito!', 'success');
                formVenta.reset();
                actualizarCamposSerie();
                cargarVentas();
            } else {
                mostrarMensaje('Error: ' + resultado.mensaje, 'error');
            }
        } catch (error) {
            mostrarMensaje('Error de conexión con el servidor', 'error');
        } finally {
            btnRegistrar.disabled = false;
            btnRegistrar.innerHTML = '<i class="fas fa-save"></i> Registrar Venta';
        }
    });

    const mostrarMensaje = (texto, tipo) => {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = `mensaje ${tipo}`;
        setTimeout(() => { mensajeDiv.className = 'mensaje'; }, 5000);
    };

    // Inicializar datos
   
    cargarVentas();
});

// Funciones globales para acciones (Placeholder para tu lógica de edición/borrado)
window.editarVenta = (id) => console.log("Editando:", id);
window.borrarVenta = (id) => {
    if(confirm('¿Seguro que deseas eliminar este registro?')) {
        console.log("Borrando:", id);
    }
};

/**
 * Nueva lógica para validar series duplicadas
 */

// --- Función para validar si hay duplicados en los inputs ---
const validarSeriesDuplicadas = () => {
    const inputs = document.querySelectorAll('.serie-input');
    const valores = Array.from(inputs).map(i => i.value.trim().toUpperCase());
    let hayDuplicados = false;

    inputs.forEach((input, index) => {
        const valorActual = input.value.trim().toUpperCase();
        
        // Si el campo está vacío, quitamos el error y saltamos
        if (valorActual === "") {
            input.classList.remove('input-error');
            return;
        }

        // Buscamos si el valor actual existe en otra posición del array
        const esDuplicado = valores.some((v, i) => v === valorActual && i !== index);

        if (esDuplicado) {
            input.classList.add('input-error'); // Clase CSS para poner borde rojo
            hayDuplicados = true;
        } else {
            input.classList.remove('input-error');
        }
    });

    // Deshabilitar el botón de registro si hay duplicados
    const btnRegistrar = document.getElementById('btn-registrar-venta');
    if (hayDuplicados) {
        btnRegistrar.disabled = true;
        btnRegistrar.title = "No se permiten números de serie duplicados";
    } else {
        btnRegistrar.disabled = false;
        btnRegistrar.title = "";
    }

    return hayDuplicados;
};

/**
 * Actualiza los inputs de serie sin borrar los datos existentes
 */
const actualizarCamposSerie = () => {
    const cantidadDeseada = parseInt(qtyInput.value) || 0;
    
    // 1. Obtener los contenedores actuales (cada uno tiene su label e input)
    let itemsActuales = seriesContainer.querySelectorAll('.serie-item');
    const cantidadActual = itemsActuales.length;

    // Si no hay nada y hay cantidad, creamos el título y el grid una sola vez
    if (cantidadActual === 0 && cantidadDeseada > 0) {
        seriesContainer.innerHTML = `
            <h3><i class="fas fa-barcode"></i> Números de Serie</h3>
            <div id="grid-series" class="series-grid"></div>
        `;
    }

    const grid = document.getElementById('grid-series');
    if (!grid && cantidadDeseada > 0) return; // Seguridad

    if (cantidadDeseada > cantidadActual) {
        // --- AGREGAR CAMPOS ---
        for (let i = cantidadActual + 1; i <= cantidadDeseada; i++) {
            const div = document.createElement('div');
            div.className = 'serie-item filtro-item'; // Clase para identificarlo
            div.innerHTML = `
                <label>Equipo ${i}:</label>
                <input type="text" name="serie[]" class="serie-input" 
                       placeholder="Serie..." required>
            `;
            
            // Asignar validación de duplicados al nuevo input
            const nuevoInput = div.querySelector('input');
            nuevoInput.addEventListener('input', validarSeriesDuplicadas);
            
            grid.appendChild(div);
        }
    } else if (cantidadDeseada < cantidadActual) {
        // --- QUITAR CAMPOS SOBRANTES ---
        // Quitamos desde el último hacia atrás para no perder los primeros
        for (let i = cantidadActual; i > cantidadDeseada; i--) {
            grid.lastElementChild.remove();
        }
    }

    // Si la cantidad llega a 0, limpiamos todo el contenedor
    if (cantidadDeseada === 0) {
        seriesContainer.innerHTML = '';
    }

    // Ejecutar validación por si al quitar campos se eliminó un duplicado
    validarSeriesDuplicadas();
};

// Asegúrate de actualizar el listener inicial
qtyInput.addEventListener('change', actualizarCamposSerie); 
// Nota: Usar 'change' en lugar de 'input' para que solo dispare al terminar de escribir la cantidad