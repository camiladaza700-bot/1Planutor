const Clase = require('../models/claseModel');
const Usuario = require('../models/usuarioModel');

const claseController = {
      async mostrarAgregarClase(req, res) {
    try {
      const estudianteId = Number(req.params.estudianteId);

      const estudiante = await Usuario.buscarPorId(estudianteId);

      if (!estudiante || estudiante.rol !== 'estudiante') {
        return res.status(403).send('Acceso no permitido.');
      }

      res.render('agregar-clase', {
        estudiante
      });
    } catch (error) {
      console.error('Error al mostrar agregar clase:', error);
      res.status(500).send('No se pudo cargar la página.');
    }
  },
  async crearClase(req, res) {
    try {
      const { profesorId, nombre, grado } = req.body;

      if (!profesorId || !nombre || !grado) {
        return res.status(400).send('Faltan datos para crear la clase.');
      }

      const profesor = await Usuario.buscarPorId(profesorId);

      if (!profesor || profesor.rol !== 'profesor') {
        return res.status(403).send('Solo un profesor puede crear una clase.');
      }

      await Clase.crear({
        profesorId,
        nombre: nombre.trim(),
        grado: grado.trim()
      });

      res.redirect(`/clases/profesor/${profesorId}`);
    } catch (error) {
      console.error('Error al crear clase:', error);
      res.status(500).send('No se pudo crear la clase.');
    }
  },

  async mostrarClasesProfesor(req, res) {
    try {
      const profesorId = Number(req.params.profesorId);

      const profesor = await Usuario.buscarPorId(profesorId);

      if (!profesor || profesor.rol !== 'profesor') {
        return res.status(403).send('Acceso no permitido.');
      }

      const clases = await Clase.obtenerPorProfesor(profesorId);

      res.render('clases-profesor', {
        profesor,
        clases,
        mensaje: null
      });
    } catch (error) {
      console.error('Error al mostrar clases:', error);
      res.status(500).send('No se pudieron cargar las clases.');
    }
  },

  async unirseAClase(req, res) {
    try {
      const { estudianteId, codigo } = req.body;

      if (!estudianteId || !codigo) {
        return res.status(400).send('Debes ingresar el código de la clase.');
      }

      const estudiante = await Usuario.buscarPorId(estudianteId);

      if (!estudiante || estudiante.rol !== 'estudiante') {
        return res.status(403).send('Solo un estudiante puede unirse a una clase.');
      }

      const clase = await Clase.buscarPorCodigo(codigo.trim().toUpperCase());

      if (!clase) {
        return res.status(404).send('El código de la clase no existe.');
      }

      await Clase.agregarEstudiante(clase.id, estudianteId);

      res.redirect(`/panel/${estudianteId}`);
    } catch (error) {
      console.error('Error al unirse a clase:', error);
      res.status(500).send('No se pudo unir a la clase.');
    }
  },
async mostrarClaseProfesor(req, res) {
    try {
      const profesorId = Number(req.params.profesorId);
      const claseId = Number(req.params.claseId);

      const profesor = await Usuario.buscarPorId(profesorId);

      if (!profesor || profesor.rol !== 'profesor') {
        return res.status(403).send('Acceso no permitido.');
      }

      const clases = await Clase.obtenerPorProfesor(profesorId);
      const clase = clases.find(c => c.id === claseId);

      if (!clase) {
        return res.status(403).send('No tienes acceso a esta clase.');
      }

      const estudiantes = await Clase.obtenerEstudiantes(claseId);

      res.render('clase-profesor', {
        profesor,
        clase,
        estudiantes
      });
    } catch (error) {
      console.error('Error al mostrar la clase:', error);
      res.status(500).send('No se pudo cargar la clase.');
    }
  }
};

module.exports = claseController;