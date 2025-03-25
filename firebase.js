require('dotenv').config();
const { json } = require('body-parser');
const admin = require("firebase-admin");
const fs = require('fs');
//const serviceAccountPath = "/etc/secrets/service-account.json"

console.log("Firebase Credentials:", process.env.FIREBASE_CREDENTIALS);
const credentials = Buffer.from(process.env.FIREBASE_CREDENTIALS, 'base64').toString('utf8');
fs.writeFileSync('./service-account.json', credentials);

//const serviceAccount = require(serviceAccountPath);



admin.initializeApp({
  //credential: admin.credential.cert(serviceAccount),
  credential: admin.credential.cert(JSON.parse(credentials)),
  databaseURL: "https://homedroid-728c6-default-rtdb.firebaseio.com/"
});


const db = admin.database();



/**
 * Aktualisiert einen Wert im Dashboard.
 * @param {string} id - Die ID des Dashboards.
 * @param {string} subTitleId - Die Indexnummer des Wertes.
 * @param {string} newValue - Der neue Wert.
 * @returns {Promise<void>}
 */
async function changeDashboardValue(id, subTitleId, newValue){
  console.log("Updating dashboard value:", id-1, subTitleId, newValue);
    const databaseId = parseInt(id) - 1;
    const dashboardRef = db.ref(`dashboard/${databaseId}`);
  
    try {
      const snapshot = await dashboardRef.get();
      if (!snapshot.exists()) {
        console.error("Kein Dashboard mit dieser ID gefunden");
        return;
      }
  
      const dashboard = snapshot.val();
      const number = parseInt(Number(subTitleId));
      console.log("Number:", number);
      if (isNaN(number) || number < 0 || number >= dashboard.values.length) {
        console.error("Ungültiger Index oder SubTitleId");
        return;
      }
  
      // Werte aktualisieren
      dashboard.values[number] = newValue;
  
      // In Firebase speichern
      await dashboardRef.set(dashboard);
      console.log("Dashboard-Wert erfolgreich aktualisiert");
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Dashboard-Werts:", error);
    }
};

async function getGroupItems() {
  const groupsRef = db.ref("groups");
  const userId = "user123";

  try {
      const snapshot = await groupsRef.child(userId).get();

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

          return groups;
      } else {
          console.log("No groups found in the data snapshot.");
          return [];
      }
  } catch (e) {
      console.error("Error in getGroupItems:", e);
      return [];
  }
}

async function getDashboardItems(){   
    console.log("Get Dashboard Datas:");
    const dashboardRef = db.ref("dashboard");
    dashboardRef.get(snapshot => {
        console.log(snapshot);
        if (snapshot.exists()) {
            const dashboardItems = [];

            snapshot.forEach(dashboardItemSnapshot => {
                const dashboardItem = dashboardItemSnapshot.val();
                dashboardItems.push(dashboardItem);
            });
            return dashboardItems;

        } else {
            console.log("No dashboard items found in the data snapshot.");
        }

    });

}

async function updateDevice(groupId, deviceId, type,  newValue) {
  console.log("Updating device:", groupId, deviceId, type, newValue);
  const groupsRef = db.ref("groups");
  const userId = "user123";

  try {
    const snapshot = await groupsRef.child(userId).get();

    if (snapshot.exists()) {
      console.log("Groups found in the data snapshot.");
     // console.log("Groups:", snapshot.val());
      snapshot.forEach(groupSnapshot => {    
        if (Number(groupSnapshot.child("id").val()) == Number(groupId)) {
          console.log("inside");
          console.log("Devices:", groupSnapshot.child("devices").val());
          const devicesRef = groupSnapshot.child("devices"); // Geräte-Referenz
            if (devicesRef.exists()) {
              devicesRef.forEach(deviceSnapshot => {
                console.log(deviceSnapshot.child("id").val(), deviceId);

                if (Number(deviceSnapshot.child("id").val()) === Number(deviceId)) {
                  console.log("inside2");

                  const deviceRef = deviceSnapshot.ref; 

                  switch (type) {
                    case "StatusDevice":
                      console.log("Updating status device:", newValue);
                      deviceRef.update({ value: newValue })
                        .then(() => console.log("Update erfolgreich"))
                        .catch(error => console.error("Fehler beim Update:", error));
                        updateDeviceInFavorites(deviceId, type, newValue);
                      break;

                    case "ActionDevice":
                      console.log("Updating action device:", newValue);
                      deviceRef.update({ status: newValue })
                        .then(() => console.log("Update erfolgreich"))
                        .catch(error => console.error("Fehler beim Update:", error));
                        updateDeviceInFavorites(deviceId, type, newValue);

                      break;

                    case "TemperatureDevice":
                      console.log("Updating temperature device:", newValue);
                      deviceRef.update({ value: newValue })
                        .then(() => console.log("Update erfolgreich"))
                        .catch(error => console.error("Fehler beim Update:", error));
                        updateDeviceInFavorites(deviceId, type, newValue);
                      break;

                    default:
                      console.error("Unbekannter Gerätetyp:", type);
                      break;
                  }
                }
              });
            }
        }
      });
    } else {
      console.log("No groups found in the data snapshot.");
    }
  } catch (e) {
    console.error("Error in updateDevice:", e);
  }

  
}
  
async function updateDeviceInFavorites(deviceId, type, newValue) {
  const favoritesRef = db.ref("favorites");
  const userId = "user123";

  try {
    const snapshot = await favoritesRef.child(userId).get();

        if (snapshot.exists()) {
            snapshot.forEach(deviceSnapshot => {
            if (Number(deviceSnapshot.child("id").val()) === Number(deviceId)) {
              const deviceRef = deviceSnapshot.ref;
              switch (type) {
                case "StatusDevice":
                  deviceRef.update({ value: newValue })
                    .then(() => console.log("Update erfolgreich"))
                    .catch(error => console.error("Fehler beim Update:", error));
                  break;

                case "ActionDevice":
                  deviceRef.update({ status: newValue })
                    .then(() => console.log("Update erfolgreich"))
                    .catch(error => console.error("Fehler beim Update:", error));
                  break;

                case "TemperatureDevice":
                  deviceRef.update({ value: newValue })
                    .then(() => console.log("Update erfolgreich"))
                    .catch(error => console.error("Fehler beim Update:", error));
                  break;

                default:
                  console.error("Unbekannter Gerätetyp:", type);
                  break;
              }
            }
          });
        } else {
          console.log("No favorites found in the data snapshot.");
        }
  }catch (e) {
    console.error("Error in updateDeviceInFavorites:", e);
  }
}

module.exports = { db, changeDashboardValue, getGroupItems, updateDevice, getDashboardItems};