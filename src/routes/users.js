const express = require('express');
const db = require('../database/db'); // Importar la conexión a la base de datos
const router = express.Router();
const isAuthenticated = require('../middleware/isAuthenticated'); // Middleware para verificar autenticación
const isAdmin = require('../middleware/isAdmin'); // Middleware para verificar rol de administrador

/**
 * Obtener todos los usuarios (solo administradores)
 */
router.get('/', isAuthenticated, isAdmin, (req, res) => {
    const query = `SELECT id, name, email, role, created_at FROM users`;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error al obtener los usuarios', error: err });
        res.json(results);
    });
});

/**
 * Actualizar el rol de un usuario (solo administradores)
 */
router.put('/:id/role', isAuthenticated, isAdmin, (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Rol inválido. Los roles permitidos son "user" y "admin".' });
    }

    const query = `UPDATE users SET role = ? WHERE id = ?`;
    db.query(query, [role, id], (err) => {
        if (err) return res.status(500).json({ message: 'Error al actualizar el rol del usuario', error: err });
        res.json({ message: 'Rol actualizado correctamente' });
    });
});

/**
 * Eliminar un usuario (solo administradores)
 */
router.delete('/:id', isAuthenticated, isAdmin, (req, res) => {
    const { id } = req.params;

    const query = `DELETE FROM users WHERE id = ?`;
    db.query(query, [id], (err) => {
        if (err) return res.status(500).json({ message: 'Error al eliminar el usuario', error: err });
        res.json({ message: 'Usuario eliminado correctamente' });
    });
});

module.exports = router;