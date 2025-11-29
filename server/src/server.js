const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// const { initDb } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://elitherace.com',
    'https://www.elitherace.com'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
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
