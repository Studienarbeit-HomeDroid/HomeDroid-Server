const express = require('express');
const app = express();
const port = process.env.PORT || 3000;


app.use(express.static('public'))

// Statische HTML-Datei ausliefern
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
});

app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});
