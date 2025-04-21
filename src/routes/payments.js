const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Inicializar Stripe con la clave secreta
const router = express.Router();
const db = require('../database/db'); // Importar la conexión a la base de datos
const isAuthenticated = require('../middleware/isAuthenticated'); // Middleware para verificar autenticación

/**
 * Crear un pago
 */
router.post('/create-payment/add', isAuthenticated, async (req, res) => {
    const { amount, currency = 'usd' } = req.body;

    try {
        // Crear un Intent de Pago en Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe maneja los montos en centavos
            currency,
            metadata: { userId: req.user.id }, // Agregar información adicional
        });

        res.json({
            clientSecret: paymentIntent.client_secret, // Enviar el client_secret al cliente
        });
    } catch (err) {
        console.error('Error al crear el pago:', err);
        res.status(500).json({ message: 'Error al procesar el pago', error: err });
    }
});

/**
 * Ruta para iniciar un pago con Neki
 */
router.post('/neki', isAuthenticated, (req, res) => {
    const { amount } = req.body;

    // Generar instrucciones de pago
    const nekiInstructions = {
        bank: 'Bancolombia',
        accountNumber: '123456789',
        accountType: 'Ahorros',
        accountHolder: 'Tu Empresa',
        amount,
        message: 'Por favor, envía el dinero a esta cuenta y envía el comprobante.',
    };

    res.json({
        message: 'Instrucciones de pago con Neki',
        instructions: nekiInstructions,
    });
});

/**
 * Ruta para Confirmar un pago con Neki
 */
router.post('/neki/confirm', isAuthenticated, (req, res) => {
    const { transactionId, userId } = req.body;

    // Guardar la confirmación en la base de datos
    const query = `
        INSERT INTO neki_payments (user_id, transaction_id, status)
        VALUES (?, ?, 'pending')
    `;
    db.query(query, [userId, transactionId], (err) => {
        if (err) return res.status(500).json({ message: 'Error al confirmar el pago', error: err });
        res.json({ message: 'Pago confirmado. Estamos verificando tu transacción.' });
    });
});

module.exports = router;