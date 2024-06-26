// db.js
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST||sql12.freemysqlhosting.net,
    user: process.env.DB_USER||sql12716073,
    password: process.env.DB_PASS||ZUDx3ugtXA,
    database: process.env.DB_NAME||sql12716073
});

module.exports = pool.promise();