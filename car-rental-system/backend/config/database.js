const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'car_rental_system',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

async function initializeDatabase() {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS cars (
                id INT PRIMARY KEY AUTO_INCREMENT,
                model VARCHAR(100) NOT NULL,
                type ENUM('economy', 'compact', 'suv', 'luxury') NOT NULL,
                price_per_day DECIMAL(10, 2) NOT NULL,
                available BOOLEAN DEFAULT TRUE,
                image VARCHAR(10) DEFAULT '🚗',
                features JSON,
                year INT,
                color VARCHAR(50),
                fuel_type VARCHAR(50),
                license_plate VARCHAR(20) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS customers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                license_number VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email)
            )
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                car_id INT NOT NULL,
                customer_id INT NOT NULL,
                pickup_date DATE NOT NULL,
                return_date DATE NOT NULL,
                days INT NOT NULL,
                total_cost DECIMAL(10, 2) NOT NULL,
                status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
                booking_date DATE NOT NULL,
                additional_charges DECIMAL(10, 2) DEFAULT 0,
                return_condition ENUM('excellent', 'good', 'fair', 'poor') NULL,
                return_notes TEXT NULL,
                actual_return_date DATE NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (car_id) REFERENCES cars(id),
                FOREIGN KEY (customer_id) REFERENCES customers(id),
                INDEX idx_status (status),
                INDEX idx_dates (pickup_date, return_date)
            )
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS returns (
                id INT PRIMARY KEY AUTO_INCREMENT,
                booking_id INT NOT NULL,
                return_date DATE NOT NULL,
                return_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                condition_rating ENUM('excellent', 'good', 'fair', 'poor') NOT NULL,
                notes TEXT,
                mileage INT,
                fuel_level INT,
                damages JSON,
                additional_charges DECIMAL(10, 2) DEFAULT 0,
                total_amount DECIMAL(10, 2) NOT NULL,
                processed_by VARCHAR(100) DEFAULT 'System',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id),
                INDEX idx_return_date (return_date)
            )
        `);

        console.log('✅ Database tables initialized successfully');
        await insertSampleData();
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        throw error;
    }
}

async function insertSampleData() {
    try {
        const [rows] = await pool.execute('SELECT COUNT(*) as count FROM cars');
        
        if (rows[0].count === 0) {
            console.log('📝 Inserting sample car data...');
            
            const sampleCars = [
                {
                    model: 'Toyota Camry',
                    type: 'economy',
                    price_per_day: 45.00,
                    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
                    features: JSON.stringify(['AC', 'Automatic', '4 Seats']),
                    year: 2023,
                    color: 'Silver',
                    fuel_type: 'Gasoline',
                    license_plate: 'ABC-123'
                },
                {
                    model: 'Honda Civic',
                    type: 'compact',
                    price_per_day: 40.00,
                    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
                    features: JSON.stringify(['AC', 'Manual', '5 Seats']),
                    year: 2022,
                    color: 'Blue',
                    fuel_type: 'Gasoline',
                    license_plate: 'DEF-456'
                },
                {
                    model: 'Ford Explorer',
                    type: 'suv',
                    price_per_day: 75.00,
                    available: false,
                    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
                    features: JSON.stringify(['AC', 'Automatic', '7 Seats', '4WD']),
                    year: 2023,
                    color: 'Black',
                    fuel_type: 'Gasoline',
                    license_plate: 'GHI-789'
                },
                {
                    model: 'BMW 3 Series',
                    type: 'luxury',
                    price_per_day: 120.00,
                    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
                    features: JSON.stringify(['AC', 'Automatic', '4 Seats', 'Leather', 'GPS']),
                    year: 2024,
                    color: 'White',
                    fuel_type: 'Gasoline',
                    license_plate: 'JKL-012'
                },
                {
                    model: 'Chevrolet Tahoe',
                    type: 'suv',
                    price_per_day: 85.00,
                    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
                    features: JSON.stringify(['AC', 'Automatic', '8 Seats', '4WD']),
                    year: 2023,
                    color: 'Gray',
                    fuel_type: 'Gasoline',
                    license_plate: 'MNO-345'
                },
                {
                    model: 'Mercedes C-Class',
                    type: 'luxury',
                    price_per_day: 140.00,
                    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
                    features: JSON.stringify(['AC', 'Automatic', '4 Seats', 'Leather', 'GPS', 'Premium Sound']),
                    year: 2024,
                    color: 'Black',
                    fuel_type: 'Gasoline',
                    license_plate: 'PQR-678'
                }
            ];

            for (const car of sampleCars) {
                await pool.execute(`
                    INSERT INTO cars (model, type, price_per_day, available, image, features, year, color, fuel_type, license_plate)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    car.model, car.type, car.price_per_day, car.available ?? true, 
                    car.image, car.features, car.year, car.color, car.fuel_type, car.license_plate
                ]);
            }
            
            console.log('✅ Sample car data inserted successfully');
        }
    } catch (error) {
        console.error('❌ Error inserting sample data:', error.message);
    }
}

module.exports = {
    pool,
    testConnection,
    initializeDatabase
};