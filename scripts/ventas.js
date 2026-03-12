/**
 * scripts/ventas.js - Lumina-ERP
 * Módulo de Ventas con Validación Dinámica y Guardia de Integridad
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ELEMENTOS DEL DOM ---
    const formVenta = document.getElementById('form-venta');
    const qtyInput = document.getElementById('qty');
    const seriesContainer = document.getElementById('series-container');
    const btnRegistrar = document.getElementById('btn-registrar-venta');
    const clienteSelect = document.getElementById('cliente');
    const cuerpoTabla = document.getElementById('cuerpo-tabla-ventas');

    let valorPrevioQty = 0;

    // --- 2. VALIDACIÓN DE SERIES ---
    const validarSeries = () => {
        const inputs = document.querySelectorAll('.serie-input');
        const valores = Array.from(inputs).map(i => i.value.trim().toUpperCase());
        let duplicados = new Set();
        let hayVacios = false;

        valores.forEach((val, idx) => {
            if (val !== "" && valores.indexOf(val) !== idx) duplicados.add(val);
            if (val === "") hayVacios = true;
        });

        // UI Feedback
        let errorMsg = document.getElementById('error-series-msg');
        if (duplicados.size > 0) {
            if (!errorMsg) {
                errorMsg = document.createElement('div');
                errorMsg.id = 'error-series-msg';
                errorMsg.className = 'mensaje-error-input';
                seriesContainer.prepend(errorMsg);
            }
            errorMsg.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <strong>Duplicados:</strong> ${Array.from(duplicados).join(', ')}`;
            errorMsg.style.display = 'block';
        } else if (errorMsg) {
            errorMsg.style.display = 'none';
        }

        inputs.forEach(input => {
            const isDup = input.value.trim() !== "" && duplicados.has(input.value.trim().toUpperCase());
            input.classList.toggle('input-error', isDup);
        });

        const errorEstado = duplicados.size > 0;
        btnRegistrar.disabled = errorEstado;
        btnRegistrar.style.opacity = errorEstado ? "0.5" : "1";

        return { hayErrores: errorEstado, hayVacios };
    };

    // --- 3. GESTIÓN DINÁMICA DE CAMPOS ---
    const actualizarCamposSerie = () => {
        let cant = parseInt(qtyInput.value) || 0;
        if (cant < 0) { qtyInput.value = 0; cant = 0; }

        const actuales = seriesContainer.querySelectorAll('.serie-input');
        
        // Guardia de Integridad
        if (cant < actuales.length) {
            let datosEnRiesgo = 0;
            for (let i = cant; i < actuales.length; i++) {
                if (actuales[i].value.trim() !== "") datosEnRiesgo++;
            }
            if (datosEnRiesgo > 0 && !confirm(`¿Borrar ${datosEnRiesgo} serie(s) ya capturada(s)?`)) {
                qtyInput.value = valorPrevioQty;
                return;
            }
        }

        // Renderizado
        let grid = document.getElementById('grid-series');
        if (cant > 0 && !grid) {
            seriesContainer.innerHTML = `<h3 class="mt-4"><i class="fas fa-barcode"></i> Series</h3><div id="grid-series" class="series-grid"></div>`;
            grid = document.getElementById('grid-series');
        }

        if (cant > actuales.length) {
            for (let i = actuales.length + 1; i <= cant; i++) {
                const div = document.createElement('div');
                div.className = 'serie-item';
                div.innerHTML = `<label>Equipo ${i}:</label><input type="text" class="serie-input" required placeholder="S/N">`;
                div.querySelector('input').addEventListener('input', validarSeries);
                grid.appendChild(div);
            }
        } else {
            for (let i = actuales.length; i > cant; i--) grid.lastElementChild.remove();
        }

        if (cant === 0) seriesContainer.innerHTML = '';
        valorPrevioQty = qtyInput.value;
        validarSeries();
    };

    // --- 4. ACCIÓN DE REGISTRO ---
    btnRegistrar.addEventListener('click', async () => {
        const { hayErrores, hayVacios } = validarSeries();
        if (parseInt(qtyInput.value) <= 0 || hayVacios) {
            alert("⚠️ Revisa la cantidad y completa todas las series.");
            return;
        }

        if (!formVenta.checkValidity() || hayErrores) {
            formVenta.reportValidity();
            return;
        }

        const payload = {
            cliente: clienteSelect.value,
            sucursal: document.getElementById('sucursal').value,
            equipo: document.getElementById('equipo').value,
            marca: document.getElementById('marca').value,
            modelo: document.getElementById('modelo').value,
            garantia: document.getElementById('garantia').value,
            servicio: document.getElementById('servicio').checked,
            notas: document.getElementById('notas').value,
            series: Array.from(document.querySelectorAll('.serie-input')).map(i => i.value.trim().toUpperCase())
        };

        try {
            btnRegistrar.disabled = true;
            btnRegistrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

            const resp = await fetch('../backend/registro_ventas.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const res = await resp.json();
            if (res.exito) {
                alert(`✅ Registrada con Folio: ${res.folio}`);
                location.reload();
            } else {
                alert('❌ Error: ' + res.mensaje);
            }
        } catch (e) {
            alert('❌ Error de comunicación con el servidor.');
        } finally {
            btnRegistrar.disabled = false;
            btnRegistrar.innerHTML = '<i class="fas fa-save"></i> Registrar Venta';
        }
    });

    qtyInput.addEventListener('input', actualizarCamposSerie);
});