// Importar modelo de retroalimentación
const { Retroalimentacion } = require('../models');
const express = require('express');
const { RespuestaActividad, User, Actividad, Grupo, sequelize } = require('../models');
const { userExtractor, permitRoles } = require('../utils/middleware');
const respuestasRouter = express.Router();
/* ------------------------------------------------------------------
   GET /api/respuestas-actividad/todas
   Obtener todas las respuestas (solo admin/docente)
   ------------------------------------------------------------------ */
respuestasRouter.get(
  '/todas',
  userExtractor,
  permitRoles('administrador', 'docente'),
  async (req, res) => {
    try {
      const respuestas = await RespuestaActividad.findAll({
        include: [
          {
            model: Actividad,
            as: 'actividad',
            attributes: [
              'id',
              'titulo',
              'descripcion',
              ['fecha_limite', 'fechaLimite'],
              'tipo',
              'preguntas'
            ]
          },
          {
            model: User,
            as: 'usuario',
            attributes: ['id', 'username', 'nombre', 'rol']
          },
          {
            model: Retroalimentacion,
            as: 'retroalimentaciones',
            required: false,
            attributes: ['id', 'retroalimentacion', 'nota', 'usuarioId', 'createdAt']
          }
        ],
        order: [['created_at', 'DESC']]
      });
      // Convertir a objetos planos y parsear respuestaTexto si es string JSON
      const respuestasPlanas = respuestas.map(r => {
        const plain = r.get({ plain: true });
        // Incluir campo 'deshecha' explícitamente
        plain.deshecha = r.deshecha;
        // Si respuestaTexto es string y parece JSON, intentar parsear
        if (plain.respuestaTexto && typeof plain.respuestaTexto === 'string') {
          try {
            const parsed = JSON.parse(plain.respuestaTexto);
            if (Array.isArray(parsed)) {
              plain.respuestas = parsed;
            }
          } catch {}
        }
        // Agregar campo virtual estado
        if (typeof r.estado === 'function') {
          plain.estado = r.estado();
        } else if (r.estado) {
          plain.estado = r.estado;
        }
        return plain;
      });
      res.json(respuestasPlanas);
    } catch (error) {
      console.error('Error al obtener todas las respuestas:', error);
      res.status(500).json({ error: 'Error al obtener todas las respuestas' });
    }
  }
);
/* ------------------------------------------------------------------
   PUT /api/respuestas-actividad/retroalimentacion/:id
   Editar retroalimentación (solo autor o admin)
   ------------------------------------------------------------------ */
respuestasRouter.put(
  '/retroalimentacion/:id',
  userExtractor,
  permitRoles('docente', 'administrador'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { retroalimentacion, nota } = req.body;
      const user = req.user;
      const retro = await Retroalimentacion.findByPk(id);
      console.log('Intentando editar retroalimentación:', {
        id,
        userId: user.id,
        userRol: user.rol,
        retroUsuarioId: retro?.usuarioId,
        retro
      });
      if (!retro) return res.status(404).json({ error: 'Retroalimentación no encontrada' });
      if (user.rol !== 'administrador' && retro.usuarioId !== user.id) {
        console.log('Permiso denegado para editar retroalimentación');
        return res.status(403).json({ error: 'No tienes permiso para editar esta retroalimentación' });
      }
      if (!retroalimentacion || typeof nota === 'undefined') {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
      }
      if (Number(nota) < 1 || Number(nota) > 5) {
        return res.status(400).json({ error: 'La nota debe ser entre 1 y 5' });
      }
      retro.retroalimentacion = retroalimentacion;
      retro.nota = nota;
      await retro.save();
      res.json(retro);
    } catch (error) {
      console.error('Error al editar retroalimentación:', error);
      res.status(500).json({ error: 'Error al editar retroalimentación' });
    }
  }
);

/* ------------------------------------------------------------------
   DELETE /api/respuestas-actividad/retroalimentacion/:id
   Borrar retroalimentación (solo autor o admin)
   ------------------------------------------------------------------ */
respuestasRouter.delete(
  '/retroalimentacion/:id',
  userExtractor,
  permitRoles('docente', 'administrador'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const retro = await Retroalimentacion.findByPk(id);
      console.log('Intentando borrar retroalimentación:', {
        id,
        userId: user.id,
        userRol: user.rol,
        retroUsuarioId: retro?.usuarioId,
        retro
      });
      if (!retro) return res.status(404).json({ error: 'Retroalimentación no encontrada' });
      if (user.rol !== 'administrador' && retro.usuarioId !== user.id) {
        console.log('Permiso denegado para borrar retroalimentación');
        return res.status(403).json({ error: 'No tienes permiso para borrar esta retroalimentación' });
      }
      await retro.destroy();
      res.json({ message: 'Retroalimentación eliminada correctamente' });
    } catch (error) {
      console.error('Error al borrar retroalimentación:', error);
      res.status(500).json({ error: 'Error al borrar retroalimentación' });
    }
  }
);

/* ------------------------------------------------------------------
   POST /api/respuestas-actividad/retroalimentacion
   Crear retroalimentación separada para una respuesta
   ------------------------------------------------------------------ */
respuestasRouter.post(
  '/retroalimentacion',
  userExtractor,
  permitRoles('docente', 'administrador'),
  async (req, res) => {
    try {
      const { respuestaId, retroalimentacion, nota } = req.body;
      const user = req.user;
      if (!user || !user.id) {
        return res.status(401).json({ error: 'Token requerido o inválido' });
      }
      if (!respuestaId || !retroalimentacion || typeof nota === 'undefined') {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
      }
      if (Number(nota) < 1 || Number(nota) > 5) {
        return res.status(400).json({ error: 'La nota debe ser entre 1 y 5' });
      }
      // Validar que la respuesta exista
      const respuesta = await RespuestaActividad.findByPk(respuestaId);
      if (!respuesta) {
        return res.status(404).json({ error: 'Respuesta no encontrada' });
      }
      // Solo el creador de la actividad o un administrador puede retroalimentar
      const actividad = await Actividad.findByPk(respuesta.actividadId);
      if (!actividad) {
        return res.status(404).json({ error: 'Actividad no encontrada' });
      }
      const creadorId = actividad.creadorId ?? actividad.creador_id;
      if (user.rol !== 'administrador' && Number(creadorId) !== Number(user.id)) {
        return res.status(403).json({ error: 'Solo el docente creador o un administrador puede retroalimentar' });
      }
      // Crear retroalimentación
      const retro = await Retroalimentacion.create({
        respuestaId,
        usuarioId: user.id,
        retroalimentacion,
        nota
      });
      res.status(201).json(retro);
    } catch (error) {
      console.error('Error al crear retroalimentación:', error);
      res.status(500).json({ error: 'Error al crear retroalimentación' });
    }
  }
);
/* ------------------------------------------------------------------
   GET /api/respuestas-actividad/mis-respuestas
   Obtener todas las respuestas del usuario autenticado
   ------------------------------------------------------------------ */
respuestasRouter.get(
  '/mis-respuestas',
  userExtractor,
  permitRoles('estudiante', 'independiente'),
  async (req, res) => {
    try {
      const user = req.user;
      // Obtener todas las respuestas del usuario
      const todas = await RespuestaActividad.findAll({
        where: { user_id: user.id },
        include: [
          {
            model: Actividad,
            as: 'actividad',
            attributes: [
              'id',
              'titulo',
              'descripcion',
              ['fecha_limite', 'fechaLimite'],
              'tipo',
              'preguntas'
            ]
          },
          {
            model: Retroalimentacion,
            as: 'retroalimentaciones',
            required: false,
            attributes: ['id', 'retroalimentacion', 'nota', 'usuarioId', 'createdAt']
          }
        ],
        order: [['created_at', 'DESC']]
      });
      // Filtrar solo la última respuesta por actividad y eliminar las anteriores
      const map = new Map();
      for (const r of todas) {
        const actividadId = r.actividadId || (r.actividad && r.actividad.id);
        if (!actividadId) continue;
        if (!map.has(actividadId)) {
          map.set(actividadId, r);
        } else {
          // Eliminar respuesta anterior de la base de datos
          await r.destroy();
        }
      }
      const respuestas = Array.from(map.values());
      // Convertir a objetos planos y parsear respuestaTexto si es string JSON
      const respuestasPlanas = respuestas.map(r => {
        const plain = r.get({ plain: true });
        plain.deshecha = r.deshecha;
        if (plain.respuestaTexto && typeof plain.respuestaTexto === 'string') {
          try {
            const parsed = JSON.parse(plain.respuestaTexto);
            if (Array.isArray(parsed)) {
              plain.respuestas = parsed;
            }
          } catch {}
        }
        if (typeof r.estado === 'function') {
          plain.estado = r.estado();
        } else if (r.estado) {
          plain.estado = r.estado;
        }
        return plain;
      });
      res.json(respuestasPlanas);
    } catch (error) {
      console.error('Error al obtener mis respuestas:', error);
      res.status(500).json({ error: 'Error al obtener tus respuestas' });
    }
  }
);
/* ------------------------------------------------------------------
   GET /api/respuestas/actividad/:actividadId
   Obtener respuestas según rol
   ------------------------------------------------------------------ */
respuestasRouter.get(
  '/actividad/:actividadId',
  userExtractor,
  permitRoles('administrador', 'docente', 'estudiante', 'independiente'),
  async (req, res) => {
    try {
      console.log('Iniciando obtención de respuestas...');
      const { actividadId } = req.params;
      const user = req.user;

      console.log('Datos de la petición:', { actividadId, userId: user?.id, userRol: user?.rol });

      if (!user || !user.id) {
        return res.status(401).json({ error: 'Token requerido o inválido' });
      }

      // Validar existencia de actividad
      const actividad = await Actividad.findByPk(actividadId);
      console.log('Actividad encontrada:', actividad?.get({ plain: true }));
      
      if (!actividad) {
        return res.status(404).json({ error: 'Actividad no encontrada' });
      }

      // Validar existencia de usuario
      const usuarioValido = await User.findByPk(user.id);
      if (!usuarioValido) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      let whereCondition = { actividad_id: actividadId };

      // 🔒 Control de acceso
      const actividadData = actividad.get({ plain: true });
      console.log('Control de acceso - Datos completos:', {
        actividad: actividadData,
        userRol: user.rol,
        userId: user.id,
        actividadId: actividadId
      });

      if (user.rol === 'administrador') {
        // Admin ve todas las respuestas
        whereCondition = { actividad_id: actividadId };
      } else if (user.rol === 'docente') {
        // Docente creador ve todas las respuestas de su actividad
        console.log('Verificando permisos docente:', {
          docente_id: user.id,
          actividad_creador_id: actividadData.creadorId,
          sonIguales: Number(actividadData.creadorId) === Number(user.id)
        });

        if (Number(actividadData.creadorId) === Number(user.id)) {
          whereCondition = { actividad_id: actividadId };
          console.log('Docente creador: mostrando todas las respuestas');
        } else {
          console.log('Docente no creador: no puede ver respuestas');
          return res.json([]);
        }
      } else {
        // Estudiante e independiente solo ven sus propias respuestas
        whereCondition = { actividad_id: actividadId, user_id: user.id };
      }

      // Consulta robusta con manejo de errores
      console.log('Consultando respuestas con:', { whereCondition });
      
      try {
        // Obtener todas las respuestas para la actividad
        const todas = await RespuestaActividad.findAll({
          where: whereCondition,
          include: [
            {
              model: User,
              as: 'usuario',
              required: false,
              attributes: ['id', 'username', 'nombre', 'rol'],
              include: [{
                model: Grupo,
                as: 'grupos',
                attributes: ['id', 'nombre']
              }]
            },
            {
              model: Actividad,
              as: 'actividad',
              required: false,
              attributes: [
                'id',
                'titulo',
                'descripcion',
                'fecha_limite',
                'tipo',
                'grupo_id',
                'creador_id'
              ],
              include: [
                {
                  model: User,
                  as: 'creador',
                  attributes: ['id', 'username', 'nombre', 'rol']
                }
              ]
            },
            {
              model: Retroalimentacion,
              as: 'retroalimentaciones',
              required: false,
              attributes: ['id', 'retroalimentacion', 'nota', 'usuarioId', 'createdAt']
            }
          ],
          order: [['created_at', 'DESC']]
        });
        // Filtrar solo la última respuesta por usuario y eliminar las anteriores
        const map = new Map();
        for (const r of todas) {
          const userId = r.userId || (r.usuario && r.usuario.id);
          if (!userId) continue;
          if (!map.has(userId)) {
            map.set(userId, r);
          } else {
            // Eliminar respuesta anterior de la base de datos
            await r.destroy();
          }
        }
        const respuestas = Array.from(map.values());
        const respuestasPlanas = respuestas.map(r => {
          const plain = r.get({ plain: true });
          plain.deshecha = r.deshecha;
          if (plain.respuestaTexto && typeof plain.respuestaTexto === 'string') {
            try {
              const parsed = JSON.parse(plain.respuestaTexto);
              if (Array.isArray(parsed)) {
                plain.respuestas = parsed;
              }
            } catch {}
          }
          if (typeof r.estado === 'function') {
            plain.estado = r.estado();
          } else if (r.estado) {
            plain.estado = r.estado;
          }
          return plain;
        });
        return res.json(respuestasPlanas);
      } catch (queryError) {
        console.error('Error en la consulta:', queryError);
        return res.status(500).json({
          error: 'Error al obtener las respuestas',
          details: queryError.message,
          stack: queryError.stack
        });
      }
    } catch (error) {
      console.error('Error al obtener respuestas:', error);
      res.status(500).json({ 
        error: 'Error al obtener las respuestas',
        details: error.message 
      });
    }
  }
);

/* ------------------------------------------------------------------
   POST /api/respuestas/actividad/:actividadId
   Crear o actualizar respuesta de usuario
   ------------------------------------------------------------------ */
const multer = require('multer');
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }
});

respuestasRouter.post(
  '/actividad/:actividadId',
  userExtractor,
  permitRoles('estudiante', 'independiente'),
  upload.single('archivo'),
  async (req, res) => {
    try {
      const { actividadId } = req.params;
      const user = req.user;
        let { respuestaTexto, archivoUrl, respuestas, tipo } = req.body;

      console.log('Intento de respuesta:', {
        userId: user?.id,
        userRol: user?.rol,
        userGrupoId: user?.grupo_id,
        actividadId,
        body: req.body
      });

      if (!user || !user.id) {
        console.log('Token requerido o inválido');
        return res.status(401).json({ error: 'Token requerido o inválido' });
      }

      // Forzar inclusión de grupo_id/grupoId en la consulta
      const actividad = await Actividad.findByPk(actividadId, {
        attributes: { include: ['grupo_id', 'grupoId'] }
      });
      if (!actividad) {
        console.log('Actividad no encontrada');
        return res.status(404).json({ error: 'Actividad no encontrada' });
      }
      // Log de depuración para ver los valores reales
      console.log('Debug Actividad grupoId:', {
        grupoId: actividad.grupoId,
        grupo_id: actividad.grupo_id,
        actividad: actividad.get({ plain: true })
      });

      // 🔒 Validación de quién puede responder
      if (!actividad.global) {
        // Permitir si el usuario pertenece al grupo de la actividad
        let perteneceAlGrupo = false;
        if (Array.isArray(user.grupos)) {
          perteneceAlGrupo = user.grupos.some(g => g.id === actividad.grupoId);
        }
        if (!perteneceAlGrupo) {
          console.log('403: No puedes responder esta actividad (no pertenece al grupo)', { actividadGrupoId: actividad.grupoId, userGrupos: user.grupos });
          return res.status(403).json({ error: 'No puedes responder esta actividad' });
        }
      }

      // Procesar archivo subido
      let archivoFinalUrl = undefined;
      if (req.file) {
        archivoFinalUrl = `/uploads/${req.file.filename}`;
      } else if (archivoUrl) {
        archivoFinalUrl = archivoUrl;
      } else if (req.body.archivo) {
        archivoFinalUrl = req.body.archivo;
      }
      // Si es tipo archivo y solo viene la URL, usar archivoUrl
      if (tipo === 'archivo' && !archivoFinalUrl && req.body.archivoUrl) {
        archivoFinalUrl = req.body.archivoUrl;
      }

      // Procesar el formato de las respuestas
      console.log('Datos recibidos en POST /actividad/:id:', {
        respuestas,
        respuestaTexto,
        archivo: req.file,
        body: req.body
      });

      // Si se recibe respuestaTexto como string, asegurarse de que es un JSON válido
      if (typeof respuestaTexto === 'string') {
        try {
          JSON.parse(respuestaTexto); // Validar que es JSON válido
        } catch (e) {
          console.error('Error: respuestaTexto no es JSON válido:', e);
          return res.status(400).json({ error: 'El formato de la respuesta no es válido' });
        }
      } else if (Array.isArray(respuestas)) {
        // Si recibimos un array de respuestas, convertirlo a string
        respuestaTexto = JSON.stringify(respuestas);
      } else if (!respuestaTexto && !respuestas && !archivoFinalUrl) {
        // Solo rechazar si no hay texto, ni respuestas, ni archivo físico o url
        return res.status(400).json({ error: 'No se proporcionó ninguna respuesta' });
      }

      console.log('Formato final antes de guardar:', {
        respuestaTexto
      });

      // Usar una transacción para asegurar que todo se ejecute atómicamente
      const result = await sequelize.transaction(async (t) => {
        // Buscar la respuesta más reciente no deshecha
        const respuestaAnterior = await RespuestaActividad.findOne({
          where: {
            actividadId: actividadId,
            userId: user.id,
            deshecha: false
          },
          order: [['createdAt', 'DESC']],
          transaction: t
        });

        // Si existe una respuesta anterior no deshecha, marcarla como deshecha
        if (respuestaAnterior) {
          await respuestaAnterior.update({ deshecha: true }, { transaction: t });
        }

        console.log('Estado de respuesta anterior:', {
          id: respuestaAnterior?.id,
          deshecha: respuestaAnterior ? true : null,
          actividadId,
          userId: user.id
        });

        // Crear la nueva respuesta
        const respuesta = await RespuestaActividad.create(
          {
            actividadId: actividadId,
            userId: user.id,
            respuestaTexto: respuestaTexto,
            archivoUrl: archivoFinalUrl,
            deshecha: false // Asegurarnos que la nueva respuesta no está deshecha
          },
          { transaction: t }
        );

        // Verificar el estado de la nueva respuesta
        console.log('Nueva respuesta creada:', {
          id: respuesta.id,
          deshecha: respuesta.deshecha,
          actividadId: respuesta.actividadId,
          userId: respuesta.userId
        });

        return respuesta;
      });

      const respuesta = result;

      // Verificar inmediatamente que la respuesta se guardó y obtener datos completos
      const respuestaGuardada = await RespuestaActividad.findOne({
        where: { id: respuesta.id },
        include: [
          {
            model: Actividad,
            as: 'actividad',
            attributes: ['id', 'titulo', 'descripcion', 'fechaLimite', 'tipo', 'preguntas']
          }
        ]
      });
      
      if (!respuestaGuardada) {
        throw new Error('Error al guardar la respuesta');
      }

      // Preparar la respuesta con toda la información necesaria
      const respuestaPlana = respuestaGuardada.get({ plain: true });
      
      // Asegurarnos de que los campos críticos estén presentes
      respuestaPlana.deshecha = false; // La nueva respuesta nunca está deshecha
      respuestaPlana.estado = 'entregada'; // La nueva respuesta siempre está entregada
      
      // Agregar el campo respuestas si existe respuestaTexto
      if (respuestaPlana.respuestaTexto) {
        try {
          const parsed = JSON.parse(respuestaPlana.respuestaTexto);
          if (Array.isArray(parsed)) {
            respuestaPlana.respuestas = parsed;
          }
        } catch (e) {
          console.error('Error al parsear respuesta para enviar:', e);
          respuestaPlana.respuestas = [];
        }
      }

      // Asegurarnos de que todos los campos importantes estén presentes
      respuestaPlana.deshecha = false;
      respuestaPlana.userId = user.id;
      respuestaPlana.actividadId = actividadId;
      respuestaPlana.entregada = true;
      respuestaPlana.estado = 'entregada';

      // Al devolver, parsear respuestaTexto si es JSON y exponer como 'respuestas'
      let plain = respuesta.get({ plain: true });
      if (plain.respuestaTexto) {
        try {
          const parsed = JSON.parse(plain.respuestaTexto);
          if (Array.isArray(parsed)) {
            plain.respuestas = parsed;
          }
        } catch {}
      }
      res.json(plain);
    } catch (error) {
      console.error('Error al guardar respuesta:', error);
      res.status(500).json({ error: 'Error al guardar respuesta' });
    }
  }
);

/* ------------------------------------------------------------------
   DELETE /api/respuestas/:id
   Solo el administrador o el creador pueden eliminar
   ------------------------------------------------------------------ */
respuestasRouter.delete(
  '/:id',
  userExtractor,
  permitRoles('administrador', 'docente'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;

      if (!user || !user.id) {
        return res.status(401).json({ error: 'Token requerido o inválido' });
      }

      const respuesta = await RespuestaActividad.findByPk(id);
      if (!respuesta) {
        return res.status(404).json({ error: 'Respuesta no encontrada' });
      }

      const actividad = await Actividad.findByPk(respuesta.actividadId);
      if (!actividad) {
        return res.status(404).json({ error: 'Actividad asociada no encontrada' });
      }

      if (
        user.rol !== 'administrador' &&
        actividad.creador_id !== user.id &&
        respuesta.user_id !== user.id
      ) {
        return res.status(403).json({ error: 'No tienes permiso para eliminar esta respuesta' });
      }

      await respuesta.destroy();
      res.json({ message: 'Respuesta eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar respuesta:', error);
      res.status(500).json({ error: 'Error al eliminar respuesta' });
    }
  }
);

/* ------------------------------------------------------------------
   PATCH /api/respuestas-actividad/deshacer/:id
   Permite marcar una respuesta como deshecha (solo el dueño de la respuesta)
   ------------------------------------------------------------------ */
respuestasRouter.patch(
  '/deshacer/:id',
  userExtractor,
  permitRoles('estudiante', 'independiente'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const respuesta = await RespuestaActividad.findByPk(id);
      if (!respuesta) {
        return res.status(404).json({ error: 'Respuesta no encontrada' });
      }
      if (respuesta.userId !== user.id) {
        return res.status(403).json({ error: 'No tienes permiso para deshacer esta entrega' });
      }
      // Marcar la última respuesta como deshecha
      respuesta.deshecha = true;
      await respuesta.save();

      // Eliminar todas las respuestas anteriores del usuario para esta actividad, excepto la actual
      await RespuestaActividad.destroy({
        where: {
          actividadId: respuesta.actividadId,
          userId: respuesta.userId,
          id: { [require('sequelize').Op.ne]: respuesta.id }
        }
      });

      // Recargar la respuesta con todas las relaciones
      const respuestaActualizada = await RespuestaActividad.findByPk(id, {
        include: [
          {
            model: Actividad,
            as: 'actividad',
            attributes: ['id', 'titulo', 'descripcion', 'fechaLimite', 'tipo']
          },
          {
            model: User,
            as: 'usuario',
            attributes: ['id', 'username', 'nombre', 'rol']
          }
        ]
      });

      // Convertir a objeto plano y asegurar que 'deshecha' esté presente
      const plain = respuestaActualizada.get({ plain: true });
      plain.deshecha = respuestaActualizada.deshecha;
      res.json({ 
        message: 'Entrega deshecha correctamente', 
        respuesta: plain
      });
    } catch (error) {
      console.error('Error al deshacer entrega:', error);
      res.status(500).json({ error: 'Error al deshacer entrega' });
    }
  }
);

/* ------------------------------------------------------------------
   📘 PUT /api/respuestas/retroalimentacion/:id
   Solo el docente creador puede calificar
   ------------------------------------------------------------------ */

module.exports = respuestasRouter;
