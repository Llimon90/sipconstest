// Cargar PDF.js solo si es necesario
function loadPDFJS() {
    return new Promise((resolve, reject) => {
        if (typeof pdfjsLib !== 'undefined') {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
        script.onload = () => {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        document.getElementById("detalle-incidencia").innerHTML = "<p>Error: ID no encontrado.</p>";
        return;
    }

    function getShortFileName(url, maxLength = 20) {
        const fileName = url.split('/').pop();
        return fileName.length > maxLength
            ? fileName.substring(0, maxLength) + '...'
            : fileName;
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notificacion ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    async function eliminarArchivo(urlArchivo, containerElement) {
        if (!confirm('¿Estás seguro de que deseas eliminar este archivo permanentemente?')) {
            return;
        }

        containerElement.classList.add('eliminando');

        try {
            const formData = new FormData();
            formData.append('id_incidencia', id);

            // Extraer la ruta relativa completa del archivo desde la URL
            const url = new URL(urlArchivo, window.location.origin);
            const rutaRelativa = url.pathname.replace(/^\/+/, ''); // Elimina las barras iniciales
            formData.append('url_archivo', rutaRelativa);

            const response = await fetch("../backend/eliminar_archivo.php", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                console.error('Error del servidor:', data);
                throw new Error(data.error || `Error al eliminar el archivo. Código: ${response.status}`);
            }

            containerElement.remove();
            showNotification('Archivo eliminado correctamente', 'success');

        } catch (error) {
            console.error("Error al eliminar archivo:", error);
            showNotification(error.message || 'Error desconocido al eliminar el archivo', 'error');
            containerElement.classList.remove('eliminando');
        }
    }

    async function cargarArchivosAdjuntos(archivos) {
        const contenedorArchivos = document.getElementById("contenedor-archivos");
        contenedorArchivos.innerHTML = "";

        if (archivos && archivos.length > 0) {
            // Cargar PDF.js solo si hay archivos PDF
            const hasPDF = archivos.some(archivo => archivo.split('.').pop().toLowerCase() === 'pdf');
            if (hasPDF) {
                try {
                    await loadPDFJS();
                } catch (error) {
                    console.error('Error al cargar PDF.js:', error);
                }
            }

            archivos.forEach(async (archivo, index) => {
                const ext = archivo.split('.').pop().toLowerCase();
                const archivoContainer = document.createElement('div');
                archivoContainer.className = 'archivo-container';
                archivoContainer.style.position = 'relative';
                archivoContainer.style.margin = '10px';
                archivoContainer.style.padding = '10px';
                archivoContainer.style.border = '1px solid #ddd';
                archivoContainer.style.borderRadius = '5px';
                archivoContainer.style.display = 'inline-block';

                const link = document.createElement('a');
                link.href = archivo;
                link.target = '_blank';
                link.style.textDecoration = 'none';
                link.style.color = '#333';
                link.style.display = 'block';

                let previewElement;

                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
                    previewElement = document.createElement('img');
                    previewElement.src = archivo;
                    previewElement.style.maxWidth = '100px';
                    previewElement.style.maxHeight = '100px';
                    previewElement.style.cursor = 'pointer';
                    previewElement.onclick = () => window.open(archivo, '_blank');
                    link.appendChild(previewElement);
                    const fileNameSpan = document.createElement('span');
                    fileNameSpan.textContent = getShortFileName(archivo);
                    fileNameSpan.style.display = 'block';
                    fileNameSpan.style.textAlign = 'center';
                    link.appendChild(fileNameSpan);
                } else if (ext === 'pdf') {
                    const canvas = document.createElement('canvas');
                    canvas.style.maxWidth = '100px';
                    canvas.style.maxHeight = '100px';
                    canvas.style.cursor = 'pointer';
                    canvas.onclick = () => window.open(archivo, '_blank');
                    link.appendChild(canvas);
                    const fileNameSpan = document.createElement('span');
                    fileNameSpan.textContent = getShortFileName(archivo);
                    fileNameSpan.style.display = 'block';
                    fileNameSpan.style.textAlign = 'center';
                    link.appendChild(fileNameSpan);

                    try {
                        if (typeof pdfjsLib !== 'undefined') {
                            const pdf = await pdfjsLib.getDocument(archivo).promise;
                            const page = await pdf.getPage(1);
                            const viewport = page.getViewport({ scale: 1 });
                            const context = canvas.getContext('2d');
                            canvas.height = viewport.height;
                            canvas.width = viewport.width;
                            await page.render({ canvasContext: context, viewport: viewport }).promise;
                        } else {
                            throw new Error('PDF.js no está cargado');
                        }
                    } catch (error) {
                        console.error('Error al renderizar miniatura de PDF:', error);
                        canvas.remove();
                        const errorSpan = document.createElement('span');
                        errorSpan.textContent = 'Error al cargar miniatura';
                        errorSpan.style.display = 'block';
                        errorSpan.style.textAlign = 'center';
                        link.appendChild(errorSpan);
                        link.onclick = () => window.open(archivo, '_blank');
                    }
                } else if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
                    previewElement = document.createElement('video');
                    previewElement.src = archivo;
                    previewElement.style.maxWidth = '100px';
                    previewElement.style.maxHeight = '100px';
                    previewElement.controls = false;
                    previewElement.muted = true;
                    previewElement.loop = true;
                    previewElement.style.cursor = 'pointer';
                    previewElement.onmouseover = () => previewElement.play();
                    previewElement.onmouseout = () => previewElement.pause();
                    previewElement.onclick = () => window.open(archivo, '_blank');
                    link.appendChild(previewElement);
                    const fileNameSpan = document.createElement('span');
                    fileNameSpan.textContent = getShortFileName(archivo);
                    fileNameSpan.style.display = 'block';
                    fileNameSpan.style.textAlign = 'center';
                    link.appendChild(fileNameSpan);
                } else {
                    link.textContent = getShortFileName(archivo);
                }

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'eliminar-archivo';
                deleteBtn.innerHTML = '×';
                deleteBtn.style.position = 'absolute';
                deleteBtn.style.top = '5px';
                deleteBtn.style.right = '5px';
                deleteBtn.style.background = 'red';
                deleteBtn.style.color = 'white';
                deleteBtn.style.border = 'none';
                deleteBtn.style.borderRadius = '50%';
                deleteBtn.style.width = '20px';
                deleteBtn.style.height = '20px';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.style.display = 'flex';
                deleteBtn.style.alignItems = 'center';
                deleteBtn.style.justifyContent = 'center';
                deleteBtn.style.padding = '0';
                deleteBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    eliminarArchivo(archivo, archivoContainer);
                };

                archivoContainer.appendChild(link);
                archivoContainer.appendChild(deleteBtn);
                contenedorArchivos.appendChild(archivoContainer);
            });
        } else {
            contenedorArchivos.innerHTML = "<p>No hay archivos adjuntos.</p>";
        }
    }

    // Resto del código de cargarDetalleIncidencia() permanece igual
    async function cargarDetalleIncidencia() {
        try {
            const response = await fetch(`../backend/detalle.php?id=${id}`);
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Error al cargar los detalles');
            }

            // Convertir técnico(s) a array (para compatibilidad con versiones anteriores)
            const tecnicosData = Array.isArray(data.tecnico) ? data.tecnico : 
                               (data.tecnico ? [data.tecnico] : []);

            document.getElementById("detalle-incidencia").innerHTML = `
                <!-- El resto del HTML permanece igual -->
            `;

            // Inicializar el sistema de técnicos
            const tecnicosContainer = document.getElementById('tecnicos-container');
            const agregarTecnicoBtn = document.getElementById('agregar-tecnico');
            const tecnicosOptions = [
                {value: "Victor Cordoba", text: "Victor Cordoba"},
                {value: "Tomás Vázquez", text: "Tomás Vázquez"},
                {value: "Francisco Aguiar", text: "Francisco Aguiar"},
                {value: "Mauricio Díaz", text: "Mauricio Díaz"},
                {value: "Humberto Vázquez", text: "Humberto Vázquez"},
                {value: "Jose López", text: "José López"},
                {value: "Hoscar Martínez", text: "Hoscar Martínez"},
                {value: "Jacob Ventura", text: "Jacob Ventura"},
                {value: "Luis Limón", text: "Luis Limón"},
                {value: "Ernesto Chávez", text: "Ernesto Chávez"}
            ];

            // Función para crear un select de técnico
            function createTechnicianSelect(selectedValue = '') {
                const selectContainer = document.createElement('div');
                selectContainer.style.display = 'flex';
                selectContainer.style.alignItems = 'center';
                selectContainer.style.marginBottom = '5px';

                const select = document.createElement('select');
                select.className = 'select-tecnico';
                select.style.flex = '1';
                select.style.marginRight = '10px';
                
                // Opción vacía
                const emptyOption = document.createElement('option');
                emptyOption.value = '';
                emptyOption.textContent = 'Seleccione técnico';
                emptyOption.disabled = true;
                emptyOption.selected = !selectedValue;
                select.appendChild(emptyOption);

                // Agregar opciones de técnicos
                tecnicosOptions.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.text;
                    option.selected = opt.value === selectedValue;
                    select.appendChild(option);
                });

                // Botón para eliminar
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.textContent = '×';
                removeBtn.style.background = '#ff6b6b';
                removeBtn.style.color = 'white';
                removeBtn.style.border = 'none';
                removeBtn.style.borderRadius = '50%';
                removeBtn.style.width = '25px';
                removeBtn.style.height = '25px';
                removeBtn.style.cursor = 'pointer';
                removeBtn.addEventListener('click', () => {
                    selectContainer.remove();
                    updateSelectsAvailability();
                });

                selectContainer.appendChild(select);
                selectContainer.appendChild(removeBtn);

                return selectContainer;
            }

            // Función para actualizar disponibilidad de técnicos
            function updateSelectsAvailability() {
                const selects = tecnicosContainer.querySelectorAll('.select-tecnico');
                const selectedValues = Array.from(selects).map(s => s.value).filter(v => v);

                selects.forEach(select => {
                    const currentValue = select.value;
                    
                    Array.from(select.options).forEach(option => {
                        if (!option.value) return;
                        
                        option.disabled = selectedValues.includes(option.value) && option.value !== currentValue;
                    });
                });

                // Habilitar/deshabilitar botón de agregar
                agregarTecnicoBtn.disabled = tecnicosContainer.querySelectorAll('.select-tecnico').length >= tecnicosOptions.length;
            }

            // Cargar técnicos existentes
            if (tecnicosData.length > 0) {
                tecnicosData.forEach(tecnico => {
                    tecnicosContainer.appendChild(createTechnicianSelect(tecnico));
                });
            } else {
                // Agregar un select vacío por defecto
                tecnicosContainer.appendChild(createTechnicianSelect());
            }

            // Evento para agregar nuevo técnico
            agregarTecnicoBtn.addEventListener('click', () => {
                if (tecnicosContainer.querySelectorAll('.select-tecnico').length >= tecnicosOptions.length) {
                    alert('No hay más técnicos disponibles para agregar');
                    return;
                }
                
                const newSelect = createTechnicianSelect();
                tecnicosContainer.appendChild(newSelect);
                updateSelectsAvailability();
            });

            // Actualizar disponibilidad inicial
            updateSelectsAvailability();

            if (data.archivos) {
                cargarArchivosAdjuntos(data.archivos);
            }

            document.getElementById("form-editar").addEventListener("submit", async function (e) {
                e.preventDefault();

                // Obtener todos los técnicos seleccionados
                const tecnicosSelects = document.querySelectorAll('.select-tecnico');
                const tecnicos = Array.from(tecnicosSelects)
                    .map(select => select.value)
                    .filter(value => value);

                const formData = new FormData();
                formData.append("id", id);
                formData.append("numero", document.getElementById("numero").value);
                formData.append("cliente", document.getElementById("cliente").value);
                formData.append("contacto", document.getElementById("contacto").value);
                formData.append("sucursal", document.getElementById("sucursal").value);
                formData.append("fecha", document.getElementById("fecha").value);
                formData.append("tecnicos", JSON.stringify(tecnicos));
                formData.append("estatus", document.getElementById("estatus").value);
                formData.append("falla", document.getElementById("falla").value);
                formData.append("accion", document.getElementById("accion").value);
                formData.append("notas", document.getElementById("notas").value);

                const archivosInput = document.getElementById("archivos").files;
                for (let i = 0; i < archivosInput.length; i++) {
                    formData.append("archivos[]", archivosInput[i]);
                }

                try {
                    const response = await fetch("../backend/actualiza.php", {
                        method: "POST",
                        body: formData
                    });

                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        throw new Error(data.error || 'Error al actualizar la incidencia');
                    }

                    showNotification('Incidencia actualizada correctamente');

                    if (data.archivos) {
                        cargarArchivosAdjuntos(data.archivos);
                        document.getElementById("archivos").value = '';
                    }

                } catch (error) {
                    console.error("Error al actualizar incidencia:", error);
                    showNotification(error.message, 'error');
                }
            });

        } catch (error) {
            console.error("Error al cargar detalles:", error);
            document.getElementById("detalle-incidencia").innerHTML =
                `<p>Error al cargar los detalles: ${error.message}</p>`;
        }
    }

    cargarDetalleIncidencia();
});