const express = require('express');
const router = express.Router();
const redisClient = require('../redisClient'); // Redis Client
const { Feed, User } = require('../models'); // Import Models

router.get('/feed', async (req, res) => {
    let { limit = 10, page = 1, userId } = req.query;
    limit = parseInt(limit);
    page = parseInt(page);

    if (isNaN(limit) || isNaN(page) || limit <= 0 || page <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid pagination parameters' });
    }

    // Generate Redis Cache Key
    const cacheKey = `feed:${userId || 'all'}:page:${page}:limit:${limit}`;

    try {
        // Check Redis Cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.json({ success: true, data: JSON.parse(cachedData) });
        }

        // Calculate Offset for Pagination
        const offset = (page - 1) * limit;
        const whereCondition = userId ? { user_id: userId } : {}; 

        // Query MySQL with Pagination
        const { count, rows } = await Feed.findAndCountAll({
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            where: whereCondition,
            include: [
                {
                    model: User,
                    attributes: ['username', 'profile_picture_url']
                }
            ]
        });

        // Prepare Response Data
        const responseData = {
            posts: rows.map(feed => ({
                post_id: feed.id,
                content: feed.content,
                created_at: feed.createdAt,
                username: feed.User?.username || 'Unknown',
                profile_picture_url: feed.User?.profile_picture_url || null
            })),
            pagination: {
                limit,
                page,
                total: count
            }
        };

        // Store Response in Redis with TTL (5 minutes)
        await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData));

        return res.json({ success: true, data: responseData });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;
