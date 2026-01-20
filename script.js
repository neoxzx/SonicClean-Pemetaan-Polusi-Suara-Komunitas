let dbHistory = [];
let labels = [];
let myChart;
let map, marker;

// 1. Inisialisasi Grafik & Peta
window.onload = function() {
    // Grafik
    const ctx = document.getElementById('noiseChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Desibel',
                data: dbHistory,
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { beginAtZero: true, max: 120 } }
        }
    });

    // Peta (Default Jakarta)
    map = L.map('map').setView([-6.2088, 106.8456], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    
    // Coba ambil lokasi asli user
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude } = pos.coords;
            map.setView([latitude, longitude], 15);
            marker = L.marker([latitude, longitude]).addTo(map).bindPopup("Lokasi Pengukuran");
        });
    }
};

// 2. Logika Deteksi Suara
async function mulaiPantau() {
    const btn = document.getElementById('startBtn');
    btn.disabled = true;
    btn.innerText = "Mendeteksi...";

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        const analyzer = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyzer);
        
        const dataArray = new Uint8Array(analyzer.frequencyBinCount);
        
        function loop() {
            analyzer.getByteFrequencyData(dataArray);
            let sum = 0;
            for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
            let db = Math.round((sum / dataArray.length) * 1.5); // Kalibrasi sederhana
            
            document.getElementById('gauge').innerText = db;
            updateUI(db);
            requestAnimationFrame(loop);
        }
        loop();

        // Update Grafik tiap detik
        setInterval(() => {
            let currentDb = parseInt(document.getElementById('gauge').innerText);
            if(dbHistory.length > 20) { dbHistory.shift(); labels.shift(); }
            dbHistory.push(currentDb);
            labels.push("");
            myChart.update();
        }, 1000);

    } catch (err) {
        alert("Butuh izin mikrofon!");
    }
}

function updateUI(db) {
    const badge = document.getElementById('status-badge');
    if (db < 50) {
        badge.innerText = "KONDISI AMAN";
        badge.className = "badge-safe";
    } else if (db < 80) {
        badge.innerText = "WASPADA BISING";
        badge.className = "badge-warning";
    } else {
        badge.innerText = "BAHAYA POLUSI SUARA";
        badge.className = "badge-danger";
    }
}