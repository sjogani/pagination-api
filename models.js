const { DataTypes } = require('sequelize');
const sequelize = require('./database'); // ✅ Import from database.js, NOT config.js



// User Model
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    profile_picture_url: {
        type: DataTypes.STRING,
    }
}, { timestamps: true });

// Feed Model
const Feed = sequelize.define('Feed', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        },
        onDelete: 'CASCADE'
    }
}, { timestamps: true });

// Define Relationships
User.hasMany(Feed, { foreignKey: 'user_id' });
Feed.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { sequelize, User, Feed };
