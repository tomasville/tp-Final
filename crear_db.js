const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('usuarios.db');

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS usuarios (username TEXT, password TEXT)");
  db.run("INSERT INTO usuarios (username, password) VALUES (?, ?)", ["admin", "1234"]);
});

db.close();