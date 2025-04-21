const express = require('express');
const db = require('../database/db'); // Importar la conexión a la base de datos
const router = express.Router();
const isAuthenticated = require('../middleware/isAuthenticated'); // Middleware para verificar autenticación

/**
 * Crear un pedido
 */
router.post('/orders/add', isAuthenticated, (req, res) => {
    const { items } = req.body; // `items` debe ser un array con los productos del carrito
    const userId = req.user.id;

    // Calcular el total del pedido
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Insertar el pedido en la tabla `orders`
    const orderQuery = `INSERT INTO orders (user_id, total) VALUES (?, ?)`;
    db.query(orderQuery, [userId, total], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error al crear el pedido', error: err });

        const orderId = result.insertId;

        // Insertar los productos en la tabla `order_items`
        const orderItemsQuery = `
            INSERT INTO order_items (order_id, product_id, presentation_id, quantity, price)
            VALUES ?
        `;
        const orderItemsData = items.map(item => [
            orderId,
            item.product_id,
            item.presentation_id,
            item.quantity,
            item.price,
        ]);

        db.query(orderItemsQuery, [orderItemsData], (err) => {
            if (err) return res.status(500).json({ message: 'Error al agregar productos al pedido', error: err });

            // Vaciar el carrito del usuario
            const clearCartQuery = `DELETE FROM cart WHERE user_id = ?`;
            db.query(clearCartQuery, [userId], (err) => {
                if (err) return res.status(500).json({ message: 'Error al vaciar el carrito', error: err });

                res.status(201).json({ message: 'Pedido creado exitosamente', orderId });
            });
        });
    });
});

/**
 * Obtener pedidos del usuario autenticado
 */
router.get('/orders', isAuthenticated, (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT orders.*, order_items.product_id, order_items.presentation_id, order_items.quantity, order_items.price
        FROM orders
        JOIN order_items ON orders.id = order_items.order_id
        WHERE orders.user_id = ?
    `;
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error al obtener los pedidos', error: err });
        res.json(results);
    });
});

module.exports = router;