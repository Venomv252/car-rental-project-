const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

function convertDateFormat(dateString) {
    if (!dateString) return null;
    const parts = dateString.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateString;
}

function formatDateForDisplay(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

router.get('/', async (req, res) => {
    try {
        const { email, status } = req.query;
        
        let query = `
            SELECT b.*, c.model as car_model, cu.name as customer_name, cu.email as customer_email, 
                   cu.phone as customer_phone, cu.license_number
            FROM bookings b
            JOIN cars c ON b.car_id = c.id
            JOIN customers cu ON b.customer_id = cu.id
            WHERE 1=1
        `;
        const params = [];

        if (email) {
            query += ' AND cu.email = ?';
            params.push(email);
        }

        if (status) {
            query += ' AND b.status = ?';
            params.push(status);
        }

        query += ' ORDER BY b.created_at DESC';

        const [rows] = await pool.execute(query, params);
        
        const bookings = rows.map(booking => ({
            id: booking.id,
            carId: booking.car_id,
            carModel: booking.car_model,
            customerName: booking.customer_name,
            customerEmail: booking.customer_email,
            customerPhone: booking.customer_phone,
            licenseNumber: booking.license_number,
            pickupDate: formatDateForDisplay(booking.pickup_date),
            returnDate: formatDateForDisplay(booking.return_date),
            days: booking.days,
            totalCost: parseFloat(booking.total_cost),
            status: booking.status,
            bookingDate: formatDateForDisplay(booking.booking_date),
            additionalCharges: parseFloat(booking.additional_charges || 0),
            returnCondition: booking.return_condition,
            returnNotes: booking.return_notes,
            actualReturnDate: booking.actual_return_date ? formatDateForDisplay(booking.actual_return_date) : null
        }));

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        
        const [rows] = await pool.execute(`
            SELECT b.*, c.model as car_model, cu.name as customer_name, cu.email as customer_email, 
                   cu.phone as customer_phone, cu.license_number
            FROM bookings b
            JOIN cars c ON b.car_id = c.id
            JOIN customers cu ON b.customer_id = cu.id
            WHERE b.id = ?
        `, [bookingId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        const booking = rows[0];
        const result = {
            id: booking.id,
            carId: booking.car_id,
            carModel: booking.car_model,
            customerName: booking.customer_name,
            customerEmail: booking.customer_email,
            customerPhone: booking.customer_phone,
            licenseNumber: booking.license_number,
            pickupDate: formatDateForDisplay(booking.pickup_date),
            returnDate: formatDateForDisplay(booking.return_date),
            days: booking.days,
            totalCost: parseFloat(booking.total_cost),
            status: booking.status,
            bookingDate: formatDateForDisplay(booking.booking_date),
            additionalCharges: parseFloat(booking.additional_charges || 0),
            returnCondition: booking.return_condition,
            returnNotes: booking.return_notes,
            actualReturnDate: booking.actual_return_date ? formatDateForDisplay(booking.actual_return_date) : null
        };
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ error: 'Failed to fetch booking' });
    }
});

router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const {
            carId,
            customerName,
            customerEmail,
            customerPhone,
            licenseNumber,
            pickupDate,
            returnDate,
            totalCost
        } = req.body;

        if (!carId || !customerName || !customerEmail || !customerPhone || 
            !licenseNumber || !pickupDate || !returnDate || !totalCost) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const mysqlPickupDate = convertDateFormat(pickupDate);
        const mysqlReturnDate = convertDateFormat(returnDate);
        
        const pickup = new Date(mysqlPickupDate);
        const returnD = new Date(mysqlReturnDate);
        
        if (returnD <= pickup) {
            return res.status(400).json({ error: 'Return date must be after pickup date' });
        }

        const [conflictingBookings] = await connection.execute(`
            SELECT COUNT(*) as count FROM bookings 
            WHERE car_id = ? AND status = 'active' AND (
                (pickup_date <= ? AND return_date >= ?) OR
                (pickup_date <= ? AND return_date >= ?) OR
                (pickup_date >= ? AND return_date <= ?)
            )
        `, [carId, mysqlPickupDate, mysqlPickupDate, mysqlReturnDate, mysqlReturnDate, mysqlPickupDate, mysqlReturnDate]);

        if (conflictingBookings[0].count > 0) {
            return res.status(409).json({ error: 'Car is not available for the selected dates' });
        }

        let customerId;
        const [existingCustomer] = await connection.execute(
            'SELECT id FROM customers WHERE email = ?',
            [customerEmail]
        );

        if (existingCustomer.length > 0) {
            customerId = existingCustomer[0].id;
            await connection.execute(`
                UPDATE customers SET name = ?, phone = ?, license_number = ? WHERE id = ?
            `, [customerName, customerPhone, licenseNumber, customerId]);
        } else {
            const [customerResult] = await connection.execute(`
                INSERT INTO customers (name, email, phone, license_number)
                VALUES (?, ?, ?, ?)
            `, [customerName, customerEmail, customerPhone, licenseNumber]);
            customerId = customerResult.insertId;
        }

        const days = Math.ceil((returnD - pickup) / (1000 * 60 * 60 * 24));

        const [bookingResult] = await connection.execute(`
            INSERT INTO bookings (car_id, customer_id, pickup_date, return_date, days, total_cost, booking_date)
            VALUES (?, ?, ?, ?, ?, ?, CURDATE())
        `, [carId, customerId, mysqlPickupDate, mysqlReturnDate, days, totalCost]);

        const [carRows] = await connection.execute('SELECT model FROM cars WHERE id = ?', [carId]);
        const carModel = carRows[0].model;

        await connection.commit();
        
        const booking = {
            id: bookingResult.insertId,
            carId,
            carModel,
            customerName,
            customerEmail,
            customerPhone,
            licenseNumber,
            pickupDate,
            returnDate,
            days,
            totalCost,
            status: 'active',
            bookingDate: formatDateForDisplay(new Date())
        };
        
        res.status(201).json({
            message: 'Booking created successfully',
            booking
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    } finally {
        connection.release();
    }
});

router.put('/:id/status', async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const { status } = req.body;
        
        const validStatuses = ['active', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const [result] = await pool.execute(
            'UPDATE bookings SET status = ? WHERE id = ?',
            [status, bookingId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        const [rows] = await pool.execute(`
            SELECT b.*, c.model as car_model, cu.name as customer_name, cu.email as customer_email, 
                   cu.phone as customer_phone, cu.license_number
            FROM bookings b
            JOIN cars c ON b.car_id = c.id
            JOIN customers cu ON b.customer_id = cu.id
            WHERE b.id = ?
        `, [bookingId]);
        
        const booking = rows[0];
        const updatedBooking = {
            id: booking.id,
            carId: booking.car_id,
            carModel: booking.car_model,
            customerName: booking.customer_name,
            customerEmail: booking.customer_email,
            customerPhone: booking.customer_phone,
            licenseNumber: booking.license_number,
            pickupDate: formatDateForDisplay(booking.pickup_date),
            returnDate: formatDateForDisplay(booking.return_date),
            days: booking.days,
            totalCost: parseFloat(booking.total_cost),
            status: booking.status,
            bookingDate: formatDateForDisplay(booking.booking_date)
        };
        
        res.json({ 
            message: 'Booking status updated successfully', 
            booking: updatedBooking 
        });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ error: 'Failed to update booking status' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        
        const [rows] = await pool.execute(
            'SELECT status FROM bookings WHERE id = ?',
            [bookingId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        if (rows[0].status !== 'active') {
            return res.status(400).json({ error: 'Only active bookings can be cancelled' });
        }

        await pool.execute(
            'UPDATE bookings SET status = "cancelled" WHERE id = ?',
            [bookingId]
        );
        
        res.json({ 
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
});

router.get('/stats/summary', async (req, res) => {
    try {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                SUM(CASE WHEN status = 'completed' THEN total_cost + additional_charges ELSE 0 END) as totalRevenue
            FROM bookings
        `);
        
        const result = {
            total: parseInt(stats[0].total),
            active: parseInt(stats[0].active),
            completed: parseInt(stats[0].completed),
            cancelled: parseInt(stats[0].cancelled),
            totalRevenue: parseFloat(stats[0].totalRevenue || 0)
        };
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching booking statistics:', error);
        res.status(500).json({ error: 'Failed to fetch booking statistics' });
    }
});

module.exports = router;