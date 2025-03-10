const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = "mein_super_geheimes_token"; // 🔴 Ändere das in eine sichere Umgebungsvariable!

app.use(express.static('public'));
app.use(bodyParser.json()); // Für JSON-Requests

// Simulierte Benutzerdatenbank (statt einer echten Datenbank)
const users = [
    {
        id: 1,
        username: "testuser",
        password: bcrypt.hashSync("testpass", 10) // Passwort gehasht speichern
    }
];

// 🔹 **Login Route**
app.post('/login', (req, res) => {
    console.log(req.body);
    const { username, password } = req.body;

    const user = users.find(u => u.username === username);
    if (!user) return res.status(400).json({ message: "Benutzer nicht gefunden" });

    // Passwort überprüfen
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Falsches Passwort" });

    // JWT erzeugen
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: "1h" });

    res.json({ token });
});

// 🔹 **Middleware zum Schutz von Routen**
const authenticateToken = (req, res, next) => {
    console.log(req.headers);
    const authHeader = req.headers['authorization'];
    const token = authHeader.split(' ')[1]
    if (!token) {
        console.log("No token");
        return res.sendStatus(403);
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) 
            {
                console.log("Token invalid");
                return res.sendStatus(403);
            }
        req.user = user;
        next();
    });
};

// 🔹 **Geschützte Route (nur mit gültigem Token erreichbar)**
app.get('/protected', authenticateToken, (req, res) => {
    console.log(req);
    res.json({ message: true, user: req.user });
});

// 🔹 **Statische HTML-Datei ausliefern**
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// 🔹 **Server starten**
app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});