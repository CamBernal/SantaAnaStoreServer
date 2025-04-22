const express = require('express');
const db = require('../database/db'); // Importar la conexión a la base de datos
const router = express.Router();
const isAuthenticated = require('../middleware/isAuthenticated'); // Middleware para verificar autenticación
const isAdmin = require('../middleware/isAdmin'); // Middleware para verificar rol de administrador

/**
 * Reporte de ventas por fecha
 */
router.get('/sales', isAuthenticated, isAdmin, (req, res) => {
    const { start_date, end_date } = req.query;

    const query = `
        SELECT orders.id, orders.total, orders.created_at, users.name AS user_name
        FROM orders
        JOIN users ON orders.user_id = users.id
        WHERE orders.created_at BETWEEN ? AND ?
    `;
    db.query(query, [start_date, end_date], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error al generar el reporte de ventas', error: err });
        res.json(results);
    });
});

/**
 * Reporte de productos más vendidos
 */
router.get('/top-products', isAuthenticated, isAdmin, (req, res) => {
    const query = `
        SELECT products.name AS product_name, SUM(order_items.quantity) AS total_quantity
        FROM order_items
        JOIN products ON order_items.product_id = products.id
        GROUP BY products.id
        ORDER BY total_quantity DESC
        LIMIT 10
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error al generar el reporte de productos más vendidos', error: err });
        res.json(results);
    });
});

module.exports = router;