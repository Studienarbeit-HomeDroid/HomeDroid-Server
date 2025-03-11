
function updateStatus(buttonId, inputId, statusId) {
    const input = document.getElementById(inputId);
    const status = document.getElementById(statusId);

    if (input && status) {
        status.textContent = input.value;
    }

    
}

function toggleDoor() {
    updateStatus("door-button", "door-input", "status-door");
}

function toggleWindow() {
    updateStatus("window-button", "window-input", "status-window");
}

function toggleDoors() {
    updateStatus("doors-button", "doors-input", "status-doors");
}

function toggleBezugPower() {
    updateStatus("power-bezug-button", "power-bezug-input", "status-power-bezug");
}

function toggleLieferungPower() {
    updateStatus("power-lieferung-button", "power-lieferung-input", "status-power-lieferung");
}

function toggleBezugMeter() {
    updateStatus("meter-bezug-button", "meter-bezug-input", "status-meter-bezug");
}

function toggleLieferungMeter() {
    updateStatus("meter-lieferung-button", "meter-lieferung-input", "status-meter-lieferung");
}

function toggleTagesSolar() {
    updateStatus("solar-tages-button", "solar-tages-input", "status-solar-tages");
}

function toggleGesamtSolar() {
    updateStatus("solar-gesamt-button", "solar-gesamt-input", "status-solar-gesamt");
}