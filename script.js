// 1. Add CSS Smoothing (Makes the marker glide instead of teleport)
const style = document.createElement('style');
style.innerHTML = `.leaflet-marker-icon { transition: all 1.5s linear !important; }`;
document.head.appendChild(style);

// 2. Initialize Map (Center of Pampanga)
const map = L.map('map').setView([15.0286, 120.6898], 13);
const offlineTileUrl = './tiles/{z}/{x}/{y}.png'; 

L.tileLayer(offlineTileUrl, {
    minZoom: 11,
    maxZoom: 16, // Support for your new tiles
    attribution: 'GuardianBand Offline Maps'
}).addTo(map);

// 3. Setup User Marker
let userMarker = L.marker([15.0286, 120.6898]).addTo(map)
    .bindPopup('<b>Patient Location</b>')
    .openPopup();

// 4. Bluetooth Configuration
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

const connectBtn = document.getElementById('connectBle');
const statusText = document.getElementById('status');
const coordsText = document.getElementById('coords');

connectBtn.addEventListener('click', async () => {
    try {
        statusText.innerText = "Searching...";
        statusText.style.color = "orange";

        const device = await navigator.bluetooth.requestDevice({
            filters: [{ name: 'GuardianBand_Device' }],
            optionalServices: [SERVICE_UUID]
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_UUID);
        const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

        statusText.innerText = "Connected";
        statusText.style.color = "#28a745";
        connectBtn.style.display = "none";

        await characteristic.startNotifications();
        
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
            const rawData = new TextDecoder().decode(event.target.value);
            const [lat, lng] = rawData.split(',').map(Number);

            if (!isNaN(lat) && !isNaN(lng)) {
                const newPos = [lat, lng];
                
                // Update Marker - The CSS handles the gliding animation
                userMarker.setLatLng(newPos);
                
                // Smoothly pan the map to center the user
                map.panTo(newPos, { animate: true, duration: 2.0 });

                // Update UI text with timestamp for the 30-second interval
                const now = new Date().toLocaleTimeString();
                coordsText.innerText = `${lat.toFixed(5)}, ${lng.toFixed(5)} (Last Update: ${now})`;
                console.log(`Updated at ${now}: ${lat}, ${lng}`);
            }
        });

    } catch (error) {
        console.error("Connection Error: ", error);
        statusText.innerText = "Error: " + error.message;
        statusText.style.color = "red";
    }
});