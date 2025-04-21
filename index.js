require('dotenv').config({ path: './config.env' }); // Cargar variables de entorno desde port.env
const express = require('express')
const cors = require('cors') // Importar cors para manejar CORS
const session = require('express-session') // Importar express-session para manejar sesiones
const passport = require('passport') // Importar passport para autenticación
const http = require('http');
const { Server } = require('socket.io');

// Importar las rutas de la aplicación
const productsRoutes = require('./src/routes/products'); // Ajusta la ruta según la ubicación de tu archivo
const categoriesRoutes = require('./src/routes/categories'); // Ajusta la ruta según la ubicación de tu archivo
const cartRoutes = require('./src/routes/cart'); // Ajusta la ruta según la ubicación de tu archivo
const authRoutes = require('./src/routes/auth'); // Importar las rutas de autenticación
const ordersRoutes = require('./src/routes/orders'); // Importar las rutas de pedidos
const usersRoutes = require('./src/routes/users'); // Importar las rutas de usuarios
const inventoryRoutes = require('./src/routes/inventory'); // Importar las rutas de inventario
const reportsRoutes = require('./src/routes/reports'); // Importar las rutas de reportes
const paymentsRoutes = require('./src/routes/payments'); // Importar las rutas de pagos
const notificationsRoutes = require('./src/routes/notifications'); // Importar las rutas de notificaciones
const reviewsRoutes = require('./src/routes/reviews'); // Importar las rutas de reseñas
const db = require('./src/database/db'); // Importar la conexión a la base de datos

/**
 * Inicializar la aplicación Express
 * Aquí se inicializa la aplicación Express y se configuran los middlewares necesarios.
 */
const app = express(); // Crear una instancia de Express
const server = http.createServer(app); // Crear un servidor HTTP
const io = new Server(server); // Inicializar Socket.IO

/**
 * Middleware para manejar el cuerpo de las solicitudes POST    
 */
app.use(express.json()) // Para JSON
app.use(express.urlencoded({ extended: true })) 
// Para datos URL-encoded
const allowedOrigins = ['http://localhost:4200', 'http://otro-origen.com'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
}));

/**
 * Configuración de sesiones
 * Aquí puedes configurar la sesión para manejar la autenticación y el estado del usuario.
 */
app.use(
  session({
    secret: 'your_secret_key', // Cambia esto por una clave secreta segura
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Asegúrate de que sea `false` en desarrollo (sin HTTPS)
      httpOnly: true, // Las cookies no son accesibles desde JavaScript del cliente
    },
  })
);

/**
 * Configuración de Passport
 * Aquí puedes configurar la estrategia de autenticación que estés utilizando (local, JWT, etc.)
 */
app.use(passport.initialize());
app.use(passport.session());

/**
 * Rutas de la aplicación
 */
app.use('/api/products', productsRoutes); // Rutas para productos
app.use('/api/categories', categoriesRoutes); // Rutas para categorías
app.use('/api/cart', cartRoutes); // Rutas para el carrito
app.use('/api/auth', authRoutes); // Rutas para autenticación
app.use('/api/orders', ordersRoutes); // Registrar las rutas de pedidos
app.use('/api/users', usersRoutes); // Registrar las rutas de usuarios
app.use('/api/inventory', inventoryRoutes); // Registrar las rutas de inventario
app.use('/api/reports', reportsRoutes); // Registrar las rutas de reportes
app.use('/api/payments', paymentsRoutes); // Registrar las rutas de pagos
app.use('/api/notifications', notificationsRoutes); // Registrar las rutas de notificaciones
app.use('/api/reviews', reviewsRoutes); // Registrar las rutas de reseñas


/**
 * Configuración de Socket.IO
 * Aquí se configura Socket.IO para manejar las conexiones en tiempo real.
 */
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Escuchar eventos personalizados
  socket.on('sendNotification', (data) => {
      console.log('Notificación recibida:', data);

      // Enviar notificación a todos los clientes conectados
      io.emit('receiveNotification', data);
  });

  socket.on('disconnect', () => {
      console.log('Usuario desconectado:', socket.id);
  });
});


/**
 * Configuración del servidor
 */
const port = process.env.PORT || 3000; // Usar el puerto definido en .env o un valor por defecto

/**
 * Aquí se inicia el servidor y se escucha en el puerto definido.
 */
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})