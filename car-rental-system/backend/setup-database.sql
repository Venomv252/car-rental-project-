CREATE DATABASE IF NOT EXISTS car_rental_system;
USE car_rental_system;

CREATE TABLE IF NOT EXISTS cars (
    id INT PRIMARY KEY AUTO_INCREMENT,
    model VARCHAR(100) NOT NULL,
    type ENUM('economy', 'compact', 'suv', 'luxury') NOT NULL,
    price_per_day DECIMAL(10, 2) NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    image VARCHAR(500) DEFAULT 'https://via.placeholder.com/300x200/cccccc/666666?text=Car+Image',
    features JSON,
    year INT,
    color VARCHAR(50),
    fuel_type VARCHAR(50),
    license_plate VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    license_number VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

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
);

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
);

INSERT INTO cars (model, type, price_per_day, available, image, features, year, color, fuel_type, license_plate) VALUES
('Toyota Camry', 'economy', 45.00, TRUE, 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80', '["AC", "Automatic", "4 Seats"]', 2023, 'Silver', 'Gasoline', 'ABC-123'),
('Honda Civic', 'compact', 40.00, TRUE, 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80', '["AC", "Manual", "5 Seats"]', 2022, 'Blue', 'Gasoline', 'DEF-456'),
('Ford Explorer', 'suv', 75.00, FALSE, 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80', '["AC", "Automatic", "7 Seats", "4WD"]', 2023, 'Black', 'Gasoline', 'GHI-789'),
('BMW 3 Series', 'luxury', 120.00, TRUE, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80', '["AC", "Automatic", "4 Seats", "Leather", "GPS"]', 2024, 'White', 'Gasoline', 'JKL-012'),
('Chevrolet Tahoe', 'suv', 85.00, TRUE, 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80', '["AC", "Automatic", "8 Seats", "4WD"]', 2023, 'Gray', 'Gasoline', 'MNO-345'),
('Mercedes C-Class', 'luxury', 140.00, TRUE, 'https://images.unsplash.com/photo-1563720223185-11003d516935?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80', '["AC", "Automatic", "4 Seats", "Leather", "GPS", "Premium Sound"]', 2024, 'Black', 'Gasoline', 'PQR-678');

SELECT 'Database setup completed successfully!' as message;