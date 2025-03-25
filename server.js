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
const {db , changeDashboardValue, getGroupItems, updateDevice, getDashboardItems} = require("./firebase.js"); 




app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); 

let clients = [];

wss.on('connection', (ws) => {
  console.log('Ein Client verbunden');
  clients.push(ws); 
  listenToGroupItems((groups) => {
    console.log("Gruppen aktualisiert:");
  });
  listenToDashboardItems((dashboardItems) => {
    console.log("Dashboard aktualisiert:");
  });

  ws.on('close', () => {
    console.log('Ein Client hat die Verbindung getrennt');
    clients = clients.filter(client => client !== ws); 
  });
});

function sendToClients(message) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
const userId = "user123";

function  listenToGroupItems(callback) {
  const groupsRef = db.ref("groups");

  groupsRef.child(userId).on("value", (snapshot) => {
    console.log("Groups found in the data snapshot.");
      if (snapshot.exists()) {
          const groups = [];

          snapshot.forEach(groupSnapshot => {
              const groupId = groupSnapshot.child("id").val();
              const groupName = groupSnapshot.child("name").val();
              const groupIconUrl = groupSnapshot.child("iconUrl").val();

              const group = {
                  id: groupId,
                  name: groupName,
                  iconUrl: groupIconUrl,
                  devices: []
              };

              // Lade die Geräte separat
              groupSnapshot.child("devices").forEach(deviceSnapshot => {
                  const deviceType = deviceSnapshot.child("type").val();
                  const deviceData = deviceSnapshot.val();

                  switch (deviceType) {
                      case "StatusDevice":
                          group.devices.push({
                              type: "StatusDevice",
                              id: deviceData.id,
                              name: deviceData.name,
                              description: deviceData.description,
                              value: deviceData.value || "1", // Defaultwert "1"
                              unit: deviceData.unit,
                              group: deviceData.group
                          });
                          break;

                      case "ActionDevice":
                          group.devices.push({
                              type: "ActionDevice",
                              id: deviceData.id,
                              name: deviceData.name,
                              status: deviceData.status || false, // Defaultwert false
                              group: deviceData.group
                          });
                          break;

                      case "TemperatureDevice":
                          group.devices.push({
                              type: "TemperatureDevice",
                              id: deviceData.id,
                              name: deviceData.name,
                              value: deviceData.value,
                              group: deviceData.group
                          });
                          break;

                      default:
                          console.error("Unknown device type:", deviceType);
                          break;
                  }
              });

              groups.push(group);
          });

          callback(groups);

          sendToClients(JSON.stringify({ type: 'group_update', groups }));
      } else {
          console.log("No groups found in the data snapshot.");
          callback([]);
      }
  }, (error) => {
      console.error("Error in listenToGroupItems:", error);
  });
}

function listenToDashboardItems(dashboardItems){   
    console.log("Dashboard aktualisiert:", dashboardItems);
    const dashboardRef = db.ref("dashboard");
    dashboardRef.on("value", (snapshot) => {
        console.log(snapshot);
        if (snapshot.exists()) {
            const dashboardItems = [];

            snapshot.forEach(dashboardItemSnapshot => {
                const dashboardItem = dashboardItemSnapshot.val();
                dashboardItems.push(dashboardItem);
            });

            sendToClients(JSON.stringify({ type: 'dashboard_update', dashboardItems }));
        } else {
            console.log("No dashboard items found in the data snapshot.");
        }

    });

    }

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

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Falsches Passwort" });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);

    res.json({ token });
});

app.get('/', (req, res) => {
    res.redirect('/simulation');
});

app.post('/updateDashboard', async (req, res) => {
    try {
        await changeDashboardValue(req.body.id, req.body.subTitleId, req.body.newValue);
        console.log("Update erfolgreich!");
        res.send("Dashboard-Wert erfolgreich aktualisiert");
    } catch (error) {
        console.error("Fehler:", error);
        res.status(500).send("Fehler beim Aktualisieren des Dashboard-Werts");
    }
});

app.post('/updateDevices', async (req, res) => {
    try {
        await updateDevice(req.body.groupidString, req.body.deviceId, req.body.type, req.body.newValue);
        console.log("Update erfolgreich!");
        res.send("Dashboard-Wert erfolgreich aktualisiert");
    } catch (error) {
        console.error("Fehler:", error);
        res.status(500).send("Fehler beim Aktualisieren des Dashboard-Werts");
    }
}); 


app.get('/groups', async (req, res) => {
    try {
        const groups = await getGroupItems();
        res.json(groups);
    } catch (error) {
        console.error("Fehler beim Laden der Gruppen:", error);
        res.status(500).send("Fehler beim Laden der Gruppen");
    }
});


app.get('/protected', authenticateToken, (req, res) => {
    console.log(req);
    res.sendFile(__dirname + '/protected.html');
});

app.get('/index', basicAuth, (req, res) => {
    console.log(req);
    res.sendFile(__dirname + '/protected.html');
});

app.get('/simulation', basicAuth,  (req, res) => {
    res.sendFile(__dirname + '/public/simulation.html');
});

app.get('/index',  (req, res) => {
    res.sendFile(__dirname + '/protected.html');
});

module.exports = { sendToClients };

server.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});