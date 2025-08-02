const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
    try {
        const { type, available, minPrice, maxPrice } = req.query;
        
        let query = 'SELECT * FROM cars WHERE 1=1';
        const params = [];

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }

        if (available !== undefined) {
            const isAvailable = available === 'true';
            query += ' AND available = ?';
            params.push(isAvailable);
        }

        if (minPrice) {
            query += ' AND price_per_day >= ?';
            params.push(parseFloat(minPrice));
        }
        if (maxPrice) {
            query += ' AND price_per_day <= ?';
            params.push(parseFloat(maxPrice));
        }

        query += ' ORDER BY id';

        const [rows] = await pool.execute(query, params);
        
        const cars = rows.map(car => ({
            id: car.id,
            model: car.model,
            type: car.type,
            pricePerDay: parseFloat(car.price_per_day),
            available: Boolean(car.available),
            image: car.image,
            features: JSON.parse(car.features || '[]'),
            year: car.year,
            color: car.color,
            fuelType: car.fuel_type,
            licensePlate: car.license_plate
        }));

        res.json(cars);
    } catch (error) {
        console.error('Error fetching cars:', error);
        res.status(500).json({ error: 'Failed to fetch cars' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const carId = parseInt(req.params.id);
        
        const [rows] = await pool.execute(
            'SELECT * FROM cars WHERE id = ?',
            [carId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Car not found' });
        }
        
        const car = rows[0];
        const result = {
            id: car.id,
            model: car.model,
            type: car.type,
            pricePerDay: parseFloat(car.price_per_day),
            available: Boolean(car.available),
            image: car.image,
            features: JSON.parse(car.features || '[]'),
            year: car.year,
            color: car.color,
            fuelType: car.fuel_type,
            licensePlate: car.license_plate
        };
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching car:', error);
        res.status(500).json({ error: 'Failed to fetch car' });
    }
});

router.put('/:id/availability', async (req, res) => {
    try {
        const carId = parseInt(req.params.id);
        const { available } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE cars SET available = ? WHERE id = ?',
            [available, carId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Car not found' });
        }
        
        const [rows] = await pool.execute(
            'SELECT * FROM cars WHERE id = ?',
            [carId]
        );
        
        const car = rows[0];
        const updatedCar = {
            id: car.id,
            model: car.model,
            type: car.type,
            pricePerDay: parseFloat(car.price_per_day),
            available: Boolean(car.available),
            image: car.image,
            features: JSON.parse(car.features || '[]'),
            year: car.year,
            color: car.color,
            fuelType: car.fuel_type,
            licensePlate: car.license_plate
        };
        
        res.json({ message: 'Car availability updated', car: updatedCar });
    } catch (error) {
        console.error('Error updating car availability:', error);
        res.status(500).json({ error: 'Failed to update car availability' });
    }
});

router.post('/', async (req, res) => {
    try {
        const {
            model, type, pricePerDay, available = true, image = '🚗',
            features = [], year, color, fuelType, licensePlate
        } = req.body;

        if (!model || !type || !pricePerDay) {
            return res.status(400).json({ error: 'Model, type, and price per day are required' });
        }

        const [result] = await pool.execute(`
            INSERT INTO cars (model, type, price_per_day, available, image, features, year, color, fuel_type, license_plate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            model, type, pricePerDay, available, image, 
            JSON.stringify(features), year, color, fuelType, licensePlate
        ]);

        const newCar = {
            id: result.insertId,
            model, type, pricePerDay, available, image, features, year, color, fuelType, licensePlate
        };

        res.status(201).json({ message: 'Car added successfully', car: newCar });
    } catch (error) {
        console.error('Error adding car:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ error: 'License plate already exists' });
        } else {
            res.status(500).json({ error: 'Failed to add car' });
        }
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const carId = parseInt(req.params.id);
        
        const [bookings] = await pool.execute(
            'SELECT COUNT(*) as count FROM bookings WHERE car_id = ? AND status = "active"',
            [carId]
        );
        
        if (bookings[0].count > 0) {
            return res.status(400).json({ error: 'Cannot delete car with active bookings' });
        }
        
        const [result] = await pool.execute(
            'DELETE FROM cars WHERE id = ?',
            [carId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Car not found' });
        }
        
        res.json({ message: 'Car deleted successfully' });
    } catch (error) {
        console.error('Error deleting car:', error);
        res.status(500).json({ error: 'Failed to delete car' });
    }
});

module.exports = router;