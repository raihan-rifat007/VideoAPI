const yts = require('yt-search');
const asyncHandler = require('../utils/asyncHandler');

const MAX_LIMIT = 10;

function normalizeVideo(video, index = 0) {
  return {
    index: index + 1,
    videoId: video.videoId,
    title: video.title,
    url: video.url,
    duration: video.timestamp || video.duration?.timestamp || null,
    seconds: video.seconds || video.duration?.seconds || null,
    views: Number(video.views || 0),
    author: video.author?.name || null,
    thumbnail: video.thumbnail || null,
    uploaded: video.ago || null
  };
}

async function search(query, limit) {
  const result = await yts(query);
  return result.videos.slice(0, limit).map(normalizeVideo);
}

const searchYoutube = asyncHandler(async (req, res) => {
  const query = String(req.query.q || '').trim();
  const requestedLimit = Number(req.query.limit || 10);
  if (!query) return res.status(400).json({ success: false, error: { code: 'MISSING_QUERY', message: 'Query parameter "q" is required.' } });
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > MAX_LIMIT) return res.status(400).json({ success: false, error: { code: 'INVALID_LIMIT', message: `Limit must be between 1 and ${MAX_LIMIT}.` } });
  const videos = await search(query, requestedLimit);
  res.json({ success: true, data: { query, count: videos.length, results: videos } });
});

const searchYoutubeAudio = asyncHandler(async (req, res) => {
  const query = String(req.query.q || '').trim();
  const requestedLimit = Number(req.query.limit || 10);
  if (!query) return res.status(400).json({ success: false, error: { code: 'MISSING_QUERY', message: 'Query parameter "q" is required.' } });
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > MAX_LIMIT) return res.status(400).json({ success: false, error: { code: 'INVALID_LIMIT', message: `Limit must be between 1 and ${MAX_LIMIT}.` } });
  const videos = await search(query, requestedLimit);
  res.json({ success: true, data: { query, mode: 'audio', count: videos.length, results: videos } });
});

const getYoutubeVideo = asyncHandler(async (req, res) => {
  const videoId = String(req.params.videoId || '').trim();
  if (!videoId) return res.status(400).json({ success: false, error: { code: 'MISSING_VIDEO_ID', message: 'Video ID is required.' } });
  const video = await yts({ videoId });
  res.json({ success: true, data: normalizeVideo(video) });
});

module.exports = { searchYoutube, searchYoutubeAudio, getYoutubeVideo };
