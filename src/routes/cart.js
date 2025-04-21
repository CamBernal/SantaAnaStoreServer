const express = require('express');
const db = require('../database/db'); // Importar la conexión a la base de datos
const router = express.Router();


/**
 * Middleware para verificar si el usuario está autenticado
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'No autorizado. Por favor, inicia sesión.' });
};


/**
 * Obtener el contenido del carrito
 */
router.get('/cart', isAuthenticated, (req, res) => {
    const query = `
        SELECT cart.*, presentations.type, presentations.size, presentations.price, products.name AS product_name
        FROM cart
        JOIN presentations ON cart.presentation_id = presentations.id
        JOIN products ON presentations.product_id = products.id
        WHERE cart.user_id = ?
    `;
    db.query(query, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error al obtener el carrito', error: err });
        res.json(results);
    });
});


/**
 * Agregar un producto al carrito
 */
router.post('/cart/add', isAuthenticated, (req, res) => {
    const { presentation_id, quantity } = req.body;
    const query = `
        INSERT INTO cart (user_id, presentation_id, quantity)
        VALUES (?, ?, ?)
    `;
    db.query(query, [req.user.id, presentation_id, quantity], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error al agregar al carrito', error: err });
        }
        res.status(201).json({ id: result.insertId, presentation_id, quantity });
    });
});

/**
 * Actualizar la cantidad de un producto en el carrito
 */
router.put('/cart/update/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    const query = `
        UPDATE cart
        SET quantity = ?
        WHERE id = ? AND user_id = ?
    `;
    db.query(query, [quantity, id, req.user.id], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error al actualizar el carrito', error: err });
        }
        res.json({ message: 'Cantidad actualizada' });
    });
});

/**
 * Eliminar un producto del carrito
 */
router.delete('/cart/delete/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const query = `
        DELETE FROM cart
        WHERE id = ? AND user_id = ?
    `;
    db.query(query, [id, req.user.id], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error al eliminar del carrito', error: err });
        }
        res.json({ message: 'Producto eliminado del carrito' });
    });
});

module.exports = router;