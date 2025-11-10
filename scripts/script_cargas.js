

// Función para cargar los nombres de los clientes en el select
async function cargarClientesEnSelect() {
    try {
      const response = await fetch('../backend/obtener-clientes.php');
      const clientes = await response.json();
  
      const selectClientes = document.getElementById('cliente');
      selectClientes.innerHTML = '<option value="">Seleccione un cliente</option>';
  
      clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.nombre; // Usa el ID del cliente como valor
        option.textContent = cliente.nombre; // Muestra el nombre en el select
        selectClientes.appendChild(option);
      });
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      alert('Error al cargar clientes en el select');
    }
  }
  
 // --- Cargar clientes ---
async function cargarClientesEnSelect() {
  try {
    const response = await fetch(`../backend/obtener-clientes.php?t=${Date.now()}`, { cache: "no-store" });
    const clientes = await response.json();

    const selectClientes = document.getElementById('cliente');
    selectClientes.innerHTML = '<option value="">Seleccione un cliente</option>';

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

document.addEventListener('DOMContentLoaded', cargarClientesEnSelect);


// --- Cargar incidencias ---
document.addEventListener("DOMContentLoaded", function () {
  async function cargarIncidencias() {
    try {
      const response = await fetch(`../backend/server.php?t=${Date.now()}`, { cache: "no-store" });
      const data = await response.json();
      const tbody = document.getElementById("tabla-body");
      tbody.innerHTML = "";

      if (data.error) {
        tbody.innerHTML = `<tr><td colspan="10">${data.error}</td></tr>`;
        return;
      }

      if (data.message) {
        tbody.innerHTML = `<tr><td colspan="10">${data.message}</td></tr>`;
        return;
      }

      let incidenciasArray = data.map(incidencia => ({
        id: incidencia.id,
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

        const celdaNumeroIncidente = document.createElement("td");
        const enlace = document.createElement("a");
        enlace.href = `detalle.html?id=${incidencia.id}`;
        enlace.textContent = incidencia.numero_incidente;
        enlace.style.color = "blue";
        enlace.style.textDecoration = "underline";

        celdaNumeroIncidente.appendChild(enlace);

        fila.innerHTML = `
          <td></td>
          <td>${incidencia.numero}</td>
          <td>${incidencia.cliente}</td>
          <td>${incidencia.sucursal}</td>
          <td>${incidencia.falla}</td>
          <td>${incidencia.fecha}</td>
          <td>${incidencia.estatus}</td>
        `;

        fila.children[0].replaceWith(celdaNumeroIncidente);
        tbody.appendChild(fila);
      });
    } catch (error) {
      console.error("Error al cargar incidencias:", error);
    }
  }

  cargarIncidencias();
});

async function revisarAlertasIncidencias() {
  try {
    const response = await fetch('../backend/alertas_incidentes.php?t=' + Date.now(), { cache: 'no-store' });
    const data = await response.json();

    if (data.alertas && data.alertas.length > 0) {
      data.alertas.forEach(inc => {
        // Verificar si el usuario ya la ignoró (por ejemplo en localStorage)
        if (!localStorage.getItem('ignorarAlerta_'+inc.id)) {
          mostrarNotificacionAlerta(inc);
        }
      });
    }
  } catch (error) {
    console.error("Error al revisar alertas de incidencias:", error);
  }
}

function mostrarNotificacionAlerta(inc) {
  const contenedorAlertas = document.getElementById('contenedor-alertas'); // asegúrate de tener un elemento en el DOM
  const div = document.createElement('div');
  div.className = 'alerta-incidencia';
  div.innerHTML = `
    <strong>Incidencia pendiente:</strong> <a href="detalle.html?id=${inc.id}">${inc.numero_incidente}</a>
    <span> del cliente ${inc.cliente}, sucursal ${inc.sucursal}, estatus: ${inc.estatus}</span>
    <button class="btn-ignorar">Ignorar</button>
  `;
  contenedorAlertas.appendChild(div);

  div.querySelector('.btn-ignorar').addEventListener('click', () => {
    localStorage.setItem('ignorarAlerta_'+inc.id, '1');
    div.remove();
  });
}

// Llama a la función al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  revisarAlertasIncidencias();
});
