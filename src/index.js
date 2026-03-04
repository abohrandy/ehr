const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

// ── Security Middleware ──
app.use(helmet({
    contentSecurityPolicy: false, // Relaxed for SPA frontend
}));
app.use(cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting ──
app.use(generalLimiter);

// ── Body Parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request Logging ──
app.use(morgan('combined'));

// ── Serve Frontend Static Files ──
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Ensure upload directory exists ──
const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ── Health Check ──
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'ok',
            service: 'Futurology EHR API',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        },
    });
});

// ── API Routes ──
app.use('/api', routes);

// ── 404 Handler ──
app.use((req, res) => {
    // API routes get JSON error
    if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            error: `Route ${req.method} ${req.originalUrl} not found.`,
        });
    }
    // SPA fallback — serve index.html for client-side routing
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});


// ── Global Error Handler ──
app.use(errorHandler);

// ── Start Server ──
const PORT = config.port;

app.listen(PORT, () => {
    console.log(`\n🏥  Futurology EHR API Server`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   Port:        ${PORT}`);
    console.log(`   Health:      http://localhost:${PORT}/api/health`);
    console.log(`   API Base:    http://localhost:${PORT}/api\n`);
});

module.exports = app;
