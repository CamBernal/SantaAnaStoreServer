const mysql = require('mysql2');

// Crear la conexión a la base de datos
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agroquimicos'
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
        process.exit(1); // Salir si hay un error
    }
    console.log('Conexión a la base de datos MySQL exitosa');
});

module.exports = connection;