const express = require('express');
const { Op } = require('sequelize');
const { Actividad, User, RespuestaActividad } = require('../models');
const { userExtractor, permitRoles } = require('../utils/middleware');
const multer = require('multer');

const actividadesRouter = express.Router();

// Endpoint para actividades generales
actividadesRouter.get('/generales', userExtractor, permitRoles('estudiante', 'docente', 'administrador'), async (req, res) => {
  try {
    const actividades = await Actividad.findAll({
      where: { global: true },
      include: [
        { model: User, as: 'creador', attributes: ['username', 'nombre', 'rol'] },
  { model: require('../models').Grupo, as: 'grupo', attributes: ['id', 'nombre'] }
      ],
      order: [['fechaLimite', 'ASC']]
    });
    res.json(actividades);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las actividades generales' });
  }
});

// Configuración de subida de archivos
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo de archivo no permitido'));
  }
});

// Endpoint para actividades grupales
actividadesRouter.get('/grupales', userExtractor, permitRoles('estudiante', 'docente', 'administrador'), async (req, res) => {
  try {
    const actividades = await Actividad.findAll({
      where: { grupoId: { [Op.ne]: null } },
      include: [
        { model: User, as: 'creador', attributes: ['username', 'nombre', 'rol'] },
  { model: require('../models').Grupo, as: 'grupo', attributes: ['id', 'nombre'] }
      ],
      order: [['fechaLimite', 'ASC']]
    });
    res.json(actividades);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las actividades grupales' });
  }
});

// Utilidad: verificar si la actividad está vencida
const isVencida = fechaLimite => new Date() > new Date(fechaLimite);

/* ------------------------------------------------------------------
   GET /api/actividades/mis-actividades
   ------------------------------------------------------------------ */
actividadesRouter.get(
  '/mis-actividades',
  userExtractor,
  permitRoles('estudiante', 'docente', 'administrador', 'independiente'),
  async (req, res) => {
    try {
      console.log('DEBUG - Request user:', req.user);
      
      // Usar los grupos extraídos por el middleware si existen
      let grupoIds = [];
      if (req.user && Array.isArray(req.user.grupos)) {
        grupoIds = req.user.grupos.map(g => g && g.id).filter(id => id != null);
      }
      
      // Si no hay grupos, consultar la tabla intermedia
      if (!grupoIds.length) {
        console.log('DEBUG - Buscando grupos en tabla intermedia para usuario:', req.user.id);
        const grupoUsuarios = await require('../models').GrupoUsuario.findAll({
          where: { user_id: req.user.id },
          attributes: ['grupo_id']
        });
        console.log('DEBUG - GrupoUsuarios encontrados:', grupoUsuarios);
        grupoIds = grupoUsuarios.map(gu => gu.grupo_id).filter(id => id != null);
      }
      
      console.log('DEBUG - GrupoIds finales:', grupoIds);

      console.log('DEBUG - Usuario y sus grupos:', {
        userId: req.user.id,
        username: req.user.username,
        rol: req.user.rol,
        grupoIds
      });

      let whereCondition = {};
      // Si se pasa un parámetro de grupoId en la query, filtrar solo por ese grupo
      const filtroGrupoId = req.query.grupoId ? parseInt(req.query.grupoId) : null;
      if (filtroGrupoId && !isNaN(filtroGrupoId)) {
        // Solo actividades del grupo seleccionado, sin globales, para cualquier rol
        whereCondition = { grupoId: filtroGrupoId, global: false };
      } else {
        if (req.user.rol === 'administrador') {
          whereCondition = {};
        } else if (req.user.rol === 'docente') {
          // Para docentes: ver actividades que crearon, actividades globales y actividades de sus grupos
          whereCondition = {
            [Op.or]: [
              { creadorId: req.user.id },
              { global: true },
              { grupoId: { [Op.in]: grupoIds } }
            ]
          };
        } else if (req.user.rol === 'estudiante') {
          whereCondition = {
            [Op.or]: [
              { global: true },
              { grupoId: { [Op.in]: grupoIds } }
            ]
          };
        }
      }

      console.log('DEBUG - Condición de búsqueda:', JSON.stringify(whereCondition, null, 2));
      
      // Incluir respuestas del usuario autenticado en cada actividad
      const actividades = await Actividad.findAll({
        where: whereCondition,
        include: [
          {
            model: User,
            as: 'creador',
            attributes: ['id', 'username', 'nombre', 'rol']
          },
          {
            model: require('../models').Grupo,
            as: 'grupo',
            attributes: ['id', 'nombre']
          },
          // Incluir solo las respuestas del usuario autenticado para estudiante/independiente
          {
            model: RespuestaActividad,
            as: 'respuestas',
            attributes: ['id', 'user_id', 'respuesta_texto', 'archivo_url', 'created_at', 'updated_at', 'actividad_id', 'deshecha'],
            where: (req.user.rol === 'estudiante' || req.user.rol === 'independiente')
              ? { userId: req.user.id }
              : undefined,
            required: false
          }
        ],
        order: [['fechaLimite', 'ASC']]
      });

      // Convertir a objeto plano y procesar los datos
      const actividadesConPreguntas = actividades.map(act => {
        const plain = act.toJSON();
        // Incluir campo 'deshecha' en cada respuesta si existe, o forzarlo a false si no está presente
        // Mapear campos de respuesta a camelCase
        if (plain.respuestas && Array.isArray(plain.respuestas)) {
          plain.respuestas = plain.respuestas.map(r => ({
            id: r.id,
            userId: r.user_id,
            respuestaTexto: r.respuesta_texto,
            archivoUrl: r.archivo_url,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            actividadId: r.actividad_id,
            deshecha: r.deshecha !== undefined ? r.deshecha : false
          }));
        } else {
          plain.respuestas = [];
        }
        // ...existing code...
        // Asegurar que preguntas sea un array
        if (!Array.isArray(plain.preguntas)) {
          try {
            plain.preguntas = plain.preguntas ? JSON.parse(plain.preguntas) : [];
          } catch (e) {
            console.error('Error al parsear preguntas:', e);
            plain.preguntas = [];
          }
        }

        // Procesar respuestas para determinar si la actividad está respondida
        if (plain.respuestas && Array.isArray(plain.respuestas)) {
          // Solo para estudiante o independiente
          if (req.user.rol === 'estudiante' || req.user.rol === 'independiente') {
            // Verificar respuestas del usuario actual
            const respuestasUsuario = plain.respuestas.filter(r => r.user_id === req.user.id);
            
            // Obtener la última respuesta
            if (respuestasUsuario.length > 0) {
              const ultimaRespuesta = respuestasUsuario[respuestasUsuario.length - 1];
              
              // Si la última respuesta está deshecha, no se considera como respondida
              if (!ultimaRespuesta.deshecha) {
                plain.respondida = true;
                plain.respuestaTexto = ultimaRespuesta.respuesta_texto;
                plain.archivoUrl = ultimaRespuesta.archivo_url;
              } else {
                plain.respondida = false;
                plain.deshecha = true;
              }
            } else {
              plain.respondida = false;
            }
          }
        } else {
          if (req.user.rol === 'estudiante' || req.user.rol === 'independiente') {
            plain.respondida = false;
          }
          plain.respuestas = [];
        }

        // ...existing code...
        return plain;
      });

      res.json(actividadesConPreguntas);
    } catch (error) {
      console.error('Error detallado en /mis-actividades:', {
        message: error.message,
        stack: error.stack,
        user: req.user ? {
          id: req.user.id,
          rol: req.user.rol,
          username: req.user.username
        } : null
      });
      res.status(500).json({ 
        error: 'Error al obtener mis actividades',
        details: error.message
      });
    }
  }
);

/* ------------------------------------------------------------------
   POST /api/actividades
   Crear nueva actividad (solo docentes y admin)
   ------------------------------------------------------------------ */
actividadesRouter.post('/', userExtractor, permitRoles('docente', 'administrador'), upload.single('archivo'), async (req, res) => {
  try {
    const usuario = req.user;
    const { titulo, descripcion, fechaLimite, tipo, global, grupoId, preguntas } = req.body;

    if (!titulo || !descripcion || !fechaLimite || !tipo) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (!['formulario', 'archivo'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de actividad inválido' });
    }

    // Crear la fecha límite correctamente en local y setear hora 12:00
    let fechaLimiteDate;
    if (typeof fechaLimite === 'string' && fechaLimite.length === 10) {
      // Si viene como 'YYYY-MM-DD', crear fecha local
      const [year, month, day] = fechaLimite.split('-');
      fechaLimiteDate = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
    } else {
      fechaLimiteDate = new Date(fechaLimite);
      fechaLimiteDate.setHours(12, 0, 0, 0);
    }
    const hoy = new Date();
    hoy.setHours(12, 0, 0, 0);
    if (fechaLimiteDate < hoy) {
      return res.status(400).json({ error: 'La fecha límite no puede ser en el pasado' });
    }

    // Si el usuario es administrador
    if (usuario.rol === 'administrador') {
      // Si grupoId es válido (no vacío, no null, no undefined, no 'null', no 'undefined')
      if (grupoId && grupoId !== '' && grupoId !== 'null' && grupoId !== 'undefined') {
        const actividadData = {
          titulo,
          descripcion,
          fechaLimite: fechaLimiteDate,
          tipo,
          creadorId: usuario.id,
          global: false,
          grupoId: Number(grupoId)
        };
        if (tipo === 'archivo') {
          if (req.file) actividadData.archivoUrl = `/uploads/${req.file.filename}`;
          else return res.status(400).json({ error: 'Debe subir un archivo o proporcionar una URL' });
        } else if (tipo === 'formulario') {
          let parsedPreguntas = [];
          if (preguntas) {
            parsedPreguntas = typeof preguntas === 'string' ? JSON.parse(preguntas) : preguntas;
          }
          if (!Array.isArray(parsedPreguntas) || parsedPreguntas.length === 0) {
            return res.status(400).json({ error: 'Debe proporcionar al menos una pregunta' });
          }
          actividadData.preguntas = parsedPreguntas;
        }
        const nuevaActividad = await Actividad.create(actividadData);
        const actividadConUsuario = await Actividad.findOne({
          where: { id: nuevaActividad.id },
          include: [{ model: User, as: 'creador', attributes: ['username', 'nombre', 'rol'] }]
        });
        return res.status(201).json([actividadConUsuario]);
      } else {
        // Si no hay grupoId, crear actividad general
        const actividadData = {
          titulo,
          descripcion,
          fechaLimite: fechaLimiteDate,
          tipo,
          creadorId: usuario.id,
          global: true,
          grupoId: null
        };
        if (tipo === 'archivo') {
          if (req.file) actividadData.archivoUrl = `/uploads/${req.file.filename}`;
          else return res.status(400).json({ error: 'Debe subir un archivo o proporcionar una URL' });
        } else if (tipo === 'formulario') {
          let parsedPreguntas = [];
          if (preguntas) {
            parsedPreguntas = typeof preguntas === 'string' ? JSON.parse(preguntas) : preguntas;
          }
          if (!Array.isArray(parsedPreguntas) || parsedPreguntas.length === 0) {
            return res.status(400).json({ error: 'Debe proporcionar al menos una pregunta' });
          }
          actividadData.preguntas = parsedPreguntas;
        }
        const nuevaActividad = await Actividad.create(actividadData);
        const actividadConUsuario = await Actividad.findOne({
          where: { id: nuevaActividad.id },
          include: [{ model: User, as: 'creador', attributes: ['username', 'nombre', 'rol'] }]
        });
        return res.status(201).json([actividadConUsuario]);
      }
    }

    // Si es docente y no es global, crear una por cada grupo
    const docente = await User.findByPk(usuario.id, {
  include: { model: require('../models').Grupo, as: 'grupos', attributes: ['id', 'nombre'] }
    });
    if (!docente.grupos || docente.grupos.length === 0) {
      return res.status(400).json({ error: 'El docente no pertenece a ningún grupo' });
    }

    // Crear solo para el grupo seleccionado
    if (!grupoId) {
      return res.status(400).json({ error: 'Debes seleccionar un grupo para la actividad grupal' });
    }
    const actividadData = {
      titulo,
      descripcion,
      fechaLimite: fechaLimiteDate,
      tipo,
      creadorId: usuario.id,
      global: false,
      grupoId: Number(grupoId)
    };
    if (tipo === 'archivo') {
      if (req.file) actividadData.archivoUrl = `/uploads/${req.file.filename}`;
      else return res.status(400).json({ error: 'Debe subir un archivo o proporcionar una URL' });
    } else if (tipo === 'formulario') {
      let parsedPreguntas = [];
      if (preguntas) {
        parsedPreguntas = typeof preguntas === 'string' ? JSON.parse(preguntas) : preguntas;
      }
      if (!Array.isArray(parsedPreguntas) || parsedPreguntas.length === 0) {
        return res.status(400).json({ error: 'Debe proporcionar al menos una pregunta' });
      }
      actividadData.preguntas = parsedPreguntas;
    }
    const nuevaActividad = await Actividad.create(actividadData);
    const actividadConUsuario = await Actividad.findOne({
      where: { id: nuevaActividad.id },
      include: [{ model: User, as: 'creador', attributes: ['username', 'nombre', 'rol'] }]
    });
    res.status(201).json([actividadConUsuario]);
  } catch (error) {
    console.error('Error al crear actividad:', error);
    res.status(500).json({ error: 'Error al crear la actividad' });
  }
});

/* ------------------------------------------------------------------
   PUT /api/actividades/:id
   Actualizar actividad
   ------------------------------------------------------------------ */
actividadesRouter.put('/:id', userExtractor, permitRoles('docente', 'administrador'), upload.single('archivo'), async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.user;
    const actividad = await Actividad.findByPk(id);

    if (!actividad) return res.status(404).json({ error: 'Actividad no encontrada' });
    if (usuario.rol !== 'administrador' && actividad.creadorId !== usuario.id)
      return res.status(403).json({ error: 'No tienes permiso para editar esta actividad' });


    const { titulo, descripcion, fechaLimite, tipo, global, grupoId, preguntas } = req.body;
    let fechaLimiteFinal = actividad.fechaLimite;
    if (fechaLimite) {
      if (typeof fechaLimite === 'string' && fechaLimite.length === 10) {
        const [year, month, day] = fechaLimite.split('-');
        const fecha = new Date();
        fecha.setFullYear(Number(year), Number(month) - 1, Number(day));
        // Ajustar a mediodía para evitar problemas de zona horaria
        fecha.setHours(12, 0, 0, 0);
        fechaLimiteFinal = fecha;
      } else {
        fechaLimiteFinal = new Date(fechaLimite);
      }
    }
    // Log para depuración
    console.log('PUT /api/actividades/:id -> preguntas recibido:', preguntas, 'tipo:', typeof preguntas);
    let preguntasFinal = actividad.preguntas;
    if (preguntas) {
      if (typeof preguntas === 'string') {
        try {
          preguntasFinal = JSON.parse(preguntas);
        } catch (e) {
          console.error('Error al parsear preguntas:', preguntas);
          return res.status(400).json({ error: 'El campo preguntas no es un JSON válido' });
        }
      } else if (Array.isArray(preguntas)) {
        preguntasFinal = preguntas;
      } else {
        return res.status(400).json({ error: 'El campo preguntas debe ser un array o un JSON válido' });
      }
    }
    const actualizacion = {
      titulo: titulo || actividad.titulo,
      descripcion: descripcion || actividad.descripcion,
      fechaLimite: fechaLimiteFinal,
      tipo: tipo || actividad.tipo,
      global: global === 'true' ? true : global === 'false' ? false : actividad.global,
      grupoId: global === 'true' ? null : grupoId || actividad.grupoId,
      preguntas: preguntasFinal
    };

    if (req.file) actualizacion.archivoUrl = `/uploads/${req.file.filename}`;

    await actividad.update(actualizacion);

    const actividadActualizada = await Actividad.findOne({
      where: { id },
      include: [{ model: User, as: 'creador', attributes: ['id', 'username', 'nombre', 'rol'] }]
    });

    res.json(actividadActualizada);
  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    res.status(500).json({ error: 'Error al actualizar la actividad' });
  }
});

/* ------------------------------------------------------------------
   DELETE /api/actividades/:id
   ------------------------------------------------------------------ */
actividadesRouter.delete('/:id', userExtractor, permitRoles('docente', 'administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.user;
    const actividad = await Actividad.findByPk(id);

    if (!actividad) return res.status(404).json({ error: 'Actividad no encontrada' });
    if (usuario.rol !== 'administrador' && actividad.creadorId !== usuario.id)
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta actividad' });

    await RespuestaActividad.destroy({ where: { actividadId: id } });
    await actividad.destroy();

    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar actividad:', error);
    res.status(500).json({ error: 'Error al eliminar la actividad' });
  }
});

/* ------------------------------------------------------------------
   GET /api/actividades/:id/respuestas
   Obtiene las respuestas de una actividad según el rol del usuario
   ------------------------------------------------------------------ */
actividadesRouter.get('/:id/respuestas', userExtractor, permitRoles('estudiante', 'docente', 'administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const actividad = await Actividad.findByPk(id, {
      include: [{ model: User, as: 'creador', attributes: ['id', 'rol', 'nombre'] }]
    });

    if (!actividad) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    // 📌 Reglas de acceso:
    // - Estudiante: solo su propia respuesta
    // - Docente:
    //     * Si la actividad es suya -> puede ver todas las respuestas
    //     * Si la actividad es del administrador -> solo su propia respuesta
    // - Administrador: ve todas las respuestas

    let whereCondition = { actividadId: id };

    if (user.rol === 'estudiante') {
      whereCondition.userId = user.id;
    } else if (user.rol === 'docente') {
      if (actividad.creador.rol === 'administrador') {
        whereCondition.userId = user.id; // solo su respuesta
      }
      // si es su actividad, ve todas las respuestas
    }

    const respuestas = await RespuestaActividad.findAll({
      where: whereCondition,
      include: [
        { model: User, as: 'usuario', attributes: ['id', 'username', 'nombre', 'rol'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(respuestas);
  } catch (error) {
    console.error('❌ Error al obtener respuestas:', error);
    res.status(500).json({ error: 'Error al obtener las respuestas de la actividad' });
  }
});


module.exports = actividadesRouter;
