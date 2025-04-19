const express = require('express');
const db = require('../database/db'); // Importar la conexión a la base de datos
const router = express.Router();

// Obtener todos los productos con sus categorías
router.get('/', (req, res) => {
    const query = `
        SELECT products.*, categories.name AS category_name
        FROM products
        JOIN categories ON products.category_id = categories.id
    `;
    db.query(query, (err, products) => {
        if (err) {
            return res.status(500).json({ message: 'Error al obtener los productos', error: err });
        }

        // Obtener presentaciones para cada producto
        const productIds = products.map(product => product.id);
        const presentationsQuery = `
            SELECT * FROM presentations
            WHERE product_id IN (?)
        `;
        db.query(presentationsQuery, [productIds], (err, presentations) => {
            if (err) {
                return res.status(500).json({ message: 'Error al obtener las presentaciones', error: err });
            }

            // Asociar presentaciones a sus productos
            const productsWithPresentations = products.map(product => {
                return {
                    ...product,
                    presentations: presentations.filter(p => p.product_id === product.id)
                };
            });

            res.json(productsWithPresentations);
        });
    });
});

// Crear un nuevo producto
router.post('/add', (req, res) => {
    console.log(req.body); // Verificar el cuerpo de la solicitud
    const { name, category_id, price, description, image, stock } = req.body;
    const query = `
        INSERT INTO products (name, category_id, price, description, image, stock)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [name, category_id, price, description, image, stock], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error al crear el producto', error: err });
        }
        res.status(201).json({ id: result.insertId, ...req.body });
    });
});

// Actualizar un producto
router.put('/update/:id', (req, res) => {
    const { id } = req.params;
    const { name, category_id, price, description, image, stock } = req.body;
    const query = `
        UPDATE products
        SET name = ?, category_id = ?, price = ?, description = ?, image = ?, stock = ?
        WHERE id = ?
    `;
    db.query(query, [name, category_id, price, description, image, stock, id], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error al actualizar el producto', error: err });
        }
        res.json({ message: 'Producto actualizado' });
    });
});

// Eliminar un producto
router.delete('/delete/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM products WHERE id = ?';
    db.query(query, [id], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error al eliminar el producto', error: err });
        }
        res.json({ message: 'Producto eliminado' });
    });
});

/**
 * Manejar las presentaciones de los productos
 */
// Obtener todas las presentaciones de un producto
router.get('/:id/presentations', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT presentations.*
        FROM presentations
        WHERE product_id = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error al obtener las presentaciones', error: err });
        }
        res.json(results);
    });
});

// Crear una nueva presentación para un producto
router.post('/:id/presentations', (req, res) => {
    const { id } = req.params;
    const { type, size, price, stock } = req.body;
    const query = `
        INSERT INTO presentations (product_id, type, size, price, stock)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.query(query, [id, type, size, price, stock], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error al crear la presentación', error: err });
        }
        res.status(201).json({ id: result.insertId, product_id: id, type, size, price, stock });
    });
});

// Actualizar una presentación
router.put('/presentations/:presentationId', (req, res) => {
    const { presentationId } = req.params;
    const { type, size, price, stock } = req.body;
    const query = `
        UPDATE presentations
        SET type = ?, size = ?, price = ?, stock = ?
        WHERE id = ?
    `;
    db.query(query, [type, size, price, stock, presentationId], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error al actualizar la presentación', error: err });
        }
        res.json({ message: 'Presentación actualizada' });
    });
});

// Eliminar una presentación
router.delete('/presentations/:presentationId', (req, res) => {
    const { presentationId } = req.params;
    const query = 'DELETE FROM presentations WHERE id = ?';
    db.query(query, [presentationId], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error al eliminar la presentación', error: err });
        }
        res.json({ message: 'Presentación eliminada' });
    });
});


/**
 * Buscar productos por nombre
 */
router.get('/search', (req, res) => {
    const { q } = req.query; // `q` es el término de búsqueda
    const query = `
        SELECT * FROM products
        WHERE name LIKE ?
    `;
    db.query(query, [`%${q}%`], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error al buscar productos', error: err });
        res.json(results);
    });
});

/**
 * Filtrar productos por categoría
 */
router.get('/filter', (req, res) => {
    const { category_id, min_price, max_price } = req.query;

    let query = `
        SELECT products.*, categories.name AS category_name
        FROM products
        JOIN categories ON products.category_id = categories.id
        WHERE 1 = 1
    `;
    const params = [];

    if (category_id) {
        query += ` AND category_id = ?`;
        params.push(category_id);
    }

    if (min_price) {
        query += ` AND price >= ?`;
        params.push(min_price);
    }

    if (max_price) {
        query += ` AND price <= ?`;
        params.push(max_price);
    }

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error al filtrar productos', error: err });
        res.json(results);
    });
});

module.exports = router;
// Este archivo maneja las rutas relacionadas con los productos y sus presentaciones.
// Se pueden agregar más rutas según sea necesario para manejar otras operaciones relacionadas con los productos.