// models/actividad.js
module.exports = (sequelize, DataTypes) => {
  const Actividad = sequelize.define('Actividad', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    fechaLimite: {
      type: DataTypes.DATE,
      allowNull: false
    },
    tipo: {
      type: DataTypes.ENUM('formulario', 'archivo'),
      allowNull: false,
      defaultValue: 'formulario'
    },
    archivoUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    preguntas: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('preguntas');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('preguntas', JSON.stringify(value || []));
      }
    },
    creadorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'creador_id'
    },
    global: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    grupoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'grupo_id'
    },
    estado: {
      type: DataTypes.VIRTUAL,
      get() {
        const fechaLimite = this.getDataValue('fechaLimite');
        if (!fechaLimite) return 'desconocido';
        const hoy = new Date();
        const hoyY = hoy.getFullYear();
        const hoyM = hoy.getMonth();
        const hoyD = hoy.getDate();
        const lim = new Date(fechaLimite);
        const limY = lim.getFullYear();
        const limM = lim.getMonth();
        const limD = lim.getDate();
        // Si la fecha límite es mayor o igual a hoy, está disponible
        if (
          limY > hoyY ||
          (limY === hoyY && limM > hoyM) ||
          (limY === hoyY && limM === hoyM && limD >= hoyD)
        ) {
          return 'disponible';
        }
        return 'vencida';
      }
    }
  }, {
    tableName: 'actividades',
    timestamps: true,
    indexes: [
      { fields: ['creador_id'] },
      { fields: ['grupo_id'] },
      { fields: ['global'] }
    ],
    hooks: {
      beforeCreate: (actividad) => {
        // Si la fechaLimite viene como string sin hora, ajusta a 00:00:00 local para evitar desfases
        if (typeof actividad.fechaLimite === 'string' && actividad.fechaLimite.length === 10) {
          const [year, month, day] = actividad.fechaLimite.split('-');
          const fecha = new Date();
          fecha.setFullYear(Number(year), Number(month) - 1, Number(day));
          fecha.setHours(0, 0, 0, 0);
          actividad.fechaLimite = fecha;
        }

        // Obtener solo año, mes y día para ambas fechas
        const hoy = new Date();
        const hoyY = hoy.getFullYear();
        const hoyM = hoy.getMonth();
        const hoyD = hoy.getDate();

        let fechaLimite = new Date(actividad.fechaLimite);
        let limY = fechaLimite.getFullYear();
        let limM = fechaLimite.getMonth();
        let limD = fechaLimite.getDate();

        // Log para depuración
        console.log('--- VALIDACIÓN FECHA LIMITE ---');
        console.log('Valor recibido actividad.fechaLimite:', actividad.fechaLimite);
        console.log('Comparando fechaLimite:', limY, limM + 1, limD, 'con hoy:', hoyY, hoyM + 1, hoyD);

        // Comparar solo año, mes y día
        const fechaLimiteNum = limY * 10000 + (limM + 1) * 100 + limD;
        const hoyNum = hoyY * 10000 + (hoyM + 1) * 100 + hoyD;
        if (fechaLimiteNum < hoyNum) {
          console.log('RECHAZADO: fechaLimiteNum', fechaLimiteNum, '< hoyNum', hoyNum);
          throw new Error('La fecha límite no puede ser en el pasado');
        } else {
          console.log('ACEPTADO: fechaLimiteNum', fechaLimiteNum, '>= hoyNum', hoyNum);
        }
      }
    }
  });

  // Asociaciones
  Actividad.associate = (models) => {
    Actividad.belongsTo(models.User, {
      foreignKey: 'creadorId',
      as: 'creador'
    });
    Actividad.belongsTo(models.Grupo, {
      foreignKey: 'grupoId',
      as: 'grupo'
    });
    Actividad.hasMany(models.RespuestaActividad, {
      foreignKey: 'actividadId',
      as: 'respuestas'
    });
  };

  return Actividad;
};
