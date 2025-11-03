const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AsesoriasUsuarios = sequelize.define('asesorias_usuarios', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    asesoriaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'asesoria_id',
      references: {
        model: 'asesorias',
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
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    tableName: 'asesorias_usuarios',
    timestamps: true,
    underscored: true
  });

  AsesoriasUsuarios.associate = (models) => {
    AsesoriasUsuarios.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return AsesoriasUsuarios;
};
