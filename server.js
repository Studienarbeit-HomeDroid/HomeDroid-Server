const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const http = require('http');



const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = "mein_super_geheimes_token"; 
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


wss.on('connection', (ws) => {
    console.log('Ein Client verbunden');
    ws.send('Hallo Server!');

    ws.on('message', (message) => {
        const jsonMessage = JSON.parse(message);
        console.log('Empfangene Nachricht: ', jsonMessage);
        wss.clients.forEach((client) => {
            if ( client.readyState === WebSocket.OPEN) {
        
                client.send(JSON.stringify(jsonMessage));
            }
        });
    });

    ws.on('close', () => {
        console.log('Ein Client hat die Verbindung getrennt');
    });
});




app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); 

const users = [
    {
        id: 1,
        username: "testuser",
        password: bcrypt.hashSync("testpass", 10) 
    }
];

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

const basicAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Login erforderlich"');
        return res.sendStatus(401);
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    const user = users.find(u => u.username === username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Login erforderlich"');
        return res.status(401).json({ message: "Falsche Anmeldedaten" });
    }

    req.user = user;
    next();
};

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

app.get('/', (req, res) => {
    res.redirect('/simulation');
});

app.get('/protected', authenticateToken, (req, res) => {
    console.log(req);
    res.json({ message: true, user: req.user });
    res.sendFile(__dirname + '/protected.html');
});

// 🔹 **Statische HTML-Datei ausliefern**
app.get('/simulation', basicAuth,  (req, res) => {
    res.sendFile(__dirname + '/public/simulation.html');
});

app.get('/index',  (req, res) => {
    res.sendFile(__dirname + '/protected.html');
});



// 🔹 **Server starten**
server.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});