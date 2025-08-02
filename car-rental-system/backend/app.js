const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

const { testConnection, initializeDatabase } = require('./config/database');

const carsRouter = require('./routes/cars');
const bookingsRouter = require('./routes/bookings');
const returnsRouter = require('./routes/returns');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/cars', carsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/returns', returnsRouter);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Car Rental System API is running',
        timestamp: new Date().toISOString()
    });
});

app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

async function startServer() {
    try {
        const dbConnected = await testConnection();
        
        if (dbConnected) {
            await initializeDatabase();
            
            const PORT = process.env.PORT || 3000;
            app.listen(PORT, () => {
                console.log('🚗 Car Rental System started successfully!');
                console.log(`📱 Frontend: http://localhost:${PORT}`);
                console.log(`🔌 API: http://localhost:${PORT}/api`);
                console.log(`💾 Database: MySQL connected`);
                console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            });
        } else {
            console.error('❌ Failed to connect to database. Please check your MySQL configuration.');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();
