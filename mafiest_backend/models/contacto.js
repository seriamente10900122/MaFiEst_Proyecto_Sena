module.exports = (sequelize, DataTypes) => {
  const Contacto = sequelize.define('Contacto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    asunto: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'contactos',
    timestamps: true
  });
  return Contacto;
};
