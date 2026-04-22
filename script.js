// 1. Initialize Map (Start at center of Pampanga)
const map = L.map('map').setView([15.0286, 120.6898], 13);

// 2. Load Offline Tiles (The folders 11, 12, etc. you made in MOBAC)
const offlineTileUrl = 'tiles/{z}/{x}/{y}.png';

L.tileLayer(offlineTileUrl, {
    minZoom: 11,
    maxZoom: 16, // Change to 18 if you downloaded more detail
    attribution: 'GuardianBand Offline Maps'
}).addTo(map);

// 3. Setup User Marker (Blue Pin)
let userMarker = L.marker([15.0286, 120.6898]).addTo(map)
    .bindPopup('<b>Patient Location</b>')
    .openPopup();

// 4. Bluetooth UUIDs (Must match the ESP32 code)
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

const connectBtn = document.getElementById('connectBle');
const statusText = document.getElementById('status');
const coordsText = document.getElementById('coords');

connectBtn.addEventListener('click', async () => {
    try {
        statusText.innerText = "Searching...";
        statusText.style.color = "orange";

        // Request Bluetooth Device
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ name: 'GuardianBand_Device' }],
            optionalServices: [SERVICE_UUID]
        });

        // Connect to GATT Server
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_UUID);
        const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

        statusText.innerText = "Connected";
        statusText.style.color = "#28a745"; // Green
        connectBtn.style.display = "none"; // Hide button once connected

        // Listen for GPS data notifications
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
            // Decode the "lat,lng" string from ESP32
            const rawData = new TextDecoder().decode(event.target.value);
            const [lat, lng] = rawData.split(',').map(Number);

            if (!isNaN(lat) && !isNaN(lng)) {
                // Update Marker position on the map
                const newPos = [lat, lng];
                userMarker.setLatLng(newPos);
                map.panTo(newPos); // Follow the user

                // Update UI text
                coordsText.innerText = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            }
        });

    } catch (error) {
        console.error("Connection Error: ", error);
        statusText.innerText = "Error: " + error.message;
        statusText.style.color = "red";
    }
});