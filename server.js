const express = require('express');
const { sequelize, Feed } = require('./models');  // Import database & model

const app = express();
const PORT = 3000;

app.use(express.json());  // Middleware to parse JSON

// Pagination API Route: GET /api/feed
app.get('/api/feed', async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 10;

        const offset = (page - 1) * limit;

        // Fetch paginated data from MySQL
        const { count, rows } = await Feed.findAndCountAll({
            limit,
            offset,
            order: [['createdAt', 'DESC']], // Sort by newest first
        });

        res.json({
            totalRecords: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            perPage: limit,
            data: rows,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start Server
app.listen(PORT, async () => {
    try {
        await sequelize.authenticate();
        console.log('MySQL Database connected!');
        await sequelize.sync(); // Sync tables
        console.log(`Server is running on http://localhost:${PORT}`);
    } catch (error) {
        console.error('Database connection failed:', error);
    }
});
