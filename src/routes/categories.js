const express = require('express');
const db = require('../database/db'); // Importar la conexión a la base de datos
const router = express.Router();

/**
 * Obtener todas las categorías
 * * @swagger
 */
router.get('/categories', (req, res) => {
    const query = 'SELECT * FROM categories';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error al obtener las categorías', error: err });
        }
        res.json(results);
    });
});

/**
 * Crear una nueva categoría
 */
router.post('/categories/add', (req, res) => {
    const { name } = req.body;
    const query = 'INSERT INTO categories (name) VALUES (?)';
    db.query(query, [name], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error al crear la categoría', error: err });
        }
        res.status(201).json({ id: result.insertId, name });
    });
});

/**
 * * Actualizar una categoría
 * @swagger
 */
router.put('/categories/update/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const query = 'UPDATE categories SET name = ? WHERE id = ?';
    db.query(query, [name, id], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error al actualizar la categoría', error: err });
        }
        res.json({ message: 'Categoría actualizada' });
    });
});

/**
 * Eliminar una categoría
 */
router.delete('/categories/delete/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM categories WHERE id = ?';
    db.query(query, [id], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error al eliminar la categoría', error: err });
        }
        res.json({ message: 'Categoría eliminada' });
    });
});

module.exports = router;