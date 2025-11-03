module.exports = (sequelize, DataTypes) => {
const Grabacion = sequelize.define('Grabacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  driveLink: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  grupoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'grupos',
      key: 'id'
    }
  },
  tipo: {
    type: DataTypes.ENUM('general', 'grupal'),
    allowNull: false,
    defaultValue: 'general'
  }
}, {
  tableName: 'grabaciones',
  timestamps: true
});

Grabacion.associate = (models) => {
  Grabacion.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'usuario'
  });
  Grabacion.belongsTo(models.Grupo, {
    foreignKey: 'grupoId',
    as: 'grupo'
  });
};
return Grabacion;
};
