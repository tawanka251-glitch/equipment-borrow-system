const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'wab_borrow_return',
      port: 3306
    });
    console.log('connected');
    const [tables] = await conn.query('SHOW TABLES');
    console.log('tables:', tables);
    const [cols] = await conn.query("SHOW COLUMNS FROM users");
    console.log('users columns:', cols);
    await conn.end();
  } catch (err) {
    console.error('error:', err.message);
    process.exit(1);
  }
})();