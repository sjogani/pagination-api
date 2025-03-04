const cron = require('node-cron');
const { sequelize, Feed, User } = require('./models');
const redisClient = require('./redisClient'); // Create a separate Redis client file if needed

// Function to prefetch popular feed pages
async function prefetchFeedData() {
    console.log('🔄 Running prefetchFeedData job...');

    try {
        const page = 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const cacheKey = `feed:${page}:${limit}`;

        // Fetch latest feed data
        const { count, rows } = await Feed.findAndCountAll({
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            include: [{ model: User, attributes: ['username', 'profile_picture_url'] }],
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
            data: { posts: formattedPosts, pagination: { limit, page, total: count } },
        };

        // Store in Redis (TTL = 300s / 5 min)
        redisClient.setex(cacheKey, 300, JSON.stringify(responseData));
        console.log('✅ Cached fresh feed data:', cacheKey);
    } catch (error) {
        console.error('❌ Error in prefetchFeedData:', error);
    }
}

// Function to clear old cache entries
async function clearOldCache() {
    console.log('🗑 Running cache cleanup job...');

    try {
        redisClient.flushdb((err, success) => {
            if (err) console.error('❌ Redis Cleanup Error:', err);
            if (success) console.log('✅ Redis cache cleared!');
        });
    } catch (error) {
        console.error('❌ Error in clearOldCache:', error);
    }
}

// Schedule the cron jobs
cron.schedule('*/10 * * * *', prefetchFeedData); // Every 10 minutes
cron.schedule('0 3 * * *', clearOldCache); // Every day at 3 AM

module.exports = { prefetchFeedData, clearOldCache };
