module.exports = (sequelize, DataTypes) => {
const RespuestaActividad = sequelize.define('RespuestaActividad', {
  deshecha: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'deshecha'
  },
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  actividadId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'actividad_id',
    references: {
      model: 'actividades',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  archivoUrl: {
    type: DataTypes.STRING,
    field: 'archivo_url',
    allowNull: true
  },
  respuestaTexto: {
    type: DataTypes.TEXT,
    field: 'respuesta_texto',
    allowNull: true
  },
  // Usar respuestaTexto como JSON.stringify({ 1: 'respuesta1', 2: 'respuesta2', ... }) para respuestas de formulario
}, {
  tableName: 'respuestas_actividad',
  timestamps: true,
  defaultScope: {},
  getterMethods: {
    estado() {
      // Calcula el estado de la respuesta: entregada, deshecha, vencida, disponible
      // this.actividad debe estar incluido en la consulta
      const now = new Date();
      let estado = 'disponible';
      if (this.deshecha) {
        estado = 'deshecha';
      } else if (this.respuestaTexto || this.archivoUrl) {
        estado = 'entregada';
      }
      if (this.actividad && this.actividad.fecha_limite) {
        const fechaLimite = new Date(this.actividad.fecha_limite);
        if (now > fechaLimite && estado === 'disponible') {
          estado = 'vencida';
        }
      }
      return estado;
    }
  }
}, {
  tableName: 'respuestas_actividad',
  timestamps: true
});

RespuestaActividad.associate = (models) => {
  RespuestaActividad.belongsTo(models.Actividad, {
    foreignKey: 'actividadId',
    as: 'actividad'
  });

  RespuestaActividad.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'usuario'
  });

  RespuestaActividad.hasMany(models.Retroalimentacion, {
    foreignKey: 'respuestaId',
    as: 'retroalimentaciones'
  });
};
return RespuestaActividad;
};
