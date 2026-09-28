const router = require('express').Router();
const { downloadYoutube, proxyYoutubeMedia } = require('../controllers/download.controller');
router.get('/youtube', downloadYoutube);
router.get('/youtube/audio', downloadYoutube);
router.get('/youtube/video', downloadYoutube);
router.get('/youtube/file', proxyYoutubeMedia);
module.exports = router;
