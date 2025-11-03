module.exports = (sequelize, DataTypes) => {
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  nombre: {  // Cambiado de name a nombre para mantener consistencia
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Debe ser un correo electrónico válido'
      }
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM('independiente', 'estudiante', 'docente', 'administrador'),
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    {
      fields: ['rol']
    }
  ]
});

User.associate = (models) => {
  // Asociación con asesorias_usuarios
  User.hasMany(models.AsesoriasUsuarios, {
    foreignKey: 'userId',
    as: 'asesoriasUsuarios'
  });
  // Relación muchos a muchos con Grupo
  User.belongsToMany(models.Grupo, {
    through: 'grupo_usuarios',
    as: 'grupos',
    foreignKey: 'user_id',
    otherKey: 'grupo_id'
  });

  // Relación con Actividad (creador)
  User.hasMany(models.Actividad, {
    foreignKey: 'creadorId',
    as: 'actividades'
  });

  // Relación con Grabacion
  User.hasMany(models.Grabacion, {
    foreignKey: 'userId',
    as: 'grabaciones'
  });


  // Relación con Asesoria (como docente)
  User.hasMany(models.Asesoria, {
    foreignKey: 'docenteId',
    as: 'asesoriasImpartidas'
  });

  // Relación muchos a muchos con Asesoria (solicitadas)
  User.belongsToMany(models.Asesoria, {
    through: models.AsesoriasUsuarios,
    as: 'asesoriasSolicitadas',
    foreignKey: 'userId',
    otherKey: 'asesoriaId'
  });

  // Relación con RespuestaActividad
  User.hasMany(models.RespuestaActividad, {
    foreignKey: 'userId',
    as: 'respuestasActividades'
  });
};
return User;
};