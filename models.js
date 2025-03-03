const { DataTypes } = require('sequelize');
const sequelize = require('./config');  // Import database connection

const Feed = sequelize.define('Feed', {
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, { timestamps: true });

module.exports = { sequelize, Feed };
