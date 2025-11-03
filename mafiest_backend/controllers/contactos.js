const express = require('express');
const { Contacto } = require('../models');
const { userExtractor, permitRoles } = require('../utils/middleware');
const contactosRouter = express.Router();

// Obtener todos los contactos
contactosRouter.get('/', userExtractor, permitRoles('docente', 'administrador'), async (req, res) => {
  try {
    const contactos = await Contacto.findAll({ order: [['createdAt', 'DESC']] });
    res.json(contactos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener contactos', details: error.message });
  }
});

// Obtener contacto por id
contactosRouter.get('/:id', userExtractor, permitRoles('docente', 'administrador'), async (req, res) => {
  try {
    const contacto = await Contacto.findByPk(req.params.id);
    if (contacto) {
      res.json(contacto);
    } else {
      res.status(404).json({ error: 'Contacto no encontrado' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Crear contacto - cualquier persona puede crear un contacto
contactosRouter.post('/', async (req, res) => {
  try {
    const { nombre, email, asunto, mensaje } = req.body;
    if (!nombre || !email || !asunto || !mensaje) {
      return res.status(400).json({ error: 'nombre, email, asunto y mensaje son requeridos' });
    }
    const contacto = await Contacto.create({
      nombre,
      email,
      asunto,
      mensaje,
      createdAt: new Date()
    });
    res.status(201).json(contacto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = contactosRouter;
