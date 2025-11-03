module.exports = (sequelize, DataTypes) => {
const Grupo = sequelize.define('Grupo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'grupos',
  timestamps: true
});

Grupo.associate = (models) => {
  // Relación muchos a muchos con User

  Grupo.belongsToMany(models.User, {
    through: 'grupo_usuarios',
    as: 'usuarios',
    foreignKey: 'grupo_id',
    otherKey: 'user_id',
    hooks: true
  });

  // Relación con Grabacion

  Grupo.hasMany(models.Grabacion, {
    foreignKey: 'grupoId',
    as: 'grabaciones',
    onDelete: 'CASCADE',
    hooks: true
  });

  // Relación con Actividad

  Grupo.hasMany(models.Actividad, {
    foreignKey: 'grupoId',
    as: 'actividades',
    onDelete: 'CASCADE',
    hooks: true
  });

};
return Grupo;
};