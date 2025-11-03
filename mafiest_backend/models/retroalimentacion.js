// models/retroalimentacion.js
module.exports = (sequelize, DataTypes) => {
  const Retroalimentacion = sequelize.define('Retroalimentacion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    respuestaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'respuesta_id',
      references: {
        model: 'respuestas_actividad',
        key: 'id'
      }
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'usuario_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    retroalimentacion: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    nota: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 1, max: 5 }
    }
  }, {
    tableName: 'retroalimentaciones',
    timestamps: true
  });

  Retroalimentacion.associate = (models) => {
    Retroalimentacion.belongsTo(models.RespuestaActividad, {
      foreignKey: 'respuestaId',
      as: 'respuesta'
    });
    Retroalimentacion.belongsTo(models.User, {
      foreignKey: 'usuarioId',
      as: 'usuario'
    });
  };

  return Retroalimentacion;
};
