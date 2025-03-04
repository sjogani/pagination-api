const express = require('express');
const { sequelize, Feed, User } = require('./models');

const app = express();
const PORT = 3000;

app.use(express.json());

// Pagination API Route: GET /api/feed
app.get('/api/feed', async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 10;

        const offset = (page - 1) * limit;

        // Fetch paginated feed data with user details
        const { count, rows } = await Feed.findAndCountAll({
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: User,
                    attributes: ['username', 'profile_picture_url'],
                },
            ],
        });

        // Format response as required
        const formattedPosts = rows.map(feed => ({
            post_id: feed.id,
            content: feed.content,
            created_at: feed.createdAt,
            username: feed.User.username,
            profile_picture_url: feed.User.profile_picture_url,
        }));

        res.json({
            success: true,
            data: {
                posts: formattedPosts,
                pagination: {
                    limit,
                    page,
                    total: count,
                },
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
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
