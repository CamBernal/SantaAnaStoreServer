const express = require('express');
const db = require('../database/db'); // Importar la conexión a la base de datos
const router = express.Router();
const isAuthenticated = require('../middleware/isAuthenticated'); // Middleware para verificar autenticación

/**
 * Agregar una reseña a un producto
 */
router.post('/add/:productId', isAuthenticated, (req, res) => {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const query = `
        INSERT INTO reviews (product_id, user_id, rating, comment)
        VALUES (?, ?, ?, ?)
    `;
    db.query(query, [productId, userId, rating, comment], (err) => {
        if (err) return res.status(500).json({ message: 'Error al agregar la reseña', error: err });
        res.json({ message: 'Reseña agregada correctamente' });
    });
});

/**
 * Obtener reseñas de un producto
 */
router.get('/:productId', (req, res) => {
    const { productId } = req.params;

    const query = `
        SELECT reviews.*, users.name AS user_name
        FROM reviews
        JOIN users ON reviews.user_id = users.id
        WHERE reviews.product_id = ?
        ORDER BY reviews.created_at DESC
    `;
    db.query(query, [productId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error al obtener las reseñas', error: err });
        res.json(results);
    });
});

/**
 * Eliminar una reseña (solo el autor o un administrador)
 */
router.delete('/delete/:reviewId', isAuthenticated, (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Verificar si el usuario es el autor de la reseña o un administrador
    const query = `
        DELETE FROM reviews
        WHERE id = ? AND (user_id = ? OR EXISTS (
            SELECT 1 FROM users WHERE id = ? AND role = 'admin'
        ))
    `;
    db.query(query, [reviewId, userId, userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error al eliminar la reseña', error: err });
        if (result.affectedRows === 0) return res.status(403).json({ message: 'No tienes permiso para eliminar esta reseña' });
        res.json({ message: 'Reseña eliminada correctamente' });
    });
});

module.exports = router;