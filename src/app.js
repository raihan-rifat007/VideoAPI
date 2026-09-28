const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const searchRoutes = require('./routes/search.routes');
const downloadRoutes = require('./routes/download.routes');
const metaRoutes = require('./routes/meta.routes');
const shareRoutes = require('./routes/share.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const max = Number(process.env.RATE_LIMIT_MAX) || 60;
const publicDir = path.join(__dirname, '..', 'public');

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again later.' } } }));

app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok', service: 'VideoAPI', version: '2.1.1', timestamp: new Date().toISOString() } }));
app.use('/api/search', searchRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api', metaRoutes);
app.use(shareRoutes);
app.use(express.static(publicDir, { extensions: ['html'] }));
app.get('/favicon.svg', (req, res) => res.sendFile(path.join(publicDir, 'assets', 'logo.svg')));
app.get('*', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.use(notFound);
app.use(errorHandler);
module.exports = app;
