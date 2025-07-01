const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const multer = require('multer');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sirve archivos estáticos (html, css, img, etc)
app.use(express.static(__dirname));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Cambia esto por tu usuario de MySQL
    password: 'familiavillegas', // Cambia esto por tu contraseña de MySQL
    database: 'merpyc',
    port: 3306 // Este es el puerto de MySQL, no de Express
});

db.connect((err) => {
    if (err) {
        console.error('Error de conexión a MySQL:', err);
    } else {
        console.log('Conectado a MySQL');
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query("SELECT * FROM usuarios WHERE username = ? AND password = ?", [username, password], (err, results) => {
        if (results.length > 0) {
            if (username === 'admin') {
                res.redirect(`/admin.html?usuario=${encodeURIComponent(username)}`);
            } else {
                res.redirect(`/inicio.html?usuario=${encodeURIComponent(username)}`);
                
            }
        } else {
            res.send('Usuario o contraseña incorrectos');
        }
    });
});

app.post('/register', (req, res) => {
    const { username, email, password, document, phone, gender } = req.body;
    db.query("SELECT * FROM usuarios WHERE username = ?", [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.json({ success: false, message: 'Error en la consulta' });
        }
        if (results.length > 0) {
            res.json({ success: false, message: 'El usuario ya existe' });
        } else {
            db.query(
                "INSERT INTO usuarios (username, email, password, document, phone, gender) VALUES (?, ?, ?, ?, ?, ?)",
                [username, email, password, document, phone, gender],
                (err2) => {
                    if (err2) {
                        console.error(err2);
                        res.json({ success: false, message: 'Error al registrar usuario' });
                    } else {
                        res.json({ success: true, message: 'Usuario registrado con éxito' });
                    }
                }
            );
        }
    });
});

app.get('/api/usuarios', (req, res) => {
    db.query("SELECT id, username, email, document, phone, gender FROM usuarios", (err, results) => {
        if (err) return res.json([]);
        res.json(results);
    });
});

// Eliminar usuario
app.delete('/api/usuarios/:id', (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM usuarios WHERE id = ?", [id], (err, result) => {
        if (err) return res.json({ success: false });
        res.json({ success: true });
    });
});

// Editar usuario
app.put('/api/usuarios/:id', express.json(), (req, res) => {
    const id = req.params.id;
    const { username, email, document, phone, gender } = req.body;
    db.query(
        "UPDATE usuarios SET username = ?, email = ?, document = ?, phone = ?, gender = ? WHERE id = ?",
        [username, email, document, phone, gender, id],
        (err, result) => {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        }
    );
});

// Para subir archivos de planes (a disco)
const storagePlanes = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'priv', 'planes'));
    },
    filename: function (req, file, cb) {
        if (file.fieldname === 'gimnasio') cb(null, 'GIMNASIO - 25.pdf');
        else if (file.fieldname === 'varones') cb(null, 'PLANES JUNIO 25 - VARONES.pdf');
        else if (file.fieldname === 'damas') cb(null, 'PLANES JUNIO 25 - MUJERES.pdf');
    }
});
const uploadPlanes = multer({ storage: storagePlanes });

app.post('/subir-planes', uploadPlanes.fields([
    { name: 'gimnasio', maxCount: 1 },
    { name: 'varones', maxCount: 1 },
    { name: 'damas', maxCount: 1 }
]), (req, res) => {
    res.json({ success: true });
});

app.get('/api/usuarios/:username', (req, res) => {
    const username = req.params.username;
    db.query("SELECT username AS name, email, phone, gender, document FROM usuarios WHERE username = ?", [username], (err, results) => {
        if (err || results.length === 0) {
            return res.json({});
        }
        res.json(results[0]);
    });
});

// Para subir foto de perfil (a memoria/base de datos)
const storageFoto = multer.memoryStorage();
const uploadFoto = multer({ storage: storageFoto });

app.post('/api/usuarios/:username/foto', uploadFoto.single('foto'), (req, res) => {
    const username = req.params.username;
    const foto = req.file ? req.file.buffer : null;
    if (!foto) return res.json({ success: false, message: 'No se recibió la imagen' });
    db.query('UPDATE usuarios SET foto = ? WHERE username = ?', [foto, username], (err) => {
        if (err) return res.json({ success: false, message: 'Error al guardar la imagen' });
        res.json({ success: true });
    });
});

// Para devolver la foto como base64
app.get('/api/usuarios/:username/foto', (req, res) => {
    const username = req.params.username;
    db.query('SELECT foto FROM usuarios WHERE username = ?', [username], (err, results) => {
        if (err || results.length === 0 || !results[0].foto) {
            return res.json({ foto: null });
        }
        const base64 = results[0].foto.toString('base64');
        res.json({ foto: `data:image/jpeg;base64,${base64}` });
    });
});

app.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
});