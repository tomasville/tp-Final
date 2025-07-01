const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('usuarios.db');

db.serialize(() => {
  db.run("ALTER TABLE usuarios ADD COLUMN email TEXT", (err) => {
    // Si la columna ya existe, ignora el error
  });
});

db.close();