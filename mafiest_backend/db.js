const { Sequelize } = require('sequelize')
const config = require('./utils/config')

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: console.log,
    })
  : new Sequelize(
      config.DATABASE_CONFIG.database,
      config.DATABASE_CONFIG.username,
      config.DATABASE_CONFIG.password,
      {
        host: config.DATABASE_CONFIG.host,
        dialect: config.DATABASE_CONFIG.dialect,
        port: config.DATABASE_CONFIG.port,
        logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
)

const connectDB = async () => {
  try {
    await sequelize.authenticate()
    console.log('Database connection has been established successfully.')
    
    // Sincronizar modelos con la base de datos
    await sequelize.sync({ force: process.env.NODE_ENV !== 'production' })
    console.log('All models were synchronized successfully.')
  } catch (error) {
    console.error('Unable to connect to the database:', error)
    process.exit(1)
  }
}

module.exports = { sequelize, connectDB }