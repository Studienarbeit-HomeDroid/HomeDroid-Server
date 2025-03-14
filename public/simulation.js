const local = "ws://localhost:3000";
const remote = "wss://homedroid-server.onrender.com";

const socket = new WebSocket(remote);


socket.onopen = () => {
    console.log('WebSocket-Verbindung geöffnet');
};

socket.onmessage = (event) => {
    console.log('Nachricht vom Server:', event.data);
    const reader = new FileReader();

    reader.onloadend = () => {
        // Konvertiere den Inhalt des Blobs in einen String
        const jsonString = reader.result;
        
        // Jetzt kannst du den JSON-String in ein JavaScript-Objekt umwandeln
        try {
            const data = JSON.parse(jsonString);
            console.log('Empfangene JSON-Daten:', data);
        } catch (error) {
            console.error('Fehler beim Parsen der JSON-Daten:', error);
        }
    };

    reader.readAsText(event.data);
};

socket.onclose = () => {
    console.log('WebSocket-Verbindung geschlossen');
};

doorstatus = false
doorstatustext = "geschlossen"

function updateStatus(buttonId, inputId, statusId, typeId, roomType) {
    const status = document.getElementById(statusId);

    if(buttonId == "1"){
    {
        status.textContent = doorstatustext;
        message = {
            "roomtype": roomType,
            "id": buttonId,
            "typeid": typeId,
            "value": doorstatustext
        }
        socket.send(JSON.stringify(message));
    }
    }
    else{
    const input = document.getElementById(inputId);
    if (input && status) {
        message = {
            "roomtype": roomType,
            "id": buttonId,
            "typeid": typeId,
            "value": input.value
        }
        socket.send(JSON.stringify(message));

        status.textContent = input.value;
    }
    }
}



function toggleDoor() {
    doorstatus = !doorstatus;
    doorstatustext = doorstatus ? "offen" : "geschlossen";
    updateStatus("1", "door-i", "status-door", "1", "dashboard");
}

function toggleWindow() {
    updateStatus("2", "window-input", "status-window", "1", "dashboard");
}

function toggleDoors() {
    updateStatus("3", "doors-input", "status-doors", "1", "dashboard");
}

function toggleBezugPower() {
    updateStatus("4", "power-bezug-input", "status-power-bezug", "1", "dashboard");
}

function toggleLieferungPower() {
    updateStatus("4", "power-lieferung-input", "status-power-lieferung", "2", "dashboard");
}

function toggleBezugMeter() {
    updateStatus("5", "meter-bezug-input", "status-meter-bezug", "1" , "dashboard");
}

function toggleLieferungMeter() {
    updateStatus("5", "meter-lieferung-input", "status-meter-lieferung", "2", "dashboard");
}

function toggleTagesSolar() {
    updateStatus("6", "solar-tages-input", "status-solar-tages", "1", "dashboard");
}

function toggleGesamtSolar() {
    updateStatus("6", "solar-gesamt-input", "status-solar-gesamt", "2", "dashboard");
}