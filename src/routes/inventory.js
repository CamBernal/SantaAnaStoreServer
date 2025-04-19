const express = require('express');
const db = require('../database/db'); // Importar la conexión a la base de datos
const router = express.Router();
const isAuthenticated = require('../middleware/isAuthenticated'); // Middleware para verificar autenticación
const isAdmin = require('../middleware/isAdmin'); // Middleware para verificar rol de administrador

/**
 * Actualizar el stock de una presentación (solo administradores)
 */
router.put('/presentations/:id/stock', isAuthenticated, isAdmin, (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock < 0) {
        return res.status(400).json({ message: 'El stock no puede ser negativo.' });
    }

    const query = `UPDATE presentations SET stock = ? WHERE id = ?`;
    db.query(query, [stock, id], (err) => {
        if (err) return res.status(500).json({ message: 'Error al actualizar el stock', error: err });
        res.json({ message: 'Stock actualizado correctamente' });
    });
});

/**
 * Obtener productos con bajo stock (solo administradores)
 */
router.get('/low-stock', isAuthenticated, isAdmin, (req, res) => {
    const { threshold = 5 } = req.query; // Umbral de stock bajo, por defecto 5

    const query = `
        SELECT presentations.id, presentations.type, presentations.size, presentations.stock, products.name AS product_name
        FROM presentations
        JOIN products ON presentations.product_id = products.id
        WHERE presentations.stock <= ?
    `;
    db.query(query, [threshold], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error al obtener productos con bajo stock', error: err });
        res.json(results);
    });
});

module.exports = router;