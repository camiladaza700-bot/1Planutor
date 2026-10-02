const express = require('express');
const router = express.Router();

const claseController = require('../controllers/claseController');

router.get(
  '/clases/profesor/:profesorId',
  claseController.mostrarClasesProfesor
);

router.get(
  '/clases/profesor/:profesorId/:claseId',
  claseController.mostrarClaseProfesor
);

router.get(
  '/clases/estudiante/:estudianteId',
  claseController.mostrarAgregarClase
);

router.post(
  '/clases/crear',
  claseController.crearClase
);

router.post(
  '/clases/unirse',
  claseController.unirseAClase
);

module.exports = router;