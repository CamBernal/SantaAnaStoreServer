const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();
const isAuthenticated = require('../middleware/isAuthenticated'); // Middleware para verificar autenticación

/**
 * Configuración del transporte de correo utilizando nodemailer
 * Se utiliza Gmail como servicio de correo, y las credenciales se obtienen de las variables de entorno.
 */
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Enviar una notificación por correo
 */
router.post('/email', isAuthenticated, (req, res) => {
    const { to, subject, text } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) return res.status(500).json({ message: 'Error al enviar el correo', error: err });
        res.json({ message: 'Correo enviado correctamente', info });
    });
});

module.exports = router;