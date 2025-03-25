const localSocket = "ws://localhost:3000";
const localAPI = "http://localhost:3000";
const remoteSocket = "wss://homedroid-server.onrender.com";
const remoteAPI = "https://homedroid-server.onrender.com";
let type = true; 
let groups = []; 
let dashboardItems = [];

// socket.onopen = () => {
//     console.log('WebSocket-Verbindung geöffnet');
// };

// socket.onmessage = (event) => {
//     console.log('Nachricht vom Server:', event.data);
//     const reader = new FileReader();

//     reader.onloadend = () => {
//         // Konvertiere den Inhalt des Blobs in einen String
//         const jsonString = reader.result;
        
//         // Jetzt kannst du den JSON-String in ein JavaScript-Objekt umwandeln
//         try {
//             const data = JSON.parse(jsonString);
//             console.log('Empfangene JSON-Daten:', data);
//         } catch (error) {
//             console.error('Fehler beim Parsen der JSON-Daten:', error);
//         }
//     };

//     reader.readAsText(event.data);
// };

// socket.onclose = () => {
//     console.log('WebSocket-Verbindung geschlossen');
// };

const socket = new WebSocket(remoteSocket);

socket.onopen = () => {
    console.log("Verbindung zum Server hergestellt!");
};

socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'group_update') {
        console.log("Gruppen aktualisiert:", message.groups);
        groups = message.groups;
        createGroups();
    }
    if (message.type === 'dashboard_update') {
        console.log("Dashboard datas:", message.dashboardItems);
        dashboardItems = message.dashboardItems;
        createDashboard()
    }

};

// document.addEventListener("DOMContentLoaded", async (event) => {
//     const response = await fetch("http://localhost:3000/groups", {
//         method: "GET",
//         headers: {
//             "Content-Type": "application/json"
//         },
//     });

//     if (response.ok) {
//         console.log("Dashboard-Wert erfolgreich aktualisiert");

//         groups = await response.json();
//         createGroups();
//         console.log(groups);
//     } else {
//         console.error("Fehler:", await response.text());
//     }
//   });

running = false

function startSimulation() {
    running = true;
    randomDeviceAction(true);
    randomDashboardAction(true);
    stopbtn = document.getElementById("stop-btn");
    stopbtn.className = ""
    stopbtn.disabled = false;
    startbtn = document.getElementById("start-btn");
    startbtn.className = "disabled"
    startbtn.disabled = true;
}

function stopSimulation() {
    running = false;
    stopbtn = document.getElementById("stop-btn");
    stopbtn.className = "disabled"
    stopbtn.disabled = true;
    startbtn = document.getElementById("start-btn");
    startbtn.className = ""
    startbtn.disabled = false;
}

randomDashboardAction = (type) => {
    if (!running || dashboardItems.length === 0) {
        return;
    }
    
    console.log("Dashboard Simulation Started");

    const randomElement = dashboardItems[getRandomInt(0, dashboardItems.length - 1)];

    if (randomElement.values.length > 0) {
        const randomIndex = getRandomInt(0, randomElement.values.length - 1);

        if (randomElement.id == "1") {
            doorstatustext = getRandomBool() ? "offen" : "geschlossen";
            updateDashboard(randomElement.id, randomIndex, null, `dash-value-${randomElement.id}${randomIndex}`);
        } else {
            let result = getRandomBool() ? parseInt(randomElement.values[randomIndex]) + 1 : parseInt(randomElement.values[randomIndex]) - 1;
            if(result < 0) result = result * -1;
            let inputId = `input-dash-${randomElement.id}${randomIndex}`;
            let statusId = `dash-value-${randomElement.id}${randomIndex}`;
            
            let input = document.getElementById(inputId);
            if (input) input.value = result;

            let statusvalue = document.getElementById(statusId);
            if (statusvalue) statusvalue.textContent = result;

            updateDashboard(randomElement.id, randomIndex, inputId, statusId);
        }
    }

    if (type) {
        setTimeout(() => randomDashboardAction(true), 1000);
    }
};

randomDeviceAction = (type) => {
    if(!running)
    {
        return;
    }
    console.log("Simulation Started")
    randomGroup = getRandomInt(0, groups.length-1);
    console.log(randomGroup);
    devices = groups[randomGroup].devices;
    randomDevice = getRandomInt(0, devices.length-1);
    console.log(randomDevice);
    if(groups[randomGroup].devices.length != 0)
    {
        console.log(devices[randomDevice].type);
        if(devices[randomDevice].type == "ActionDevice")
            {
                console.log("ActionDevice");
                console.log(devices[randomDevice]);
                updateStatus(randomGroup, devices[randomDevice].id, null, `action-button-${devices[randomDevice].id}`, devices[randomDevice].type, devices[randomDevice].status, null);
            }else{
                console.log("StatusDevice");
                console.log(devices[randomDevice]);
                randomValue = getRandomInt(0, 100);
                inputId = `input-${devices[randomDevice].id}`;
                statusId = `status-${devices[randomDevice].id}`;
                input = document.getElementById(inputId);
                input.value = randomValue;
                statusvalue = document.getElementById(statusId);
                statusvalue.textContent = input.value;
                updateStatus(randomGroup, devices[randomDevice].id, inputId, statusId, devices[randomDevice].type, null, null);
            }
    }
   

    if(type)
    {
        setTimeout(() => randomDeviceAction(true), 500);
    }


}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomBool() {
    return Math.random() < 0.5;
}

function createDashboard() {
    const dashboardcontainer = document.getElementById("dashboard-content");
    dashboardcontainer.innerHTML = '';
    dashboardItems.forEach(element => {
        const div = document.createElement("div");
        div.className = "dashboard-item";
        const p = document.createElement("p");
        p.className = "item-title"
        p.textContent = element.title;
        div.appendChild(p);
        element.subtitle.forEach((subtitle,index) => {
            const description = document.createElement("p");
            description.className = "desc";
            description.textContent = subtitle;
            const value = document.createElement("p");
            value.textContent = element.values[index];
            value.className = "value";
            value.id = `dash-value-${element.id}${index}`;
            div.appendChild(description);
            div.appendChild(value);
            if(element.id == "1")
            {
                const button = document.createElement("button");
                button.className = "door-button";
                button.textContent = "öffen/schließen";
                button.onclick = () => updateDashboard(element.id, index, null, `dash-value-${element.id}${index}`);
                div.appendChild(button);
            }
            else
            {
            const editcontainer = document.createElement("div");
            const input = document.createElement("input");
            const button = document.createElement("button");
            button.textContent = "✅";
            button.className = "edit-button-dash";
            button.onclick = () => updateDashboard(element.id, index, `input-dash-${element.id}${index}`, `dash-value-${element.id}${index}`);
            editcontainer.className = "edit-container-dash";
            input.className = "edit-input";
            input.type = "number";
            input.id = `input-dash-${element.id}${index}`;
            editcontainer.appendChild(input);
            editcontainer.appendChild(button);
            div.appendChild(editcontainer);
            }
        }); 
                

        dashboardcontainer.appendChild(div);

        

    });

}


function createGroups()
    {
        const roomscontainer = document.getElementById("rooms");
        roomscontainer.innerHTML = ''; 
        groups.forEach(element => {
            const div = document.createElement("div");
            div.className = "room-container";
            const h2 = document.createElement("h2");
            h2.textContent = element.name;
            div.appendChild(h2);
            roomscontainer.appendChild(div);
            const actioncontainer = document.createElement("div");
            const statuscontainer = document.createElement("div");
            const temperatureDevicecontainer = document.createElement("div");
            element.devices.forEach(device => {
                switch (device.type) {
                    case "TemperatureDevice":
                        div.appendChild(temperatureDevicecontainer);
                        temperatureDevicecontainer.className = "device-container-status";
                        createStatusDevice(element.id, temperatureDevicecontainer, device, false);
                        break;
                    case "StatusDevice":
                        div.appendChild(statuscontainer);
                        statuscontainer.className = "device-container-status";
                        createStatusDevice(element.id, statuscontainer, device, true);
                        break;
                    case "ActionDevice":
                        div.appendChild(actioncontainer);
                        actioncontainer.className = "device-container-action";
                        createActionDevice(element.id, actioncontainer, device);
                        break;
                    default:
                        console.error("Unbekannter Gerätetyp:", device.type);
                        break;
                }
            });
        });
    }

    createStatusDevice = (groupId, div, device, istemp) => {
        const statusdevicecontainer = document.createElement("div");
        statusdevicecontainer.className = "status-device-container";
        const status = document.createElement("p");
        const name = document.createElement("p");
        const editcontainer = document.createElement("div");
        const input = document.createElement("input");
        const button = document.createElement("button");
        button.textContent = "✅";
        button.className = "edit-button";
        editcontainer.className = "edit-container";
        input.className = "edit-input";
        input.type = "number";
        input.id = `input-${device.id}`;
        editcontainer.appendChild(input);
        editcontainer.appendChild(button);
        name.className = "device-name";
        name.textContent = device.name ;
        status.className = "device-status";
        status.textContent = istemp ? device.value + device.unit : device.value + "°C"; ;
        status.id = `status-${device.id}`;
        button.onclick = () => updateStatus(groupId ,device.id, `input-${device.id}`, `status-${device.id}`, device.type, null, null);
        statusdevicecontainer.appendChild(name);
        statusdevicecontainer.appendChild(status);
        statusdevicecontainer.appendChild(editcontainer);
        div.appendChild(statusdevicecontainer);
    }


    createActionDevice = (groupId, div, device) => {
        const btncontainer = document.createElement("div");
        btncontainer.className = "button-container";
        const button = document.createElement("button");
        const label = document.createElement("p");
        label.className = "device-label";
        label.textContent = device.name;
        button.textContent = device.status ? "On" : "Off";
        button.className = device.status ? "action-button-on" : "action-button";
        button.id = `action-button-${device.id}`;
        button.onclick = () => {
            
            updateStatus(groupId, device.id, null, `action-button-${device.id}`, device.type, device.status, button);
        }
        btncontainer.appendChild(label);
        btncontainer.appendChild(button);
        div.appendChild(btncontainer);
    }

    const updateStatus = async (groupId, deviceId, inputId, statusId, type, value, btn) => 
    {           
        console.log(groupId, deviceId, inputId, statusId, type);
        let newValue;
        groupidString = String(groupId);

        if(type == "ActionDevice")
        {
            console.log("ActionDevice");
            console.log(value);
            newValue = !value;
        
        }
        else{
            console.log("StatusDevice");
            input = document.getElementById(inputId);
            statusvalue = document.getElementById(statusId);
            statusvalue.textContent = input.value;
            newValue = input.value;

        }

        const url = remoteAPI+"/updateDevices";
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ groupidString, deviceId, type, newValue})
        });
    
        if (response.ok) {
            console.log("Dashboard-Wert erfolgreich aktualisiert");
        } else {
            console.error("Fehler:", await response.text());
        }
    }
  





doorstatus = false
doorstatustext = "geschlossen"


async function updateDashboard(id, subTitleId, inputId, statusId) {
    let input
    if(id != "1"){
        input = document.getElementById(inputId);
    }else{
        doorstatus = !doorstatus;
        doorinput = {value: doorstatus ? "offen" : "geschlossen"};
        input = doorinput;
    }
    const status = document.getElementById(statusId);
    status.textContent = input.value;

    const url = remoteAPIAPI+"/updateDashboard";
    console.log(id,subTitleId,inputId,statusId, input.value);
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ id, subTitleId, newValue: input.value })
    });

    if (response.ok) {
        console.log("Dashboard-Wert erfolgreich aktualisiert");
    } else {
        console.error("Fehler:", await response.text());
    }
}



function toggleDoor() {
    doorstatus = !doorstatus;
    doorinput = {value: doorstatus ? "offen" : "geschlossen"};
    updateDashboard("1", "1", doorinput, "status-door");
}

function toggleWindow() {
    updateDashboard("2", "1", "window-input", "status-window");
}

function toggleDoors() {
    updateDashboard("3", "1", "doors-input", "status-doors");
}

function toggleBezugPower() {
    updateDashboard("4", "1", "power-bezug-input",  "status-power-bezug");
}

function toggleLieferungPower() {
    updateDashboard("4", "2", "power-lieferung-input", "status-power-lieferung");
}

function toggleBezugMeter() {
    updateDashboard("5", "1", "meter-bezug-input" , "status-meter-bezug");
}

function toggleLieferungMeter() {
    updateDashboard("5", "2", "meter-lieferung-input", "status-meter-lieferung");
}

function toggleTagesSolar() {
    updateDashboard("6", "1", "solar-tages-input", "solar-tages-status");
}

function toggleGesamtSolar() {
    updateDashboard("6", "2", "solar-gesamt-input",     "solar-gesamt-status");
}