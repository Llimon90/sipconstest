/**
 * scripts/ventas.js
 * Sistema de Control de Incidencias - Módulo de Ventas (SIPCONS)
 * Versión Optimizada: Validación Proactiva y Gestión de DOM Limpia
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CAPTURA DE ELEMENTOS DEL DOM ---
    const formVenta = document.getElementById('form-venta');
    const qtyInput = document.getElementById('qty');
    const seriesContainer = document.getElementById('series-container');
    const btnRegistrar = document.getElementById('btn-registrar-venta');
    const cuerpoTabla = document.getElementById('cuerpo-tabla-ventas');
    const clienteSelect = document.getElementById('cliente');

    let valorPrevioQty = 0;

    // --- 2. VALIDACIÓN DE SERIES (DUPLICADOS Y ESTADO DE BOTÓN) ---
    const validarSeries = () => {
        const inputs = document.querySelectorAll('.serie-input');
        const valores = Array.from(inputs).map(i => i.value.trim().toUpperCase());
        let duplicadosEncontrados = new Set();
        let hayVacios = false;

        // Análisis de valores
        valores.forEach((valor, index) => {
            if (valor !== "" && valores.indexOf(valor) !== index) {
                duplicadosEncontrados.add(valor);
            }
            if (valor === "") hayVacios = true;
        });

        // Gestión del mensaje de error
        let errorMsgArea = document.getElementById('error-series-msg');
        if (duplicadosEncontrados.size > 0) {
            if (!errorMsgArea) {
                errorMsgArea = document.createElement('div');
                errorMsgArea.id = 'error-series-msg';
                errorMsgArea.className = 'mensaje-error-input';
                seriesContainer.prepend(errorMsgArea);
            }
            errorMsgArea.innerHTML = `<i class="fas fa-exclamation-circle"></i> <strong>Series duplicadas:</strong> ${Array.from(duplicadosEncontrados).join(', ')}`;
            errorMsgArea.style.display = "block";
        } else if (errorMsgArea) {
            errorMsgArea.style.display = "none";
        }

        // Feedback visual en inputs y bloqueo de botón
        inputs.forEach(input => {
            const val = input.value.trim().toUpperCase();
            input.classList.toggle('input-error', val !== "" && duplicadosEncontrados.has(val));
        });

        const tieneErrores = duplicadosEncontrados.size > 0;
        btnRegistrar.disabled = tieneErrores;
        btnRegistrar.style.opacity = tieneErrores ? "0.5" : "1";

        return { hayErrores: tieneErrores, hayVacios };
    };

    // --- 3. GENERACIÓN DINÁMICA DE CAMPOS ---
    const actualizarCamposSerie = () => {
        let cantidadDeseada = parseInt(qtyInput.value) || 0;
        
        // Evitar números negativos
        if (cantidadDeseada < 0) {
            qtyInput.value = 0;
            cantidadDeseada = 0;
        }

        const inputsActuales = seriesContainer.querySelectorAll('.serie-input');
        const cantidadActual = inputsActuales.length;

        // Guardia de Integridad
        if (cantidadDeseada < cantidadActual) {
            let datosEnRiesgo = 0;
            for (let i = cantidadDeseada; i < cantidadActual; i++) {
                if (inputsActuales[i].value.trim() !== "") datosEnRiesgo++;
            }

            if (datosEnRiesgo > 0) {
                if (!confirm(`¡Atención Limon! Vas a borrar ${datosEnRiesgo} serie(s) ya escritas. ¿Proceder?`)) {
                    qtyInput.value = valorPrevioQty;
                    return;
                }
            }
        }

        // Renderizado del contenedor principal si no existe
        let grid = document.getElementById('grid-series');
        if (cantidadDeseada > 0 && !grid) {
            seriesContainer.innerHTML = `
                <h3 style="margin-top:20px;"><i class="fas fa-barcode"></i> Números de Serie</h3>
                <div id="grid-series" class="series-grid"></div>
            `;
            grid = document.getElementById('grid-series');
        }

        // Agregar o eliminar campos específicos
        if (cantidadDeseada > cantidadActual) {
            for (let i = cantidadActual + 1; i <= cantidadDeseada; i++) {
                const div = document.createElement('div');
                div.className = 'serie-item filtro-item';
                div.innerHTML = `
                    <label>Equipo ${i}:</label>
                    <input type="text" name="serie[]" class="serie-input" placeholder="Serie..." required>
                `;
                div.querySelector('input').addEventListener('input', validarSeries);
                grid.appendChild(div);
            }
        } else {
            for (let i = cantidadActual; i > cantidadDeseada; i--) {
                grid.lastElementChild.remove();
            }
        }

        if (cantidadDeseada === 0) seriesContainer.innerHTML = '';

        valorPrevioQty = qtyInput.value;
        validarSeries();
    };

    // --- 4. PERSISTENCIA Y CARGA ---
    const cargarClientes = async () => {
        try {
            const resp = await fetch('../backend/obtener-clientes.php');
            const data = await resp.json();
            if (data.exito) {
                clienteSelect.innerHTML = '<option value="">Seleccione un cliente...</option>';
                data.clientes.forEach(c => {
                    const opt = new Option(c.nombre, c.nombre);
                    clienteSelect.add(opt);
                });
            }
        } catch (e) { console.error("Error al cargar clientes:", e); }
    };

    const cargarVentas = async () => {
        try {
            const resp = await fetch('../backend/obtener-ventas.php');
            const data = await resp.json();
            renderizarTabla(data.ventas);
        } catch (e) { console.error("Error al cargar ventas:", e); }
    };

    const renderizarTabla = (ventas) => {
        if (!ventas?.length) {
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
                        <button onclick="editarVenta(${v.id})" class="btn-edit" title="Editar"><i class="fas fa-edit"></i></button>
                        <button onclick="borrarVenta(${v.id})" class="btn-delete" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    };

    // --- 5. ACCIÓN DE REGISTRO ---
    btnRegistrar.addEventListener('click', async () => {
        const { hayErrores, hayVacios } = validarSeries();
        const cant = parseInt(qtyInput.value) || 0;

        if (cant === 0) {
            alert("⚠️ Debes indicar al menos una unidad para la venta.");
            return;
        }

        if (hayVacios) {
            alert("⚠️ Por favor, completa todos los números de serie.");
            return;
        }

        if (!formVenta.checkValidity() || hayErrores) {
            formVenta.reportValidity();
            return;
        }

        const payload = {
            folio: `VT-${Date.now().toString().slice(-6)}`,
            cliente: clienteSelect.value,
            sucursal: document.getElementById('sucursal').value,
            equipo: document.getElementById('equipo').value,
            marca: document.getElementById('marca').value,
            modelo: document.getElementById('modelo').value,
            garantia: document.getElementById('garantia').value,
            servicio: document.getElementById('servicio').checked,
            notas: document.getElementById('notas').value,
            numero_series: Array.from(document.querySelectorAll('.serie-input')).map(i => i.value.trim().toUpperCase())
        };

        try {
            btnRegistrar.disabled = true;
            btnRegistrar.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Guardando...';

            const resp = await fetch('../backend/registro_ventas.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const res = await resp.json();
            if (res.exito) {
                alert('✅ ¡Venta registrada con éxito!');
                location.reload();
            } else {
                alert('❌ Error: ' + res.mensaje);
            }
        } catch (e) {
            alert('❌ Error crítico de conexión');
        } finally {
            btnRegistrar.disabled = false;
            btnRegistrar.innerHTML = '<i class="fas fa-save"></i> Registrar Venta';
        }
    });

    // --- INICIALIZACIÓN ---
    qtyInput.addEventListener('input', actualizarCamposSerie); 
    cargarClientes();
    cargarVentas();
});

// Funciones Globales para la Tabla
window.editarVenta = (id) => console.log("Editando registro:", id);
window.borrarVenta = (id) => {
    if(confirm('¿Seguro que deseas eliminar esta venta de la base de datos?')) {
        console.log("Eliminando registro:", id);
        // Implementar fetch de borrado aquí
    }
};