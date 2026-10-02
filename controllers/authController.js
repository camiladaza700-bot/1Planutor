const Usuario = require('../models/usuarioModel');
const Tarea = require('../models/tareaModel');

function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}
function normalizarNombre(nombre) {
  return normalizarTexto(nombre)
    .split(/\s+/)
    .filter(Boolean)
    .map(
      palabra =>
        palabra.charAt(0).toUpperCase() +
        palabra.slice(1).toLowerCase()
    )
    .join(' ');
}

function normalizarCorreo(correo) {
  return normalizarTexto(correo).toLowerCase();
}

function valoresEstudiante(body = {}) {
  return {
    nombre: normalizarTexto(body.nombre),
    correo: normalizarCorreo(body.correo),
    nivel: normalizarTexto(body.nivel),
    grado: normalizarTexto(body.grado),
    grupo: normalizarTexto(body.grupo),
    institucion: normalizarTexto(body.institucion)
  };
}
const MATERIAS_PROFESOR = [
  'Lengua Castellana',
  'Matemáticas',
  'Ciencias Naturales',
  'Biología',
  'Física',
  'Química',
  'Ciencias Sociales',
  'Historia',
  'Geografía',
  'Filosofía',
  'Inglés',
  'Francés',
  'Educación Física',
  'Educación Artística',
  'Música',
  'Tecnología e Informática',
  'Ética y Valores',
  'Religión',
  'Economía',
  'Ciencias Políticas',
  'Emprendimiento',
  'Estadística',
  'Lectura Crítica',
  'Preescolar',
  'Primaria'
];

function valoresProfesor(body = {}) {
  return {
    nombre: normalizarTexto(body.nombre),
    correo: normalizarCorreo(body.correo),
    area: normalizarTexto(body.area),
    institucion: normalizarTexto(body.institucion)
  };
}

function renderLogin(res, datos = {}) {
  res.render('login', {
    error: datos.error || '',
    mensaje: datos.mensaje || ''
  });
}

function renderCodigoProfesor(res, datos = {}) {
  res.render('codigo-profesor', {
    error: datos.error || '',
    mensaje: datos.mensaje || ''
  });
}

function renderRegistroEstudiante(res, datos = {}) {
  res.render('registro-estudiante', {
    error: datos.error || '',
    mensaje: datos.mensaje || '',
    valores: datos.valores || {
      nombre: '',
      correo: '',
      nivel: '',
      grado: '',
      grupo: '',
      institucion: datos.institucionInicial || ''
    }
  });
}

async function renderPanelUsuario(res, usuario, datos = {}) {
  const semana = Tarea.obtenerRangoSemanaActual();

  if (usuario.rol === 'administrador') {
    const usuarios = await Usuario.obtenerTodos();

    res.render('usuarios', {
      usuarios,
      currentUser: usuario,
      mensaje: datos.mensaje || 'Desde aqui puedes revisar administradores, profesores y estudiantes registrados.',
      error: datos.error || ''
    });
    return;
  }

  if (usuario.rol === 'profesor') {
    const tareas = await Tarea.obtenerPorProfesorSemana(usuario.id, semana.inicio, semana.fin);

    res.render('profesor-dashboard', {
      currentUser: usuario,
      tareas,
      mensaje: datos.mensaje || '',
      error: datos.error || '',
      valores: datos.valores || {
        materia: '',
        titulo: '',
        descripcion: '',
        fechaEntrega: ''
      },
      semana
    });
    return;
  }

  const tareas = await Tarea.obtenerMuroSemana({
    estudianteId: usuario.id,
    grado: usuario.grado,
    grupo: usuario.grupo,
    semanaInicio: semana.inicio,
    semanaFin: semana.fin
  });

  res.render('estudiante-dashboard', {
    currentUser: usuario,
    tareas,
    mensaje: datos.mensaje || '',
    error: datos.error || '',
    semana
  });
}

async function mostrarLogin(req, res) {
  renderLogin(res, {
    mensaje: req.query.registro === 'ok' ? 'Cuenta creada. Ya puedes iniciar sesion.' : ''
  });
}

async function iniciarSesion(req, res) {
  const correo = normalizarCorreo(req.body.correo);
  const password = normalizarTexto(req.body.password);

  if (!correo || !password) {
    renderLogin(res.status(400), { error: 'Debes ingresar correo y contrasena.' });
    return;
  }

  try {
    const usuario = await Usuario.buscarPorCorreo(correo);

    if (!usuario || !Usuario.verifyPassword(password, usuario.password_hash)) {
      renderLogin(res.status(401), { error: 'Credenciales invalidas.' });
      return;
    }

    await renderPanelUsuario(res, usuario, {
      mensaje: `Sesion iniciada como ${usuario.nombre}.`
    });
  } catch (error) {
    console.error(error);
    renderLogin(res.status(500), { error: 'No fue posible iniciar sesion.' });
  }
}

async function mostrarPanel(req, res) {
  try {
    const usuario = await Usuario.buscarPorId(req.params.userId);

    if (!usuario) {
      res.status(404).render('error', {
        titulo: 'Usuario no encontrado',
        mensaje: 'No se encontro el panel solicitado.',
        volverA: '/',
        volverTexto: 'Volver al login'
      });
      return;
    }

    await renderPanelUsuario(res, usuario, {
      mensaje: req.query.mensaje === 'tarea-creada'
        ? 'Tarea publicada en el muro semanal.'
        : req.query.mensaje === 'estado-actualizado'
          ? 'Estado de tarea actualizado.'
          : ''
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      titulo: 'Error de panel',
      mensaje: 'No fue posible cargar el panel del usuario.',
      volverA: '/',
      volverTexto: 'Volver al login'
    });
  }
}

async function mostrarInicio(req, res) {
  res.render('inicio');
}

async function mostrarRegistroProfesor(req, res) {
  res.render('registro-profesor', {
    error: '',
    mensaje: '',
    valores: {
      nombre: '',
      correo: '',
      area: '',
      institucion: normalizarTexto(req.query.institucion)
    }
  });
}
async function registrarProfesor(req, res) {
  const valores = valoresProfesor(req.body);
  const password = normalizarTexto(req.body.password);
  const confirmarPassword = normalizarTexto(req.body.confirmarPassword);

  if (
    !valores.nombre ||
    !valores.correo ||
    !valores.area ||
    !valores.institucion ||
    !password ||
    !confirmarPassword
  ) {
    return res.status(400).render('registro-profesor', {
      error: 'Todos los campos son obligatorios.',
      mensaje: '',
      valores
    });
  }

  const partesNombre = valores.nombre.split(/\s+/).filter(Boolean);

  if (partesNombre.length < 2) {
    return res.status(400).render('registro-profesor', {
      error: 'Escribe tu nombre completo, incluyendo al menos un nombre y un apellido.',
      mensaje: '',
      valores
    });
  }

  valores.nombre = partesNombre
    .map(
      palabra =>
        palabra.charAt(0).toUpperCase() +
        palabra.slice(1).toLowerCase()
    )
    .join(' ');

  if (!MATERIAS_PROFESOR.includes(valores.area)) {
    return res.status(400).render('registro-profesor', {
      error: 'Selecciona una materia válida de la lista.',
      mensaje: '',
      valores
    });
  }

  if (!valores.correo.endsWith('@iedeboraarango.edu.co')) {
    return res.status(400).render('registro-profesor', {
      error: 'Debes usar tu correo institucional.',
      mensaje: '',
      valores
    });
  }

  if (password !== confirmarPassword) {
    return res.status(400).render('registro-profesor', {
      error: 'Las contraseñas no coinciden.',
      mensaje: '',
      valores
    });
  }

  try {
    const existente = await Usuario.buscarPorCorreo(valores.correo);

    if (existente) {
      return res.status(409).render('registro-profesor', {
        error: 'Ya existe una cuenta con ese correo.',
        mensaje: '',
        valores
      });
    }

    await Usuario.crear({
  nombre: valores.nombre,
  correo: valores.correo,
  institucion: valores.institucion,
  materia: valores.area,
  passwordHash: Usuario.hashPassword(password),
  rol: 'profesor'
});

    res.redirect('/?registro=ok');
  } catch (error) {
    console.error(error);

    res.status(500).render('registro-profesor', {
      error: 'No fue posible registrar al profesor.',
      mensaje: '',
      valores
    });
  }
}

async function validarCodigoProfesor(req, res) {
  renderCodigoProfesor(res.status(403), {
    error: 'El registro de profesor no esta disponible. Solicita tu cuenta al administrador.'
  });
}

async function mostrarRegistroEstudiante(req, res) {
  renderRegistroEstudiante(res, {
    institucionInicial: normalizarTexto(req.query.institucion)
  });
}

async function registrarEstudiante(req, res) {
  const valores = valoresEstudiante(req.body);
  valores.nombre = normalizarNombre(valores.nombre);
  const password = normalizarTexto(req.body.password);
  const confirmarPassword = normalizarTexto(req.body.confirmarPassword);

  if (!valores.nombre || !valores.correo || !valores.institucion || !valores.nivel || !valores.grado || !valores.grupo || !password || !confirmarPassword) {
    renderRegistroEstudiante(res.status(400), {
      error: 'Todos los campos son obligatorios.',
      valores
    });
    return;
  }

  if (password !== confirmarPassword) {
    renderRegistroEstudiante(res.status(400), {
      error: 'Las contrasenas no coinciden.',
      valores
    });
    return;
  }

  try {
    const existente = await Usuario.buscarPorCorreo(valores.correo);

    if (existente) {
      renderRegistroEstudiante(res.status(409), {
        error: 'Ya existe una cuenta con ese correo.',
        valores
      });
      return;
    }

    await Usuario.crear({
      ...valores,
      passwordHash: Usuario.hashPassword(password),
      rol: 'estudiante'
    });

    res.redirect('/?registro=ok');
  } catch (error) {
    console.error(error);
    renderRegistroEstudiante(res.status(500), {
      error: 'No fue posible registrar al estudiante.',
      valores
    });
  }
}

module.exports = {
  mostrarLogin,
  iniciarSesion,
  mostrarPanel,
  mostrarInicio,
  mostrarRegistroProfesor,
  registrarProfesor,
  validarCodigoProfesor,
  mostrarRegistroEstudiante,
  registrarEstudiante
};