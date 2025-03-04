require('dotenv').config();
const { Sequelize } = require('sequelize');

// Initialize Sequelize with MySQL
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // Disable SQL logs
});

module.exports = sequelize;  // ✅ Export the Sequelize instance
