const crypto = require('crypto');
const { all, get, run } = require('../config/db');

function generarCodigo() {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let parte1 = '';
  let parte2 = '';

  for (let i = 0; i < 3; i++) {
    parte1 += caracteres[crypto.randomInt(caracteres.length)];
    parte2 += caracteres[crypto.randomInt(caracteres.length)];
  }

  return `${parte1}-${parte2}`;
}

async function generarCodigoUnico() {
  let codigo;

  do {
    codigo = generarCodigo();

    const existente = await get(
      `SELECT id FROM clases WHERE codigo = ?`,
      [codigo]
    );

    if (!existente) {
      return codigo;
    }
  } while (true);
}

const Clase = {
  async crear({ profesorId, nombre, grado }) {
    const codigo = await generarCodigoUnico();

    const resultado = await run(
      `
        INSERT INTO clases (
          profesor_id,
          nombre,
          grado,
          codigo
        )
        VALUES (?, ?, ?, ?)
      `,
      [profesorId, nombre, grado, codigo]
    );

    return {
      id: resultado.id,
      profesor_id: profesorId,
      nombre,
      grado,
      codigo
    };
  },

  obtenerPorProfesor(profesorId) {
    return all(
      `
        SELECT
          id,
          profesor_id,
          nombre,
          grado,
          codigo,
          creado_en
        FROM clases
        WHERE profesor_id = ?
        ORDER BY id DESC
      `,
      [profesorId]
    );
  },

  buscarPorCodigo(codigo) {
    return get(
      `
        SELECT
          id,
          profesor_id,
          nombre,
          grado,
          codigo,
          creado_en
        FROM clases
        WHERE codigo = ?
      `,
      [codigo]
    );
  },

  agregarEstudiante(claseId, estudianteId) {
    return run(
      `
        INSERT OR IGNORE INTO estudiantes_clases (
          clase_id,
          estudiante_id
        )
        VALUES (?, ?)
      `,
      [claseId, estudianteId]
    );
  },

  obtenerPorEstudiante(estudianteId) {
    return all(
      `
        SELECT
          c.id,
          c.nombre,
          c.grado,
          c.codigo,
          c.profesor_id,
          u.nombre AS profesor_nombre
        FROM clases c
        INNER JOIN estudiantes_clases ec
          ON ec.clase_id = c.id
        INNER JOIN usuarios u
          ON u.id = c.profesor_id
        WHERE ec.estudiante_id = ?
        ORDER BY c.id DESC
      `,
      [estudianteId]
    );
  },
  obtenerEstudiantes(claseId) {
    return all(
      `
        SELECT
          u.id,
          u.nombre,
          u.correo,
          u.grado,
          u.grupo
        FROM estudiantes_clases ec
        INNER JOIN usuarios u
          ON u.id = ec.estudiante_id
        WHERE ec.clase_id = ?
        AND u.rol = 'estudiante'
        ORDER BY u.nombre ASC
      `,
      [claseId]
    );
  }
};

module.exports = Clase;