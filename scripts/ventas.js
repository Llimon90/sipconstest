/**
 * scripts/ventas.js
 * Sistema de Control de Incidencias - Módulo de Ventas (SIPCONS)
 * Versión Final con Guardia de Integridad y Validación Detallada
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

    // Variable para rastrear el valor previo y evitar borrados accidentales
    let valorPrevioQty = 0;

    // --- 2. VALIDACIÓN DE SERIES (DUPLICADOS Y MENSAJES) ---
    const validarSeries = () => {
        const inputs = document.querySelectorAll('.serie-input');
        const valores = Array.from(inputs).map(i => i.value.trim().toUpperCase());
        let duplicadosEncontrados = new Set();
        let hayErrores = false;
        let hayVacios = false;

        // Identificar duplicados y vacíos
        valores.forEach((valor, index) => {
            if (valor !== "" && valores.indexOf(valor) !== index) {
                duplicadosEncontrados.add(valor);
            }
            if (valor === "") hayVacios = true;
        });

        // Gestionar el contenedor de mensaje de error en el DOM
        let errorMsgArea = document.getElementById('error-series-msg');
        if (!errorMsgArea && duplicadosEncontrados.size > 0) {
            errorMsgArea = document.createElement('div');
            errorMsgArea.id = 'error-series-msg';
            errorMsgArea.className = 'mensaje-error-input'; // Asegúrate de tener este estilo en CSS
            seriesContainer.prepend(errorMsgArea);
        }

        // Marcar inputs visualmente
        inputs.forEach(input => {
            const val = input.value.trim().toUpperCase();
            if (val !== "" && duplicadosEncontrados.has(val)) {
                input.classList.add('input-error');
                hayErrores = true;
            } else {
                input.classList.remove('input-error');
            }
        });

        // Actualizar mensaje y estado del botón
        if (hayErrores) {
            errorMsgArea.style.display = "block";
            errorMsgArea.innerHTML = `<i class="fas fa-exclamation-circle"></i> <strong>Series duplicadas detectadas:</strong> ${Array.from(duplicadosEncontrados).join(', ')}`;
            btnRegistrar.disabled = true;
            btnRegistrar.style.opacity = "0.5";
        } else {
            if (errorMsgArea) errorMsgArea.style.display = "none";
            btnRegistrar.disabled = false;
            btnRegistrar.style.opacity = "1";
        }

        return { hayErrores, hayVacios };
    };

    // --- 3. GENERACIÓN DINÁMICA CON GUARDIA DE INTEGRIDAD ---
    const actualizarCamposSerie = () => {
        const cantidadDeseada = parseInt(qtyInput.value) || 0;
        const inputsActuales = seriesContainer.querySelectorAll('.serie-input');
        const cantidadActual = inputsActuales.length;

        // --- GUARDIA DE INTEGRIDAD ---
        if (cantidadDeseada < cantidadActual) {
            let datosEnRiesgo = 0;
            // Revisar si los campos que se van a eliminar tienen texto
            for (let i = cantidadDeseada; i < cantidadActual; i++) {
                if (inputsActuales[i].value.trim() !== "") datosEnRiesgo++;
            }

            if (datosEnRiesgo > 0) {
                const confirmar = confirm(`¡Atención! Estás intentando reducir la cantidad, pero hay ${datosEnRiesgo} serie(s) ya capturada(s) que se borrarán. ¿Deseas continuar?`);
                if (!confirmar) {
                    qtyInput.value = valorPrevioQty; // Revertir
                    return;
                }
            }
        }

        // --- PROCESO DE RENDERIZADO ---
        let grid = document.getElementById('grid-series');
        if (cantidadDeseada > 0 && !grid) {
            seriesContainer.innerHTML = `
                <h3 style="margin-top:20px;"><i class="fas fa-barcode"></i> Números de Serie</h3>
                <div id="grid-series" class="series-grid"></div>
            `;
            grid = document.getElementById('grid-series');
        }

        if (cantidadDeseada > cantidadActual) {
            // AGREGAR SIN BORRAR LO ANTERIOR
            for (let i = cantidadActual + 1; i <= cantidadDeseada; i++) {
                const div = document.createElement('div');
                div.className = 'serie-item filtro-item';
                div.innerHTML = `
                    <label>Equipo ${i}:</label>
                    <input type="text" name="serie[]" class="serie-input" placeholder="Serie..." required>
                `;
                const nuevoInput = div.querySelector('input');
                nuevoInput.addEventListener('input', validarSeries);
                grid.appendChild(div);
            }
        } else if (cantidadDeseada < cantidadActual) {
            // QUITAR SOLO LOS SOBRANTES
            for (let i = cantidadActual; i > cantidadDeseada; i--) {
                grid.lastElementChild.remove();
            }
        }

        if (cantidadDeseada === 0) {
            seriesContainer.innerHTML = '';
        }

        valorPrevioQty = qtyInput.value;
        validarSeries();
    };

    // --- 4. CARGA DE DATOS ---
    const cargarClientes = async () => {
        try {
            const resp = await fetch('../backend/obtener-clientes.php');
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
            const resp = await fetch('../backend/obtener-ventas.php');
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
        const { hayErrores, hayVacios } = validarSeries();

        if (hayVacios && parseInt(qtyInput.value) > 0) {
            alert("⚠️ Por favor, completa todos los números de serie antes de continuar.");
            return;
        }

        if (!formVenta.checkValidity() || hayErrores) {
            formVenta.reportValidity();
            return;
        }

        const series = Array.from(document.querySelectorAll('.serie-input')).map(i => i.value.trim());

        const payload = {
            folio: "VT-" + Date.now().toString().slice(-6),
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

            const res = await resp.json();
            if (res.exito) {
                alert('✅ Venta registrada correctamente');
                location.reload(); 
            } else {
                alert('❌ Error: ' + res.mensaje);
            }
        } catch (e) {
            alert('❌ Error de conexión con el servidor');
        } finally {
            btnRegistrar.disabled = false;
            btnRegistrar.innerHTML = '<i class="fas fa-save"></i> Registrar Venta';
        }
    });

    // --- INICIALIZACIÓN ---
    qtyInput.value = 0; // Iniciar en cero
    valorPrevioQty = 0;

    qtyInput.addEventListener('change', actualizarCamposSerie);
    qtyInput.addEventListener('keyup', (e) => {
        if(e.key === "Enter") actualizarCamposSerie();
    });

    cargarClientes();
    cargarVentas();
});

// Funciones globales
window.editarVenta = (id) => console.log("Editar ID:", id);
window.borrarVenta = (id) => {
    if(confirm('¿Deseas eliminar este registro de venta permanentemente?')) {
        // Aquí iría tu fetch de borrado
        console.log("Borrando ID:", id);
    }
};