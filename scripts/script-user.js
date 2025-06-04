document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('alta-usuarios-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const usuario = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const rol = document.getElementById('rol').value;

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    const datos = new FormData();
    datos.append('nombre', nombre);
    datos.append('correo', correo);
    datos.append('telefono', telefono);
    datos.append('usuario', usuario);
    datos.append('password', password);
    datos.append('rol', rol);

    try {
      const respuesta = await fetch('../backend/alta-user.php', {
        method: 'POST',
        body: datos
      });

    const resultado = await respuesta.json();

      if (resultado.success) {
        alert('Usuario registrado exitosamente');
        form.reset();
      } else {
        alert('Error: ' + resultado.message);
      }
    } catch (error) {
      console.error('Error al enviar los datos:', error);
      alert('Ocurrió un error al registrar el usuario.');
    }
  });
});
