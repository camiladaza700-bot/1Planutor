const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/', authController.mostrarLogin);
router.post('/login', authController.iniciarSesion);
router.get('/panel/:userId', authController.mostrarPanel);

router.get('/inicio', authController.mostrarInicio);

router.get('/registro-profesor', authController.mostrarRegistroProfesor);
router.post('/registro-profesor', authController.registrarProfesor);

router.get('/registro-estudiante', authController.mostrarRegistroEstudiante);
router.post('/registro-estudiante', authController.registrarEstudiante);

module.exports = router;