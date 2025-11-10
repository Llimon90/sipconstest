// script-cargas.js

// Función para cargar los nombres de los clientes en el select (Versión 1)
/*
async function cargarClientesEnSelectV1() {
    try {
        const response = await fetch('../backend/obtener-clientes.php');
        const clientes = await response.json();
    
        const selectClientes = document.getElementById('cliente');
        selectClientes.innerHTML = '<option value="">Seleccione un cliente</option>';
    
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.nombre; // Usa el nombre del cliente como valor
            option.textContent = cliente.nombre; // Muestra el nombre en el select
            selectClientes.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar clientes (V1):', error);
        alert('Error al cargar clientes en el select');
    }
}
*/

// --- Cargar clientes (Versión usada, con anti-cache) ---
async function cargarClientesEnSelect() {
    try {
        const response = await fetch(`../backend/obtener-clientes.php?t=${Date.now()}`, { cache: "no-store" });
        const clientes = await response.json();

        const selectClientes = document.getElementById('cliente');
        // Asegura que siempre tenga la opción inicial
        selectClientes.innerHTML = '<option value="" selected disabled>Seleccione un cliente</option>'; 

        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.nombre;
            option.textContent = cliente.nombre;
            selectClientes.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        alert('Error al cargar clientes en el select');
    }
}

// Se ejecuta al cargar el contenido del DOM
document.addEventListener('DOMContentLoaded', cargarClientesEnSelect);


// --- Obtener IDs de Incidencias en Alerta (NUEVA FUNCIÓN) ---
async function obtenerAlertas() {
    try {
        // Llama al script PHP que obtiene las alertas según el criterio de 7 días
        const response = await fetch(`../backend/alertas_incidentes.php?t=${Date.now()}`, { cache: "no-store" });
        const data = await response.json();

        if (data.error) {
            console.error("Error al obtener alertas:", data.error);
            return new Set(); // Retorna un Set vacío en caso de error
        }

        // Crea un Set con los IDs (string) de las incidencias en alerta para una búsqueda rápida
        // Asegúrate de que los IDs sean del mismo tipo (string) para que la comparación funcione correctamente
        const alertasIds = new Set(data.alertas.map(alerta => String(alerta.id))); 
        return alertasIds;

    } catch (error) {
        console.error("Error al cargar alertas:", error);
        return new Set();
    }
}

// --- Cargar incidencias ---
document.addEventListener("DOMContentLoaded", function () {
    async function cargarIncidencias() {
        try {
            // 1. Obtener la lista de IDs de incidencias que deben ser alertadas
            const alertasIds = await obtenerAlertas(); 
            
            // 2. Cargar todas las incidencias desde server.php
            const response = await fetch(`../backend/server.php?t=${Date.now()}`, { cache: "no-store" });
            const data = await response.json();
            const tbody = document.getElementById("tabla-body");
            tbody.innerHTML = ""; // Limpiar tabla

            if (data.error) {
                tbody.innerHTML = `<tr><td colspan="10">${data.error}</td></tr>`;
                return;
            }

            if (data.message) {
                tbody.innerHTML = `<tr><td colspan="10">${data.message}</td></tr>`;
                return;
            }

            // Mapear los datos para asegurar la estructura
            let incidenciasArray = data.map(incidencia => ({
                id: String(incidencia.id), // Convertir a String para igualar el tipo de dato de 'alertasIds'
                numero_incidente: incidencia.numero_incidente,
                numero: incidencia.numero,
                cliente: incidencia.cliente,
                sucursal: incidencia.sucursal,
                falla: incidencia.falla,
                fecha: incidencia.fecha,
                estatus: incidencia.estatus
            }));

            incidenciasArray.forEach(incidencia => {
                const fila = document.createElement("tr");

                // *** Lógica para aplicar el color de alerta ***
                // Comprobamos si el ID de la incidencia está en el Set de alertas
                if (alertasIds.has(incidencia.id)) {
                    // La clase CSS 'alerta-rojo-suave' debe estar definida en styles.css
                    fila.classList.add("alerta-rojo-suave"); 
                }

                const celdaNumeroIncidente = document.createElement("td");
                const enlace = document.createElement("a");
                enlace.href = `detalle.html?id=${incidencia.id}`;
                enlace.textContent = incidencia.numero_incidente;
                enlace.style.color = "blue";
                enlace.style.textDecoration = "underline";

                celdaNumeroIncidente.appendChild(enlace);

                // Construcción de la fila de la tabla
                fila.innerHTML = `
                    <td></td> <td>${incidencia.numero}</td>
                    <td>${incidencia.cliente}</td>
                    <td>${incidencia.sucursal}</td>
                    <td>${incidencia.falla}</td>
                    <td>${incidencia.fecha}</td>
                    <td>${incidencia.estatus}</td>
                `;

                // Reemplazamos el primer <td> vacío con la celda que contiene el enlace
                fila.children[0].replaceWith(celdaNumeroIncidente);
                tbody.appendChild(fila);
            });
        } catch (error) {
            console.error("Error al cargar incidencias:", error);
        }
    }

    cargarIncidencias();
});