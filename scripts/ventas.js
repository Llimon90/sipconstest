/**
 * scripts/ventas.js - Lumina-ERP / SIPCONS
 * Versión: 3.0 (Soporte para Carga de Archivos y Estructura 1:N)
 * Desarrollado para: Limon
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CAPTURA DE ELEMENTOS DEL DOM ---
    const formVenta = document.getElementById('form-venta');
    const qtyInput = document.getElementById('qty');
    const seriesContainer = document.getElementById('series-container');
    const btnRegistrar = document.getElementById('btn-registrar-venta');
    const clienteSelect = document.getElementById('cliente');
    const facturaInput = document.getElementById('factura'); // Asegúrate de tener este ID en tu HTML

    // Variable para la Guardia de Integridad
    let valorPrevioQty = 0;

    /**
     * --- 2. VALIDACIÓN DE SERIES (DUPLICADOS Y VACÍOS) ---
     * Bloquea el botón de registro si detecta duplicados en los números de serie.
     */
    const validarSeries = () => {
        const inputs = document.querySelectorAll('.serie-input');
        const valores = Array.from(inputs).map(i => i.value.trim().toUpperCase());
        let duplicados = new Set();
        let hayVacios = false;

        // Detección de errores
        valores.forEach((val, idx) => {
            if (val !== "" && valores.indexOf(val) !== idx) duplicados.add(val);
            if (val === "") hayVacios = true;
        });

        // Gestión del mensaje visual de error
        let errorArea = document.getElementById('error-series-msg');
        if (duplicados.size > 0) {
            if (!errorArea) {
                errorArea = document.createElement('div');
                errorArea.id = 'error-series-msg';
                errorArea.className = 'mensaje-error-input'; // Estilo CSS para alertas
                seriesContainer.prepend(errorArea);
            }
            errorArea.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <strong>Series Duplicadas:</strong> ${Array.from(duplicados).join(', ')}`;
            errorArea.style.display = 'block';
        } else if (errorArea) {
            errorArea.style.display = 'none';
        }

        // Marcar inputs individuales con error
        inputs.forEach(input => {
            const esDuplicado = input.value.trim() !== "" && duplicados.has(input.value.trim().toUpperCase());
            input.classList.toggle('input-error', esDuplicado);
        });

        // Estado del botón de registro
        const tieneErrores = duplicados.size > 0;
        btnRegistrar.disabled = tieneErrores;
        btnRegistrar.style.opacity = tieneErrores ? "0.5" : "1";

        return { hayErrores: tieneErrores, hayVacios };
    };

    /**
     * --- 3. GENERACIÓN DINÁMICA DE CAMPOS (CON GUARDIA DE INTEGRIDAD) ---
     * Evita que se borren series ya capturadas si el usuario baja la cantidad por error.
     */
    const actualizarCamposSerie = () => {
        let cantidadDeseada = parseInt(qtyInput.value) || 0;
        if (cantidadDeseada < 0) { qtyInput.value = 0; cantidadDeseada = 0; }

        const inputsActuales = seriesContainer.querySelectorAll('.serie-input');
        const cantidadActual = inputsActuales.length;

        // --- GUARDIA DE INTEGRIDAD ---
        if (cantidadDeseada < cantidadActual) {
            let datosEnRiesgo = 0;
            for (let i = cantidadDeseada; i < cantidadActual; i++) {
                if (inputsActuales[i].value.trim() !== "") datosEnRiesgo++;
            }

            if (datosEnRiesgo > 0) {
                const confirmar = confirm(`¡Atención Limon! Estás reduciendo la cantidad y hay ${datosEnRiesgo} serie(s) ya escritas que se perderán. ¿Deseas continuar?`);
                if (!confirmar) {
                    qtyInput.value = valorPrevioQty;
                    return;
                }
            }
        }

        // --- RENDERIZADO DE CAMPOS ---
        let grid = document.getElementById('grid-series');
        if (cantidadDeseada > 0 && !grid) {
            seriesContainer.innerHTML = `
                <h3 style="margin-top:20px;"><i class="fas fa-barcode"></i> Números de Serie</h3>
                <div id="grid-series" class="series-grid"></div>
            `;
            grid = document.getElementById('grid-series');
        }

        if (cantidadDeseada > cantidadActual) {
            // Agregar nuevos campos sin borrar los existentes
            for (let i = cantidadActual + 1; i <= cantidadDeseada; i++) {
                const div = document.createElement('div');
                div.className = 'serie-item filtro-item';
                div.innerHTML = `
                    <label>Equipo ${i}:</label>
                    <input type="text" class="serie-input" placeholder="Serie..." required>
                `;
                div.querySelector('input').addEventListener('input', validarSeries);
                grid.appendChild(div);
            }
        } else {
            // Quitar sobrantes
            for (let i = cantidadActual; i > cantidadDeseada; i--) {
                grid.lastElementChild.remove();
            }
        }

        if (cantidadDeseada === 0) seriesContainer.innerHTML = '';
        
        valorPrevioQty = qtyInput.value;
        validarSeries();
    };

    /**
     * --- 4. PROCESO DE REGISTRO (FORMDATA + FETCH) ---
     * Envía los datos y el archivo de la factura al backend.
     */
    btnRegistrar.addEventListener('click', async () => {
        const { hayErrores, hayVacios } = validarSeries();
        const cantidad = parseInt(qtyInput.value) || 0;

        // Validaciones previas al envío
        if (cantidad <= 0) {
            alert("⚠️ Debes indicar al menos una unidad para la venta.");
            return;
        }

        if (hayVacios) {
            alert("⚠️ Por favor, completa todos los números de serie antes de continuar.");
            return;
        }

        if (!formVenta.checkValidity() || hayErrores) {
            formVenta.reportValidity();
            return;
        }

        // --- CONSTRUCCIÓN DEL FORMDATA ---
        const formData = new FormData();
        
        // Campos de texto simples
        formData.append('cliente', clienteSelect.value);
        formData.append('sucursal', document.getElementById('sucursal').value);
        formData.append('equipo', document.getElementById('equipo').value);
        formData.append('marca', document.getElementById('marca').value);
        formData.append('modelo', document.getElementById('modelo').value);
        formData.append('garantia', document.getElementById('garantia').value);
        formData.append('servicio', document.getElementById('servicio').checked ? 1 : 0);
        formData.append('notas', document.getElementById('notas').value);

        // Captura del archivo de factura
        if (facturaInput.files[0]) {
            formData.append('factura', facturaInput.files[0]);
        }

        // Captura de series (se envían como JSON string para que el PHP lo procese fácil)
        const series = Array.from(document.querySelectorAll('.serie-input'))
                            .map(input => input.value.trim().toUpperCase());
        formData.append('series', JSON.stringify(series));

        try {
            // Estado de carga UI
            btnRegistrar.disabled = true;
            btnRegistrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';

            const respuesta = await fetch('../backend/registro_ventas.php', {
                method: 'POST',
                body: formData // Nota: No enviar headers de Content-Type, el navegador lo hace solo al ser FormData
            });

            const resultado = await respuesta.json();

            if (resultado.exito) {
                alert(`✅ Venta registrada con éxito.\nFolio generado: ${resultado.folio}`);
                location.reload(); 
            } else {
                alert('❌ Error del Servidor: ' + resultado.mensaje);
            }

        } catch (error) {
            console.error("Error en Fetch:", error);
            alert('❌ Error crítico: No se pudo conectar con el servidor.');
        } finally {
            btnRegistrar.disabled = false;
            btnRegistrar.innerHTML = '<i class="fas fa-save"></i> Registrar Venta';
        }
    });

    // --- 5. INICIALIZACIÓN DE EVENTOS ---
    qtyInput.addEventListener('input', actualizarCamposSerie);
    
    // Si el usuario presiona Enter en la cantidad, forzar la generación de campos
    qtyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            actualizarCamposSerie();
        }
    });
});