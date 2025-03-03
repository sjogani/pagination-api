const { Sequelize } = require('sequelize');
require('dotenv').config();  // Load environment variables

// Initialize Sequelize with PostgreSQL
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false, // Disable logging SQL queries
});

module.exports = sequelize;
