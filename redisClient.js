const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => console.error('Redis Error:', err));

redisClient.connect().then(() => console.log('Connected to Redis'));

module.exports = redisClient;
