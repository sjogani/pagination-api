const express = require('express');
const { sequelize, Feed, User } = require('./models');
const redis = require('redis');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Setup Redis Client
const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
    },
});

redisClient.on('error', (err) => console.error('Redis Error:', err));

(async () => {
    try {
        await redisClient.connect();
        console.log('✅ Redis Connected Successfully!');
    } catch (err) {
        console.error('❌ Redis Connection Error:', err);
    }
})();

app.use(express.json());

// Pagination API Route: GET /api/feed
app.get('/api/feed', async (req, res) => {
    try {
        console.log('🔹 Received request to /api/feed');

        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 10;

        const offset = (page - 1) * limit;
        const cacheKey = `feed:${page}:${limit}`;

        console.log(`🔹 Checking Redis Cache for key: ${cacheKey}`);

        // Check Redis Cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('✅ Cache Hit:', cacheKey);
            return res.json(JSON.parse(cachedData));
        }

        console.log('❌ Cache Miss:', cacheKey);

        // Fetch paginated feed data
        console.log('🔹 Querying database for feed data...');
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

        console.log(`✅ Database Query Complete. Found ${rows.length} rows.`);

        if (rows.length === 0) {
            console.log('❌ No feed data found.');
            return res.status(404).json({ success: false, message: 'No feed data found' });
        }

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
        console.log('🔹 Storing response in Redis...');
        await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData));

        console.log('✅ Response stored in Redis. Sending response to client.');
        res.json(responseData);
    } catch (error) {
        console.error('❌ Error in /api/feed:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Start Server
app.listen(PORT, async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL Database connected!');
        await sequelize.sync();
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    } catch (error) {
        console.error('❌ Database connection failed:', error);
    }
});
