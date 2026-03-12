/**
 * scripts/ventas.js
 * Sistema de Control de Incidencias - Módulo de Ventas (SIPCONS)
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CAPTURA DE ELEMENTOS DEL DOM ---
    const formVenta = document.getElementById('form-venta');
    const qtyInput = document.getElementById('qty');
    const seriesContainer = document.getElementById('series-container');
    const btnRegistrar = document.getElementById('btn-registrar-venta');
    const cuerpoTabla = document.getElementById('cuerpo-tabla-ventas');
    const clienteSelect = document.getElementById('cliente');
    const mensajeDiv = document.getElementById('mensaje');

    // --- 2. VALIDACIÓN DE SERIES DUPLICADAS ---
    const validarSeriesDuplicadas = () => {
        const inputs = document.querySelectorAll('.serie-input');
        const valores = Array.from(inputs).map(i => i.value.trim().toUpperCase());
        let hayDuplicados = false;

        inputs.forEach((input, index) => {
            const valorActual = input.value.trim().toUpperCase();
            
            if (valorActual === "") {
                input.classList.remove('input-error');
                return;
            }

            // Verificar si el valor se repite en el array de valores capturados
            const esDuplicado = valores.some((v, i) => v === valorActual && i !== index);

            if (esDuplicado) {
                input.classList.add('input-error');
                hayDuplicados = true;
            } else {
                input.classList.remove('input-error');
            }
        });

        // Bloquear/Desbloquear botón de registro
        if (hayDuplicados) {
            btnRegistrar.disabled = true;
            btnRegistrar.style.opacity = "0.5";
            btnRegistrar.title = "Hay números de serie duplicados";
        } else {
            btnRegistrar.disabled = false;
            btnRegistrar.style.opacity = "1";
            btnRegistrar.title = "";
        }
    };

    // --- 3. GENERACIÓN DINÁMICA CON PRESERVACIÓN DE DATOS ---
    const actualizarCamposSerie = () => {
        const cantidadDeseada = parseInt(qtyInput.value) || 0;
        
        // Buscamos el grid existente o lo creamos
        let grid = document.getElementById('grid-series');
        
        if (cantidadDeseada > 0 && !grid) {
            seriesContainer.innerHTML = `
                <h3 style="margin-top:20px;"><i class="fas fa-barcode"></i> Números de Serie</h3>
                <div id="grid-series" class="series-grid"></div>
            `;
            grid = document.getElementById('grid-series');
        }

        const itemsActuales = grid ? grid.querySelectorAll('.serie-item') : [];
        const cantidadActual = itemsActuales.length;

        if (cantidadDeseada > cantidadActual) {
            // AGREGAR CAMPOS NUEVOS
            for (let i = cantidadActual + 1; i <= cantidadDeseada; i++) {
                const div = document.createElement('div');
                div.className = 'serie-item filtro-item';
                div.innerHTML = `
                    <label>Equipo ${i}:</label>
                    <input type="text" name="serie[]" class="serie-input" placeholder="Serie..." required>
                `;
                
                const nuevoInput = div.querySelector('input');
                nuevoInput.addEventListener('input', validarSeriesDuplicadas);
                grid.appendChild(div);
            }
        } else if (cantidadDeseada < cantidadActual) {
            // QUITAR CAMPOS SOBRANTES (sin borrar los primeros)
            for (let i = cantidadActual; i > cantidadDeseada; i--) {
                grid.lastElementChild.remove();
            }
        }

        if (cantidadDeseada === 0) {
            seriesContainer.innerHTML = '';
        }

        validarSeriesDuplicadas();
    };

    // --- 4. CARGA DE DATOS (CLIENTES Y VENTAS) ---
    const cargarClientes = async () => {
        try {
            // Ajustar ruta según tu estructura (php/ o backend/)
            const resp = await fetch('../php/obtener-clientes.php');
            const data = await resp.json();
            if (data.exito) {
                data.clientes.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.nombre; 
                    opt.textContent = c.nombre;
                    clienteSelect.appendChild(opt);
                });
            }
        } catch (e) { console.error("Error clientes:", e); }
    };

    const cargarVentas = async () => {
        try {
            const resp = await fetch('../php/obtener-ventas.php');
            const data = await resp.json();
            renderizarTabla(data.ventas);
        } catch (e) { console.error("Error ventas:", e); }
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
                <td>${v.garantia} m</td>
                <td>
                    <div class="acciones-tabla">
                        <button onclick="editarVenta(${v.id})" class="btn-edit"><i class="fas fa-edit"></i></button>
                        <button onclick="borrarVenta(${v.id})" class="btn-delete"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    };

    // --- 5. REGISTRO DE VENTA ---
    btnRegistrar.addEventListener('click', async () => {
        if (!formVenta.checkValidity()) {
            formVenta.reportValidity();
            return;
        }

        const series = Array.from(document.querySelectorAll('.serie-input')).map(i => i.value.trim());

        const payload = {
            folio: document.getElementById('sucursal').value.substring(0,3).toUpperCase() + Date.now().toString().slice(-4),
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
            btnRegistrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

            const resp = await fetch('../php/registro_ventas.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const res = await resp.json();
            if (res.exito) {
                mostrarMensaje('Venta registrada correctamente', 'success');
                formVenta.reset();
                actualizarCamposSerie();
                cargarVentas();
            } else {
                mostrarMensaje('Error: ' + res.mensaje, 'error');
            }
        } catch (e) {
            mostrarMensaje('Error de conexión', 'error');
        } finally {
            btnRegistrar.disabled = false;
            btnRegistrar.innerHTML = '<i class="fas fa-save"></i> Registrar Venta';
        }
    });

    const mostrarMensaje = (texto, tipo) => {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = `mensaje ${tipo}`;
        setTimeout(() => { mensajeDiv.className = 'mensaje'; }, 4000);
    };

    // --- LISTENERS INICIALES ---
    qtyInput.addEventListener('input', actualizarCamposSerie);
    
    // Carga inicial
    cargarClientes();
    cargarVentas();
});

// Funciones globales para botones de tabla
window.editarVenta = (id) => console.log("Editar ID:", id);
window.borrarVenta = (id) => {
    if(confirm('¿Eliminar este registro?')) console.log("Borrar ID:", id);
};