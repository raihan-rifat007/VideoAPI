const router = require('express').Router();
const { searchYoutube, searchYoutubeAudio, getYoutubeVideo } = require('../controllers/search.controller');
router.get('/youtube', searchYoutube);
router.get('/youtube/audio', searchYoutubeAudio);
router.get('/youtube/video/:videoId', getYoutubeVideo);
module.exports = router;
