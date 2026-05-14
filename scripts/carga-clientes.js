// Función para obtener y mostrar clientes
async function cargarClientes(busqueda = '') {
  try {
    console.log(`Solicitando clientes con búsqueda: "${busqueda}"...`);
    
    // 1. Apuntamos al archivo correcto (obtener-clientes.php)
    // 2. Usamos ?busqueda=
    // 3. Agregamos credentials para que pase el middleware de seguridad
    const response = await fetch(`../backend/obtener-clientes.php?busqueda=${encodeURIComponent(busqueda)}`, {
        method: 'GET',
        credentials: 'include' 
    });
    
    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
    }

    const clientes = await response.json();
    console.log("Datos recibidos del servidor:", clientes);

    const listaClientes = document.getElementById('lista-clientes');
    if (!listaClientes) return;
    
    listaClientes.innerHTML = ''; 

    if (!clientes || clientes.length === 0 || clientes.error) {
        listaClientes.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #7f8c8d;">No se encontraron clientes.</td></tr>`;
        return;
    }

    clientes.forEach(cliente => {
      const row = document.createElement('tr');
      row.style.cursor = 'pointer';
      row.style.transition = 'background-color 0.2s ease';
      
      row.addEventListener('mouseenter', () => row.style.backgroundColor = '#f1f5f9');
      row.addEventListener('mouseleave', () => row.style.backgroundColor = 'transparent');
      
      row.onclick = () => {
          window.location.href = `perfil-cliente.html?id=${cliente.id}`;
      };

      row.innerHTML = `
        <td style="font-weight:bold; color:#2980b9;">${cliente.nombre}</td>
        <td>${cliente.rfc || '-'}</td>
        <td>${cliente.direccion || '-'}</td>
        <td>${cliente.telefono || '-'}</td>
        <td>${cliente.contactos || '-'}</td>
        <td>${cliente.email || '-'}</td>
      `;

      listaClientes.appendChild(row);
    });

  } catch (error) {
    console.error('Error al cargar clientes:', error);
    const listaClientes = document.getElementById('lista-clientes');
    if (listaClientes) {
        listaClientes.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#e74c3c; font-weight:bold;">Error de conexión o sesión expirada.</td></tr>`;
    }
  }
}

// Cargar clientes automáticamente al inicializar la página
document.addEventListener('DOMContentLoaded', () => {
  console.log("El DOM cargó. Ejecutando cargarClientes()...");
  cargarClientes();

  const campoBusqueda = document.getElementById('campo-busqueda');
  if (campoBusqueda) {
      let timeout = null;
      campoBusqueda.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          const query = campoBusqueda.value.trim();
          cargarClientes(query);
        }, 300);
      });
  }
});