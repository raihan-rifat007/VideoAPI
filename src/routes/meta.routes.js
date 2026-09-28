const router = require('express').Router();
const path = require('path');
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'VideoAPI',
      version: '2.1.1',
      baseUrl: `${req.protocol}://${req.get('host')}`,
      endpoints: [
        { method: 'GET', path: '/api/health', description: 'Health status' },
        { method: 'GET', path: '/api/search/youtube?q=QUERY&limit=10', description: 'Search YouTube videos' },
        { method: 'GET', path: '/api/search/youtube/audio?q=QUERY&limit=10', description: 'Audio-focused YouTube search' },
        { method: 'GET', path: '/api/search/youtube/video/VIDEO_ID', description: 'Get video metadata' },
        { method: 'GET', path: '/api/download/youtube?url=YOUTUBE_URL', description: 'Resolve YouTube media formats' },
        { method: 'GET', path: '/og.png', description: 'Open Graph preview image' }
      ]
    }
  });
});
module.exports = router;
