const cron = require('node-cron');
const redis = require('redis');
const { Feed, User } = require('./models');

const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
});

redisClient.on('error', (err) => console.error('Redis Error in Cron Jobs:', err));
redisClient.on('connect', () => console.log('✅ Redis Connected for Cron Jobs!'));

// Ensure Redis client is connected properly
(async () => {
    await redisClient.connect();
})();

// 🕒 Cron Job: Prefetch feed data every 10 minutes
cron.schedule('*/10 * * * *', async () => {
    console.log('🔄 [Cron] Prefetching feed data...');

    try {
        const page = 1; // Prefetch only the first page
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
            data: {
                posts: formattedPosts,
                pagination: { limit, page, total: count },
            },
        };

        // ✅ FIX: Use `setEx` instead of `setex`
        await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData));

        console.log(`✅ [Cron] Prefetched and cached feed:${page}:${limit}`);
    } catch (error) {
        console.error('❌ [Cron] Error prefetching feed data:', error);
    }
});

// 🗑️ Cron Job: Clear old cache every day at 3 AM
cron.schedule('0 3 * * *', async () => {
    console.log('🗑️ [Cron] Clearing old cache...');

    try {
        // Flush all Redis cache (Careful! This clears everything)
        await redisClient.flushAll();
        console.log('✅ [Cron] Cache cleared successfully!');
    } catch (error) {
        console.error('❌ [Cron] Error while clearing cache:', error);
    }
});

console.log('✅ Cron Jobs Initialized!');
