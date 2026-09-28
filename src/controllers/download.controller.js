const btch = require('btch-downloader');
const asyncHandler = require('../utils/asyncHandler');

let youtubeiPromise = null;

function youtubeTarget(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return `https://www.youtube.com/watch?v=${raw}`;
  try {
    const parsed = new URL(raw);
    const validHost = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'music.youtube.com'].includes(parsed.hostname);
    if (!validHost) return null;
    return raw;
  } catch {
    return null;
  }
}

function videoIdFromTarget(target) {
  const parsed = new URL(target);
  if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1).split('/')[0];
  return parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop();
}

function absoluteUrl(value) {
  if (typeof value !== 'string') return null;
  return /^https?:\/\
}

function normalizeBtch(result) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return null;
  if (result.status === false || typeof result.error === 'string') return null;
  const formats = [];
  const push = (url, type, quality, label, ext) => {
    const direct = absoluteUrl(url);
    if (!direct) return;
    if (formats.some(item => item.url === direct)) return;
    formats.push({ url: direct, type, quality: quality || null, label: label || quality || type, ext: ext || (type === 'audio' ? 'mp3' : 'mp4') });
  };

  if (Array.isArray(result.mp4)) result.mp4.forEach((item, index) => {
    if (typeof item === 'string') push(item, 'video', null, `MP4 ${index + 1}`, 'mp4');
    else if (item && typeof item === 'object') push(item.url || item.download || item.link, 'video', item.quality || item.qualityLabel, item.qualityLabel || item.quality || `MP4 ${index + 1}`, 'mp4');
  });
  else if (result.mp4 && typeof result.mp4 === 'object') Object.entries(result.mp4).forEach(([key, value]) => {
    if (typeof value === 'string') push(value, 'video', key, key, 'mp4');
    else if (value && typeof value === 'object') push(value.url || value.download || value.link, 'video', value.quality || key, value.qualityLabel || value.quality || key, 'mp4');
  });
  else push(result.mp4, 'video', null, 'MP4', 'mp4');

  if (Array.isArray(result.mp3)) result.mp3.forEach((item, index) => {
    if (typeof item === 'string') push(item, 'audio', null, `Audio ${index + 1}`, 'mp3');
    else if (item && typeof item === 'object') push(item.url || item.download || item.link, 'audio', item.quality || item.bitrate, item.quality || item.bitrate || `Audio ${index + 1}`, item.ext || 'mp3');
  });
  else if (result.mp3 && typeof result.mp3 === 'object') Object.entries(result.mp3).forEach(([key, value]) => {
    if (typeof value === 'string') push(value, 'audio', key, key, 'mp3');
    else if (value && typeof value === 'object') push(value.url || value.download || value.link, 'audio', value.quality || key, value.quality || key, value.ext || 'mp3');
  });
  else push(result.mp3, 'audio', null, 'Audio', 'mp3');

  if (!formats.length) return null;
  return { title: result.title || null, thumbnail: result.thumbnail || null, author: result.author || null, formats };
}

async function getYoutubei() {
  if (!youtubeiPromise) youtubeiPromise = import('youtubei.js').then(mod => mod.Innertube.create());
  return youtubeiPromise;
}

async function resolveWithYoutubeJs(target) {
  const innertube = await getYoutubei();
  const videoId = videoIdFromTarget(target);
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) throw new Error('Invalid YouTube video id.');
  const info = await innertube.getInfo(videoId);
  const streaming = info.streaming_data;
  if (!streaming) throw new Error('YouTube did not return streaming formats for this video.');

  const formats = [];
  const seen = new Set();
  const addFormat = async (format, type) => {
    if (!format) return;
    const mime = String(format.mime_type || format.mimeType || '');
    const ext = /video\/mp4/i.test(mime) ? 'mp4' : /audio\/mp4/i.test(mime) ? 'm4a' : /audio\
    let url = absoluteUrl(format.url);
    if (!url && typeof format.decipher === 'function') {
      try {
        url = await format.decipher(innertube.session.player);
      } catch {
        return;
      }
    }
    if (!url || seen.has(url)) return;
    seen.add(url);
    const quality = format.quality_label || format.quality || format.audio_quality || null;
    const bitrate = format.bitrate || format.average_bitrate || format.audio_bitrate || null;
    const label = type === 'audio' ? `${quality || 'Audio'}${bitrate ? ` · ${Math.round(Number(bitrate) / 1000)} kbps` : ''}` : quality || 'MP4';
    formats.push({ url, type, quality, label, ext, itag: format.itag || null, hasAudio: Boolean(format.has_audio), hasVideo: Boolean(format.has_video) });
  };

  const progressive = Array.isArray(streaming.formats) ? streaming.formats : [];
  const adaptive = Array.isArray(streaming.adaptive_formats) ? streaming.adaptive_formats : [];
  for (const format of progressive) {
    const mime = String(format.mime_type || format.mimeType || '');
    if (format.has_audio !== false && format.has_video !== false && /video\/mp4/i.test(mime)) await addFormat(format, 'video');
  }
  for (const format of adaptive) {
    const mime = String(format.mime_type || format.mimeType || '');
    if (format.has_audio && /audio\
  }

  if (!formats.length) throw new Error('No downloadable YouTube formats were returned.');

  const videoFormats = formats.filter(item => item.type === 'video');
  const audioFormats = formats.filter(item => item.type === 'audio');
  videoFormats.sort((a, b) => (Number.parseInt(String(b.quality || '').replace(/\D/g, ''), 10) || 0) - (Number.parseInt(String(a.quality || '').replace(/\D/g, ''), 10) || 0));
  audioFormats.sort((a, b) => (Number.parseInt(String(b.quality || '').replace(/\D/g, ''), 10) || 0) - (Number.parseInt(String(a.quality || '').replace(/\D/g, ''), 10) || 0));

  return {
    title: info.basic_info?.title || info.video_details?.title || null,
    thumbnail: info.basic_info?.thumbnail?.[0]?.url || info.video_details?.thumbnails?.at?.(-1)?.url || null,
    author: info.basic_info?.author || info.video_details?.author || null,
    formats: [...videoFormats, ...audioFormats]
  };
}

function isAllowedMediaHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return host === 'googlevideo.com' || host.endsWith('.googlevideo.com') || host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtube-nocookie.com' || host.endsWith('.youtube-nocookie.com');
}

const proxyYoutubeMedia = asyncHandler(async (req, res) => {
  const source = String(req.query.source || '').trim();
  const filename = String(req.query.filename || 'video').replace(/[\\/:*?"<>|\r\n]+/g, '_').slice(0, 120) || 'video';
  const ext = String(req.query.ext || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
  if (!source) return res.status(400).json({ success: false, error: { code: 'MISSING_SOURCE', message: 'Media source is required.' } });

  let parsed;
  try {
    parsed = new URL(source);
  } catch {
    return res.status(400).json({ success: false, error: { code: 'INVALID_SOURCE', message: 'Invalid media source.' } });
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || !isAllowedMediaHost(parsed.hostname)) {
    return res.status(403).json({ success: false, error: { code: 'SOURCE_NOT_ALLOWED', message: 'The requested media source is not allowed.' } });
  }

  const headers = { 'user-agent': 'Mozilla/5.0', accept: '*/*' };
  if (req.headers.range) headers.range = req.headers.range;
  const upstream = await fetch(source, { headers, redirect: 'follow' });
  if (!upstream.ok && upstream.status !== 206) {
    return res.status(502).json({ success: false, error: { code: 'MEDIA_FETCH_FAILED', message: `Upstream media server returned ${upstream.status}.` } });
  }

  res.status(upstream.status);
  const contentType = upstream.headers.get('content-type');
  const contentLength = upstream.headers.get('content-length');
  const contentRange = upstream.headers.get('content-range');
  const acceptRanges = upstream.headers.get('accept-ranges');
  if (contentType) res.setHeader('content-type', contentType);
  if (contentLength) res.setHeader('content-length', contentLength);
  if (contentRange) res.setHeader('content-range', contentRange);
  if (acceptRanges) res.setHeader('accept-ranges', acceptRanges);
  res.setHeader('content-disposition', `attachment; filename="${filename}.${ext}"`);
  res.setHeader('cache-control', 'no-store');
  if (!upstream.body) return res.end();
  const reader = upstream.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (error) {
    if (!res.headersSent) return res.status(502).json({ success: false, error: { code: 'MEDIA_STREAM_FAILED', message: 'Media stream failed.' } });
    res.destroy(error);
  }
});

const downloadYoutube = asyncHandler(async (req, res) => {
  const target = youtubeTarget(req.query.url || req.query.videoId);
  if (!target) return res.status(400).json({ success: false, error: { code: 'INVALID_YOUTUBE_TARGET', message: 'Provide a valid YouTube URL or 11-character videoId.' } });

  let resolved = null;
  let upstreamError = null;
  if (typeof btch.youtube === 'function') {
    try {
      resolved = normalizeBtch(await btch.youtube(target));
    } catch (error) {
      upstreamError = error;
    }
  }

  if (!resolved) {
    try {
      resolved = await resolveWithYoutubeJs(target);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown resolver error';
      return res.status(502).json({ success: false, error: { code: 'DOWNLOAD_RESOLUTION_FAILED', message, upstream: upstreamError ? String(upstreamError.message || upstreamError) : undefined } });
    }
  }

  const formats = resolved.formats.map((item, index) => ({
    id: `${item.type}-${item.itag || index + 1}`,
    type: item.type,
    quality: item.quality,
    label: item.label,
    ext: item.ext,
    url: item.url,
    downloadUrl: `/api/download/youtube/file?source=${encodeURIComponent(item.url)}&filename=${encodeURIComponent(resolved.title || 'video')}&ext=${encodeURIComponent(item.ext || 'mp4')}`
  }));

  res.json({ success: true, data: {
    title: resolved.title,
    thumbnail: resolved.thumbnail,
    author: resolved.author,
    formats,
    mp4: formats.filter(item => item.type === 'video'),
    mp3: formats.filter(item => item.type === 'audio')
  } });
});

module.exports = { downloadYoutube, proxyYoutubeMedia };
