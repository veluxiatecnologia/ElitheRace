const express = require('express');
const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
            nodeProfilingIntegration(),
        ],
        tracesSampleRate: 1.0,
        profilesSampleRate: 1.0,
    });
}

const app = express();

// Sentry Request Handler must be the first middleware on the app
Sentry.setupExpressErrorHandler(app);

const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = [
    'https://elithe-race.up.railway.app',
    'https://elitherace.com.br',
    'https://www.elitherace.com.br',
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    /\.vercel\.app$/
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Security Headers
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // limit each IP to 300 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

app.use(express.json());

// Initialize Database
// initDb(); // Deprecated: Using Supabase

// Routes
// const authRoutes = require('./routes/authRoutes'); // Deprecated: Client uses Supabase Auth directly
const eventRoutes = require('./routes/eventRoutes');
const peTemplateRoutes = require('./routes/peTemplateRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const checkinRoutes = require('./routes/checkinRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const userRoutes = require('./routes/userRoutes');

// app.use('/api/auth', authRoutes); // Deprecated: Client uses Supabase Auth directly
app.use('/api/events', eventRoutes);
app.use('/api/pe-templates', peTemplateRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.send('Elithe Racing API is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
