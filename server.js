const express = require('express');
const { sequelize, Feed, User } = require('./models');
const redis = require('redis'); // Redis client
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = 3000;

// Setup Redis Client
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
});

redisClient.on('error', (err) => console.error('Redis Error:', err));

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
        const cacheKey = `feed:${page}:${limit}`;

        // Check Redis Cache
        redisClient.get(cacheKey, async (err, cachedData) => {
            if (err) console.error('Redis Error:', err);

            if (cachedData) {
                console.log('Cache Hit:', cacheKey);
                return res.json(JSON.parse(cachedData));
            }

            console.log('Cache Miss:', cacheKey);

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

            const formattedPosts = rows.map(feed => ({
                post_id: feed.id,
                content: feed.content,
                created_at: feed.createdAt,
                username: feed.User.username,
                profile_picture_url: feed.User.profile_picture_url,
            }));

            const responseData = {
                success: true,
                data: {
                    posts: formattedPosts,
                    pagination: {
                        limit,
                        page,
                        total: count,
                    },
                },
            };

            // Store response in Redis (TTL = 300 seconds / 5 min)
            redisClient.setex(cacheKey, 300, JSON.stringify(responseData));

            res.json(responseData);
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
