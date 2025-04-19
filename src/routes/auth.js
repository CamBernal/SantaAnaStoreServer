const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer'); // Usar nodemailer para enviar correos
const db = require('../database/db'); // Importar la conexión a la base de datos
const isAuthenticated = require('../middleware/isAuthenticated'); // Importar el middleware
const router = express.Router();

/**
 * Middleware para verificar autenticación
 * Este middleware verifica si el usuario está autenticado antes de permitir el acceso a ciertas rutas.
 */
passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      const query = 'SELECT * FROM users WHERE email = ?';
      db.query(query, [email], async (err, results) => {
        if (err) return done(err);
        if (results.length === 0) return done(null, false, { message: 'Usuario no encontrado' });
  
        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return done(null, false, { message: 'Contraseña incorrecta' });
  
        return done(null, user); // Usuario autenticado correctamente
      });
    })
  );

 /**
  * Configurar Passport para autenticación con Google
  */
passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      const query = 'SELECT * FROM users WHERE email = ?';
      db.query(query, [email], async (err, results) => {
        if (err) {
          return done(err);
        }
        if (results.length === 0) {
          return done(null, false, { message: 'Usuario no encontrado' });
        }
  
        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return done(null, false, { message: 'Contraseña incorrecta' });
        }
  
        return done(null, user); // Usuario autenticado correctamente
      });
    })
  );

/**
 * Configurar Passport para autenticación con Facebook
 * Esta estrategia permite a los usuarios iniciar sesión utilizando su cuenta de Facebook.
 */
passport.use(
    new FacebookStrategy(
        {
            clientID: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            callbackURL: '/api/auth/facebook/callback',
            profileFields: ['id', 'displayName', 'emails'],
        },
        (accessToken, refreshToken, profile, done) => {
            const query = 'SELECT * FROM users WHERE email = ?';
            const email = profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`; // Si no hay email, usar un identificador único
            db.query(query, [email], (err, results) => {
                if (err) return done(err);

                if (results.length > 0) {
                    return done(null, results[0]);
                } else {
                    const insertQuery = 'INSERT INTO users (name, email) VALUES (?, ?)';
                    db.query(insertQuery, [profile.displayName, email], (err, result) => {
                        if (err) return done(err);
                        const newUser = { id: result.insertId, name: profile.displayName, email };
                        return done(null, newUser);
                    });
                }
            });
        }
    )
);

/**
 *  Serializar y deserializar el usuario
 */
passport.serializeUser((user, done) => {
    done(null, user.id); // Serializar el ID del usuario
  });
  
  passport.deserializeUser((id, done) => {
    const query = 'SELECT * FROM users WHERE id = ?';
    db.query(query, [id], (err, results) => {
      if (err) return done(err);
      if (results.length === 0) return done(null, false);
      done(null, results[0]); // Deserializar el usuario completo
    });
  });

/**
 * Middleware para inicializar Passport
 * Este middleware inicializa Passport y permite la autenticación de usuarios.
 */
router.use(passport.initialize());
router.use(passport.session());

/**
 * Ruta para registrar un nuevo usuario
 * Esta ruta permite a los usuarios registrarse proporcionando un correo electrónico y una contraseña.
 */
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) return res.status(500).json({ message: 'Error en el servidor', error: err });
      if (!user) return res.status(401).json({ message: info.message });
  
      req.logIn(user, (err) => {
        if (err) return res.status(500).json({ message: 'Error al iniciar sesión', error: err });
    
        // Excluir la contraseña del objeto user
        const { password, ...userWithoutPassword } = user;
  
        res.json({ message: 'Inicio de sesión exitoso', user: userWithoutPassword });
      });
    })(req, res, next);
  });

/**
 * Ruta para iniciar sesión con Google
 * Esta ruta redirige al usuario a la página de inicio de sesión de Google.
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.json({ message: 'Inicio de sesión con Google exitoso', user: req.user });
    }
);

/**
 * Ruta para iniciar sesión con Facebook
 * Esta ruta redirige al usuario a la página de inicio de sesión de Facebook.
 */
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get(
    '/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/' }),
    (req, res) => {
        res.json({ message: 'Inicio de sesión con Facebook exitoso', user: req.user });
    }
);

/**
 * Ruta para cerrar sesión
 * Esta ruta permite a los usuarios cerrar sesión de su cuenta.
 */
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ message: 'Error al cerrar sesión', error: err });
        res.json({ message: 'Sesión cerrada exitosamente' });
    });
});

/**
 * Ruta para solicitar un restablecimiento de contraseña    
 */
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    // Verificar si el correo existe
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error en el servidor', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Correo no encontrado' });

        // Generar un token único
        const token = crypto.randomBytes(32).toString('hex');

        // Guardar el token en la base de datos
        const insertQuery = 'INSERT INTO password_resets (email, token) VALUES (?, ?)';
        db.query(insertQuery, [email, token], (err) => {
            if (err) return res.status(500).json({ message: 'Error al generar el token', error: err });

            // Configurar el transporte de correo
            const transporter = nodemailer.createTransport({
                service: 'Gmail', // Cambiar según el proveedor de correo
                auth: {
                    user: process.env.EMAIL_USER, // Configurar en .env
                    pass: process.env.EMAIL_PASS, // Configurar en .env
                },
            });

            // Enviar el correo con el enlace de restablecimiento
            const resetLink = `http://localhost:3100/reset-password?token=${token}`;
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Restablecimiento de contraseña',
                text: `Haz clic en el siguiente enlace para restablecer tu contraseña: ${resetLink}`,
            };

            transporter.sendMail(mailOptions, (err) => {
                if (err) return res.status(500).json({ message: 'Error al enviar el correo', error: err });
                res.json({ message: 'Correo de restablecimiento enviado' });
            });
        });
    });
});

/**
 * Ruta para enviar un correo de verificación
 * Esta ruta permite a los usuarios solicitar un correo de verificación para su cuenta.
 * Se utiliza un token único para verificar la dirección de correo electrónico del usuario.
 */
router.post('/send-verification', isAuthenticated, (req, res) => {
    const { email } = req.user;

    // Generar un token único
    const token = crypto.randomBytes(32).toString('hex');

    // Guardar el token en la base de datos
    const insertQuery = 'INSERT INTO password_resets (email, token) VALUES (?, ?)';
    db.query(insertQuery, [email, token], (err) => {
        if (err) return res.status(500).json({ message: 'Error al generar el token', error: err });

        // Configurar el transporte de correo
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Enviar el correo con el enlace de verificación
        const verificationLink = `http://localhost:3100/verify-email?token=${token}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verificación de correo electrónico',
            text: `Haz clic en el siguiente enlace para verificar tu correo: ${verificationLink}`,
        };

        transporter.sendMail(mailOptions, (err) => {
            if (err) return res.status(500).json({ message: 'Error al enviar el correo', error: err });
            res.json({ message: 'Correo de verificación enviado' });
        });
    });
});

module.exports = router;