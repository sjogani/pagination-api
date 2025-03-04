const { DataTypes } = require('sequelize');
const sequelize = require('./config');

// User Model
const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    profile_picture_url: {
        type: DataTypes.STRING,
    },
}, { timestamps: true });

// Feed Model
const Feed = sequelize.define('Feed', {
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, { timestamps: true });

// Define Relationships
User.hasMany(Feed, { foreignKey: 'user_id' });
Feed.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { sequelize, User, Feed };
