const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

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
        const { bookingId, status } = req.query;
        
        let query = `
            SELECT r.*, b.id as booking_id, c.model as car_model, cu.name as customer_name
            FROM returns r
            JOIN bookings b ON r.booking_id = b.id
            JOIN cars c ON b.car_id = c.id
            JOIN customers cu ON b.customer_id = cu.id
            WHERE 1=1
        `;
        const params = [];

        if (bookingId) {
            query += ' AND r.booking_id = ?';
            params.push(parseInt(bookingId));
        }

        query += ' ORDER BY r.created_at DESC';

        const [rows] = await pool.execute(query, params);
        
        const returns = rows.map(returnItem => ({
            id: returnItem.id,
            bookingId: returnItem.booking_id,
            carModel: returnItem.car_model,
            customerName: returnItem.customer_name,
            returnDate: formatDateForDisplay(returnItem.return_date),
            returnTime: returnItem.return_time,
            condition: returnItem.condition_rating,
            notes: returnItem.notes,
            mileage: returnItem.mileage,
            fuelLevel: returnItem.fuel_level,
            damages: returnItem.damages ? JSON.parse(returnItem.damages) : [],
            additionalCharges: parseFloat(returnItem.additional_charges || 0),
            totalAmount: parseFloat(returnItem.total_amount),
            processedBy: returnItem.processed_by,
            status: 'completed'
        }));

        res.json(returns);
    } catch (error) {
        console.error('Error fetching returns:', error);
        res.status(500).json({ error: 'Failed to fetch returns' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const returnId = parseInt(req.params.id);
        
        const [rows] = await pool.execute(`
            SELECT r.*, b.id as booking_id, c.model as car_model, cu.name as customer_name
            FROM returns r
            JOIN bookings b ON r.booking_id = b.id
            JOIN cars c ON b.car_id = c.id
            JOIN customers cu ON b.customer_id = cu.id
            WHERE r.id = ?
        `, [returnId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Return record not found' });
        }
        
        const returnItem = rows[0];
        const result = {
            id: returnItem.id,
            bookingId: returnItem.booking_id,
            carModel: returnItem.car_model,
            customerName: returnItem.customer_name,
            returnDate: formatDateForDisplay(returnItem.return_date),
            returnTime: returnItem.return_time,
            condition: returnItem.condition_rating,
            notes: returnItem.notes,
            mileage: returnItem.mileage,
            fuelLevel: returnItem.fuel_level,
            damages: returnItem.damages ? JSON.parse(returnItem.damages) : [],
            additionalCharges: parseFloat(returnItem.additional_charges || 0),
            totalAmount: parseFloat(returnItem.total_amount),
            processedBy: returnItem.processed_by,
            status: 'completed'
        };
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching return record:', error);
        res.status(500).json({ error: 'Failed to fetch return record' });
    }
});

router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const {
            bookingId,
            condition,
            notes,
            mileage,
            fuelLevel,
            damages
        } = req.body;

        if (!bookingId || !condition) {
            return res.status(400).json({ error: 'Booking ID and condition are required' });
        }

        const validConditions = ['excellent', 'good', 'fair', 'poor'];
        if (!validConditions.includes(condition)) {
            return res.status(400).json({ error: 'Invalid condition value' });
        }

        const [bookingRows] = await connection.execute(`
            SELECT b.*, c.model as car_model, cu.name as customer_name, cu.email as customer_email
            FROM bookings b
            JOIN cars c ON b.car_id = c.id
            JOIN customers cu ON b.customer_id = cu.id
            WHERE b.id = ? AND b.status = 'active'
        `, [bookingId]);

        if (bookingRows.length === 0) {
            return res.status(404).json({ error: 'Active booking not found' });
        }

        const booking = bookingRows[0];

        let additionalCharges = 0;
        
        switch (condition) {
            case 'poor':
                additionalCharges += 200;
                break;
            case 'fair':
                additionalCharges += 100;
                break;
            case 'good':
                additionalCharges += 25;
                break;
            case 'excellent':
                additionalCharges += 0;
                break;
        }

        if (damages && damages.length > 0) {
            damages.forEach(damage => {
                switch (damage.severity) {
                    case 'minor':
                        additionalCharges += 50;
                        break;
                    case 'moderate':
                        additionalCharges += 150;
                        break;
                    case 'major':
                        additionalCharges += 300;
                        break;
                }
            });
        }

        if (fuelLevel && fuelLevel < 25) {
            additionalCharges += 30;
        }

        const totalAmount = parseFloat(booking.total_cost) + additionalCharges;

        const [returnResult] = await connection.execute(`
            INSERT INTO returns (booking_id, return_date, condition_rating, notes, mileage, fuel_level, damages, additional_charges, total_amount, processed_by)
            VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, 'System')
        `, [
            bookingId, condition, notes || '', mileage || null, fuelLevel || null, 
            damages ? JSON.stringify(damages) : null, additionalCharges, totalAmount
        ]);

        await connection.execute(`
            UPDATE bookings 
            SET status = 'completed', return_condition = ?, return_notes = ?, additional_charges = ?, actual_return_date = CURDATE()
            WHERE id = ?
        `, [condition, notes || '', additionalCharges, bookingId]);

        await connection.commit();

        const returnRecord = {
            id: returnResult.insertId,
            bookingId: parseInt(bookingId),
            carModel: booking.car_model,
            customerName: booking.customer_name,
            returnDate: formatDateForDisplay(new Date()),
            returnTime: new Date().toISOString(),
            condition,
            notes: notes || '',
            mileage: mileage || null,
            fuelLevel: fuelLevel || null,
            damages: damages || [],
            additionalCharges,
            totalAmount,
            status: 'completed',
            processedBy: 'System'
        };
        
        res.status(201).json({
            message: 'Vehicle return processed successfully',
            return: returnRecord,
            summary: {
                originalCost: parseFloat(booking.total_cost),
                additionalCharges,
                totalAmount,
                condition,
                returnDate: formatDateForDisplay(new Date())
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error processing return:', error);
        res.status(500).json({ error: 'Failed to process return' });
    } finally {
        connection.release();
    }
});

router.put('/:id', async (req, res) => {
    try {
        const returnId = parseInt(req.params.id);
        const { condition, notes, additionalCharges } = req.body;
        
        const updates = [];
        const params = [];
        
        if (condition) {
            updates.push('condition_rating = ?');
            params.push(condition);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            params.push(notes);
        }
        if (additionalCharges !== undefined) {
            updates.push('additional_charges = ?');
            params.push(additionalCharges);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        
        params.push(returnId);
        
        const [result] = await pool.execute(
            `UPDATE returns SET ${updates.join(', ')} WHERE id = ?`,
            params
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Return record not found' });
        }
        
        const [rows] = await pool.execute(`
            SELECT r.*, b.id as booking_id, c.model as car_model, cu.name as customer_name
            FROM returns r
            JOIN bookings b ON r.booking_id = b.id
            JOIN cars c ON b.car_id = c.id
            JOIN customers cu ON b.customer_id = cu.id
            WHERE r.id = ?
        `, [returnId]);
        
        const returnItem = rows[0];
        const updatedReturn = {
            id: returnItem.id,
            bookingId: returnItem.booking_id,
            carModel: returnItem.car_model,
            customerName: returnItem.customer_name,
            returnDate: formatDateForDisplay(returnItem.return_date),
            condition: returnItem.condition_rating,
            notes: returnItem.notes,
            additionalCharges: parseFloat(returnItem.additional_charges || 0),
            totalAmount: parseFloat(returnItem.total_amount)
        };
        
        res.json({ 
            message: 'Return record updated successfully', 
            return: updatedReturn 
        });
    } catch (error) {
        console.error('Error updating return record:', error);
        res.status(500).json({ error: 'Failed to update return record' });
    }
});

router.get('/stats/summary', async (req, res) => {
    try {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as totalReturns,
                AVG(CASE 
                    WHEN condition_rating = 'excellent' THEN 4
                    WHEN condition_rating = 'good' THEN 3
                    WHEN condition_rating = 'fair' THEN 2
                    WHEN condition_rating = 'poor' THEN 1
                    ELSE 0
                END) as averageCondition,
                SUM(additional_charges) as totalAdditionalCharges,
                SUM(CASE WHEN condition_rating = 'excellent' THEN 1 ELSE 0 END) as excellent,
                SUM(CASE WHEN condition_rating = 'good' THEN 1 ELSE 0 END) as good,
                SUM(CASE WHEN condition_rating = 'fair' THEN 1 ELSE 0 END) as fair,
                SUM(CASE WHEN condition_rating = 'poor' THEN 1 ELSE 0 END) as poor,
                SUM(CASE WHEN damages IS NOT NULL AND damages != '[]' THEN 1 ELSE 0 END) as damageReports
            FROM returns
        `);
        
        const result = {
            totalReturns: parseInt(stats[0].totalReturns),
            averageCondition: parseFloat(stats[0].averageCondition || 0).toFixed(2),
            totalAdditionalCharges: parseFloat(stats[0].totalAdditionalCharges || 0),
            conditionBreakdown: {
                excellent: parseInt(stats[0].excellent),
                good: parseInt(stats[0].good),
                fair: parseInt(stats[0].fair),
                poor: parseInt(stats[0].poor)
            },
            damageReports: parseInt(stats[0].damageReports)
        };
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching return statistics:', error);
        res.status(500).json({ error: 'Failed to fetch return statistics' });
    }
});

router.post('/validate', async (req, res) => {
    try {
        const { bookingId } = req.body;
        
        if (!bookingId) {
            return res.status(400).json({ error: 'Booking ID is required' });
        }

        const [rows] = await pool.execute(`
            SELECT b.*, c.model as car_model, cu.name as customer_name
            FROM bookings b
            JOIN cars c ON b.car_id = c.id
            JOIN customers cu ON b.customer_id = cu.id
            WHERE b.id = ?
        `, [bookingId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = rows[0];

        if (booking.status !== 'active') {
            return res.status(400).json({ 
                error: 'Booking is not active or has already been returned' 
            });
        }

        const validBooking = {
            id: booking.id,
            carModel: booking.car_model,
            customerName: booking.customer_name,
            pickupDate: formatDateForDisplay(booking.pickup_date),
            returnDate: formatDateForDisplay(booking.return_date),
            status: booking.status
        };

        res.json({
            valid: true,
            booking: validBooking,
            message: 'Booking is valid for return'
        });
    } catch (error) {
        console.error('Error validating booking:', error);
        res.status(500).json({ error: 'Failed to validate booking' });
    }
});

module.exports = router;