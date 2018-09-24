let mysql = require('mysql');
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'phpmyadmin',
    password: '123!@#QWEasd',
    database: 'vehcurity_db'
});

module.exports = connection;