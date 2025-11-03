module.exports = (sequelize, DataTypes) => {
const Asesoria = sequelize.define('Asesoria', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  horaInicio: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'hora_inicio'
  },
  horaFin: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'hora_fin'
  },
  lugar: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  precio: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  docenteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'docente_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  estudianteId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'estudiante_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'programada', 'cancelada'),
    defaultValue: 'programada'
  }
}, {
  tableName: 'asesorias',
  timestamps: true,
  underscored: true
});

Asesoria.associate = (models) => {
  Asesoria.belongsTo(models.User, {
    foreignKey: 'docenteId',
    targetKey: 'id',
    as: 'docente'
  });
  Asesoria.belongsTo(models.User, {
    foreignKey: 'estudianteId',
    targetKey: 'id',
    as: 'estudiante'
  });
};

return Asesoria;
};
