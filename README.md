# VideoAPI

VideoAPI is a focused YouTube search and media-resolution service with a premium liquid-glass web interface. It exposes a small REST surface for search, metadata, media resolution, health checks and machine-readable documentation.

## Features

- YouTube video search with up to 10 results
- Audio-focused YouTube search workflow
- YouTube metadata lookup by video ID
- YouTube URL or video ID media resolution
- Dedicated Video and Audio workspaces
- Animated page transitions, staggered result reveals and shimmer skeletons
- Reduced-motion accessibility support
- Single-file frontend at `public/index.html`
- Liquid blur glass visual system
- Responsive mobile navigation
- Skeleton loading states
- Smooth page and interaction transitions
- Bootstrap Icons
- Custom VideoAPI SVG logo and favicon
- 1200×630 Open Graph preview image
- Crawler-friendly `/share` route with Open Graph and Twitter metadata
- JSON API documentation at `/api/docs`
- CORS support
- Configurable rate limiting
- Vercel-ready deployment structure
- Centralized error handling
- No database required

## Architecture

```text
VideoAPI/
├── api/
│   └── index.js
├── public/
│   ├── assets/
│   │   └── logo.svg
│   ├── index.html
│   └── og.png
├── src/
│   ├── controllers/
│   │   ├── download.controller.js
│   │   └── search.controller.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   ├── routes/
│   │   ├── download.routes.js
│   │   ├── meta.routes.js
│   │   ├── search.routes.js
│   │   └── share.routes.js
│   ├── utils/
│   │   └── asyncHandler.js
│   ├── app.js
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
├── vercel.json
└── README.md
```

## Requirements

- Node.js 18 or newer
- npm

## Installation

```bash
npm install
npm start
```

Development:

```bash
npm run dev
```

The local application runs on `http://localhost:3000` by default.

## Environment

Copy `.env.example` to `.env` when running locally.

| Variable | Default | Description |
|---|---:|---|
| `PORT` | `3000` | Local HTTP port |
| `NODE_ENV` | `production` | Runtime environment |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window |
| `RATE_LIMIT_MAX` | `60` | Requests allowed per window |

## Web Interface

The frontend is intentionally contained in one file:

```text
public/index.html
```

It contains the markup, CSS and JavaScript for all workspaces.

### Video

Search YouTube and select one of up to ten results. The selected video is sent to the media resolver and returned formats are displayed as actionable links.

### Audio

Search the same YouTube index through an audio-focused endpoint. The UI prioritizes resolver fields that look like audio formats while retaining a fallback to all returned media URLs.

### Media resolution

Selecting a result on either the Video or Audio page calls the YouTube resolver. The UI displays media URLs returned by the upstream resolver. Resolver availability, expiry and format coverage can change upstream.

### API docs

The browser UI is intentionally focused on Video and Audio. Machine-readable API documentation remains available at `/api/docs`.

## API Reference

### Health

```http
GET /api/health
```

Returns service status and version.

### YouTube Search

```http
GET /api/search/youtube?q=starboy&limit=10
```

`limit` accepts 1 through 10.

### YouTube Audio Search

```http
GET /api/search/youtube/audio?q=starboy&limit=10
```

Returns YouTube search results with `mode: "audio"` in the response.

### Video Metadata

```http
GET /api/search/youtube/video/VIDEO_ID
```

Returns title, URL, duration, views, author, thumbnail and description when available.

### Media Resolution

```http
GET /api/download/youtube?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DVIDEO_ID
```

A video ID can also be passed:

```http
GET /api/download/youtube?videoId=VIDEO_ID
```

The endpoint validates that the supplied target belongs to a supported YouTube host before passing it to the configured upstream YouTube resolver.

### Audio Alias

```http
GET /api/download/youtube/audio?url=YOUTUBE_URL
```

### Video Alias

```http
GET /api/download/youtube/video?url=YOUTUBE_URL
```

The audio and video routes are aliases around the YouTube resolver. The upstream response is not rewritten into a fixed format schema because providers may return different structures over time.

### Machine-readable Docs

```http
GET /api/docs
```

### Open Graph Image

```http
GET /og.png
```

The included image is 1200×630 and is suitable for Open Graph and Twitter card metadata.

### Share Preview

```text
/share?title=Starboy%20%E2%80%94%20The%20Weeknd
```

This route returns the application shell with crawler-friendly Open Graph, Twitter and canonical metadata. It is useful when a generated share URL needs a preview card before the visitor enters the app.

## Response Model

Successful responses follow:

```json
{
  "success": true,
  "data": {}
}
```

Errors follow:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

## GoatBot Integration

A Messenger bot can call the search endpoint, display the ten results and keep the selected `videoId` in its reply state.

Example:

```text
.yt Starboy
```

Bot flow:

```text
GET /api/search/youtube?q=Starboy&limit=10
        ↓
Display 1–10
        ↓
User replies with 3
        ↓
Read result[2].videoId
        ↓
GET /api/download/youtube?videoId=...
        ↓
Send or expose a returned media URL
```

## Deployment on Vercel

The project contains `vercel.json` and an `api/index.js` serverless entry point.

```bash
npm install
vercel
```

For production, configure environment variables in the deployment dashboard rather than committing `.env` files.

## Resolver Notes

VideoAPI uses `btch-downloader` for YouTube media resolution. The upstream resolver controls which formats, URLs and metadata are returned. Media URLs may expire, become unavailable, or change structure without a VideoAPI release.

The application deliberately keeps the resolver isolated inside `src/controllers/download.controller.js`, making it possible to replace the upstream implementation without rewriting the UI or search layer.

## Search Notes

Search uses `yt-search`. Search availability and returned metadata depend on YouTube and the package implementation at runtime.

## Security and Operations

- Express fingerprinting is disabled.
- JSON and URL-encoded body sizes are capped.
- Global rate limiting is enabled.
- YouTube targets are host-validated before resolver calls.
- CORS is enabled for API integrations.
- No credentials or API keys are stored in the repository.
- Upstream media URLs are presented as returned and are not silently persisted by VideoAPI.

## UI System

The interface uses a single-page shell with hash-based workspaces:

```text
#video
#audio
#download
#docs
```

The visual layer uses translucent panels, backdrop blur, restrained borders, gradient highlights, skeleton loading, responsive breakpoints and reduced visual noise. Bootstrap Icons are loaded from jsDelivr at runtime.

## Logo and OG Assets

- `public/assets/logo.svg` is the custom VideoAPI mark used by the navbar and favicon.
- `public/og.png` is the 1200×630 share-preview asset.
- Social metadata is defined in `public/index.html` and can be customized through the `/share` route.

## License

MIT


## UI motion

The single-file frontend uses CSS-driven entrance transitions, staggered result cards, interactive focus states, shimmer skeletons, button press feedback, ambient background motion and `prefers-reduced-motion` support. No frontend build step is required.


## Download fix

YouTube resolution now uses the existing `btch-downloader` path first and falls back to `youtubei.js` when no usable media formats are returned. Resolved media is exposed through a server-side proxy endpoint so generated Google Video URLs are fetched from the same Render instance that resolved them.

The browser download endpoint is `GET /api/download/youtube/file?source=MEDIA_URL&filename=NAME&ext=mp4`. Only YouTube and Google Video hosts are accepted by the proxy.
