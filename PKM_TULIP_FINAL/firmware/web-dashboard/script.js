const CHANNEL_ID = '3182232';        
const READ_API_KEY = 'Q4EK1PMPN150NY25'; 

const SENSORS = {
    radiasi: { 
        field: 'field1', unit: 'µSv', title: 'Level Radiasi', color: 'rgba(255, 206, 86, 1)', 
        sensorName: 'Geiger Counter', statusType: 'radiasi', htmlId:'radiation-value'
    },
    karbon: { 
        field: 'field2', unit: 'PPM', title: 'Kadar Karbon', color: 'rgba(54, 162, 235, 1)', 
        sensorName: 'MQ-7 (CO)', statusType: 'karbon', htmlId:'carbon-value'
    },
    suhu: { 
        field: 'field3', unit: '°C', title: 'Suhu Lingkungan', color: 'rgba(255, 99, 132, 1)', 
        sensorName: 'DHT22', statusType: 'suhu', htmlId:'temperature-value'
    },
    kelembapan: { 
        field: 'field4', unit: '%', title: 'Kelembapan', color: 'rgba(75, 192, 192, 1)', 
        sensorName: 'DHT22', statusType: 'lembab', htmlId:'humidity-value'
    },
    tekanan: {
        field: 'field7', unit: 'hPa', title: 'tekanan Udara',
        sensorName: 'BMP280', statusType: 'tekanan', htmlId: 'weather-value'
    },
    altitude: {
        field: 'field8', unit: 'm', title: 'altitude',
        sensorName: 'BMP280', statusType: 'altitude', htmlId: 'altitude-value'
    }
};

const STATUS_FIELDS = {
    BATT_FIELD: 'field5',
    RSSI_FIELD: 'field6',
}

const SENSOR_CONFIG = {
    'radiasi' : {
        field: 'field1', unit: 'µSv', decimals: 3, color: 'rgba(249, 159, 57, 1)',
        panelId: 'panel-radiation',
        dailyChartId: 'radDailyChart', weeklyChartId: 'radWeeklyChart',
        currentValId: 'rad-current-val', 
        statusId: 'rad-current-status', // TAMBAHAN BARU
        statusType: 'radiasi',          // TAMBAHAN BARU
        dailyAvgId: 'rad-daily-average', weeklyAvgId: 'rad-weekly-average'
    },
    'co2' : {
        field: 'field2', unit: 'PPM', decimals: 1, color: 'rgba(87, 219, 171, 1)',
        panelId: 'panel-co2',
        dailyChartId: 'co2DailyChart', weeklyChartId: 'co2WeeklyChart',
        currentValId: 'co2-current-val', 
        statusId: 'co2-current-status', // TAMBAHAN BARU
        statusType: 'karbon',           // TAMBAHAN BARU
        dailyAvgId: 'co2-daily-average', weeklyAvgId: 'co2-weekly-average'
    },
    'suhu' : {
        field: 'field3', unit: '°C', decimals: 1, color: 'rgba(100, 178, 206, 1)',
        panelId: 'panel-temp',
        dailyChartId: 'tempDailyChart', weeklyChartId: 'tempWeeklyChart',
        currentValId: 'temp-current-val', 
        statusId: 'temp-current-status', // TAMBAHAN BARU
        statusType: 'suhu',              // TAMBAHAN BARU
        dailyAvgId: 'temp-daily-average', weeklyAvgId: 'temp-weekly-average'
    },
    'kelembapan' : {
        field: 'field4', unit: '%', decimals: 1, color: 'rgba(116, 148, 190, 1)',
        panelId: 'panel-humid',
        dailyChartId: 'humidDailyChart', weeklyChartId: 'humidWeeklyChart',
        currentValId: 'humid-current-val', 
        statusId: 'humid-current-status', // TAMBAHAN BARU
        statusType: 'lembab',             // TAMBAHAN BARU
        dailyAvgId: 'humid-daily-average', weeklyAvgId: 'humid-weekly-average'
    },

    'tekanan' : {
        field: 'field7', unit: 'hPa', decimals: 1, color: 'rgba(160, 100, 206, 1)',
        panelId: 'panel-press',
        dailyChartId: 'pressDailyChart', weeklyChartId: 'pressWeeklyChart',
        currentValId: 'press-current-val', 
        statusId: 'press-current-status', // TAMBAHAN BARU
        statusType: 'tekanan',             // TAMBAHAN BARU
        dailyAvgId: 'press-daily-average', weeklyAvgId: 'press-weekly-average'
    }
};

let activeCharts = {}; 
let myMap = null;
let myMarker = null;
let channelData = null;

const API_URLS = {
    ThinkSpeak: `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?results=1&api_key=${READ_API_KEY}`,
    forecast:'https://api.open-meteo.com/v1/forecast?latitude=-7.775040835568914&longitude=110.40497111653978&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&hourly=temperature_2m,relative_humidity_2m&forecast_days=7&timezone=Asia%2FJakarta'};

// FUNGSI HELPER //
function formatDateKey(dateObj) {
    return `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
}

function getStatus(val, type) {
    if (isNaN(val) || val === null) return { text: "N/A", color: "gray" };
    
    if (type === 'karbon') { // PPM
        if (val <= 1000) return { text: "AMAN", color: "#34d399" };
        if (val <= 2000) return { text: "WASPADA", color: "#facc15" };
        return { text: "BAHAYA", color: "#f43f5e" };
    }
    if (type === 'suhu') { // Celcius
        if (val <= 19) return {text: "DINGIN", color: "#2daafdff"};
        if (val >= 20 && val <= 29) return { text: "NYAMAN", color: "#34d399" };
        if (val > 29 && val <= 34) return { text: "HANGAT", color: "#facc15" };
        if (val >= 35) return { text: "PANAS", color: "#f43f5e" };
    }
    if (type === 'radiasi') { // CPM (Sesuaikan threshold CPM-nya)
        if (val <= 833333.333) return { text: "NORMAL", color: "#34d399" };
        return { text: "BAHAYA", color: "#f43f5e" };
    }
    if (type === 'lembab') { // %
        if (val >= 40 && val <= 60) return { text: "IDEAL", color: "#34d399" };
        return { text: "NORMAL", color: "#2daafdff" };
    }
    if (type === 'tekanan') {
        if (val > 990) return {text: "TERIK", color: "#fab115ff"};
        if (val <= 990 && val >= 985) return {text: 'CERAH', color: "#2daafdff"};
        if (val < 985) return {text: 'MENDUNG', color: "#1628ccff"};
    }
    return { text: "Info", color: "black" };
}

// MAPS PLACEHOLDER
function initMap() {
    // DEFAULT LOCATION (POLTEK) //
    const defaultLat = -7.778734189800205;
    const defaultLng = 110.41389725309527;

    myMap = L.map('mapid').setView([defaultLat, defaultLng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(myMap);

    myMarker = L.marker([defaultLat, defaultLng]).addTo(myMap)
        .bindPopup("Lokasi Transmitter")
        .openPopup();

    setTimeout(() => { myMap.invalidateSize(); }, 500);
}
function updateMapLocation(lat, lng) {
    if (!myMap || !myMarker) return;

    // Cek validitas data (cegah error jika GPS mengirim 0 atau null)
    if (lat && lng && !isNaN(lat) && !isNaN(lng) && lat !== 0) {
        const newLatLng = new L.LatLng(lat, lng);
        
        // Pindahkan Marker
        myMarker.setLatLng(newLatLng);
        
        // Geser Peta ke lokasi baru
        myMap.panTo(newLatLng);
        
        console.log(`📍 Peta diupdate ke: ${lat}, ${lng}`);

        document.querySelectorAll('.gps-val').forEach(el => {
        el.textContent = "Terhubung";
        el.style.color = '#1760fd';
      });
      document.querySelectorAll('.indikator-text.gps .indikator-name').forEach(label => {
        label.style.color = '#1760fd';
      });
      document.querySelectorAll('.indikator-icon.gps').forEach(icon => {
        icon.style.fill = '#1760fd';
      });
    }


}

function calculateRainChance(humidity, pressure) {
    if(isNaN(humidity) || isNaN(pressure)) return { percent: 0, text: "Data Tidak Tersedia"};

    let chance = 0;

    if (humidity < 50) {
        chance = 5;
    }
    else if (humidity < 80) {
        chance = (humidity - 50) * 1;
    }
    else {
        chance = 30 + (humidity - 80) * 3.5;
    }

    if (pressure < 995) {
        chance += 20;
    }
    else if (pressure < 1005) {
        chance -= 20;
    }
    
    chance = Math.max(0, Math.min(95, chance));

    let text = "Cuaca cerah";

    if (chance >= 85 ) {
        text = "Badai/Hujan lebat";
    }
    else if (chance >= 60) {
        text = "Potensi Hujan";
    }
    else if (chance >= 40) {
        text = "Mendung/Berawan";
    }
    else {
        text = "Cuaca Cerah";
    }

    return {percent: chance.toFixed(0), text: text};
}

// FUNGSI HANDLE //
function updateMetricCards(dataFeed) {
    console.group('🔍 updateMetricCards DEBUG');
    console.log('dataFeed object:', dataFeed);
    console.log('dataFeed keys:', Object.keys(dataFeed));

    // Validasi & mapping yang lebih eksplisit
    const values = {
        radiasi: parseFloat(dataFeed['field1']),
        karbon: parseFloat(dataFeed['field2']),
        suhu: parseFloat(dataFeed['field3']),
        kelembapan: parseFloat(dataFeed['field4']),
        tekanan: parseFloat(dataFeed['field7']),
        altitude: parseFloat(dataFeed['field8'])
    };

    console.log('Parsed values object:', values);
    console.log('radiasi value:', values.radiasi, 'isNaN:', isNaN(values.radiasi));
    console.log('karbon value:', values.karbon, 'isNaN:', isNaN(values.karbon));
    console.log('suhu value:', values.suhu, 'isNaN:', isNaN(values.suhu));
    console.log('kelembapan value:', values.kelembapan, 'isNaN:', isNaN(values.kelembapan));
    console.log('tekanan value:', values.tekanan, 'isNaN:', isNaN(values.tekanan));
    console.log('altitude value:', values.altitude, 'isNaN', isNaN(values.altitude))

    for (const sensorType in SENSORS) {
        if (SENSORS.hasOwnProperty(sensorType)) {
            const sensorConfig = SENSORS[sensorType];
            const htmlId = sensorConfig.htmlId;
            const unit = sensorConfig.unit;
            const value = values[sensorType];
            


            console.log(`\n📊 ${sensorType}:`);
            console.log(`  - htmlId: ${htmlId}`);
            console.log(`  - value: ${value}`);
            console.log(`  - isNaN: ${isNaN(value)}`);

            const element = document.getElementById(htmlId);
            console.log(`  - element found: ${element !== null}`);
            
            const decimals = (sensorType === 'radiasi') ? 3 : 1;

            if (element) {
                let formattedValue;
                if (isNaN(value)) {
                    formattedValue = "--";
                } else {
                    formattedValue = value.toFixed(decimals) + ' ' + unit;
                }
                console.log(`  - formattedValue: "${formattedValue}"`);
                console.log(`  - setting textContent to: "${formattedValue}"`);
                element.textContent = formattedValue;
            } else {
                console.warn(`  ⚠️ ELEMENT NOT FOUND with ID: ${htmlId}`);
            }

            const cpmElement = document.getElementById('cpm-value');

            if (cpmElement) {
                if(!isNaN(values.radiasi)) {
                const cpm = values.radiasi*151;
                cpmElement.textContent = cpm.toFixed(0) + " CPM";
                }
                else {
                    cpmElement.textContent = "--";
                }
        }
    }    
}
    console.groupEnd();

    // PENGAMBILAN RUMUS PREDIKSI HUJAN //
    const humidity = values.kelembapan; 
    const pressure = values.tekanan;  

    const hasilPrediksi = calculateRainChance(humidity, pressure);

    const rainValEl = document.getElementById('rain-value');
    const rainDescEl = document.getElementById('rain-desc');

    if (rainValEl) {
        rainValEl.textContent = hasilPrediksi.percent + "%";
        
        if (hasilPrediksi.percent > 70) {
            rainValEl.style.color = '#2b2edbff'; 
            rainDescEl.style.color = '#2b2edbff';
        } 
        else if (hasilPrediksi.percent >50) {
            rainValEl.style.color = '#256fd1ff';
            rainDescEl.style.color = '#256fd1ff';
        }
        else {
            rainValEl.style.color = '#23b6f0ff';
            rainDescEl.style.color = '#23b6f0ff';
        }
    }

    if (rainDescEl) {
        const spanEl = rainDescEl.querySelector('span');
        if (spanEl) spanEl.textContent = hasilPrediksi.text;
    }
}

    


/**
 * 2. DATA STATUS LORA GPS & BATERAI
 * @param {object} dataFeed - (d) data terakhir
 */

const defaultBattery = 92;
const defaultGPS = "Terhubung";
const defaultColorGPS = '#1760fd';

function updateStatusIndicators(dataFeed) {

    const bVal = defaultBattery;

    document.querySelectorAll('.battery-val').forEach(el => {
        el.textContent = bVal.toFixed(0) + "%";
    });
    
    document.querySelectorAll('indikator-icon.battery').forEach(icon => {
        icon.style.fill = '#1760fd';
    });
    document.querySelectorAll('.indikator-text.battery .indikator-name').forEach(label => {
        label.style.color = '#1760fd';
    });
    document.querySelectorAll('.battery-val').forEach(label => {
        label.style.color = '#1760fd';
    });


    const rssi = parseFloat(dataFeed[STATUS_FIELDS.RSSI_FIELD]);
    const rVal = isNaN(rssi) ? -120 : rssi;

    let signalColor = 'red';
    if (rVal >= -70) {
        signalColor = '#34d399';
    }
    else if (rVal >= -90) {
        signalColor = '#34d399';
    }

    document.querySelectorAll('.wifi-val').forEach(el => {
        el.textContent = rVal + " dBm";
        el.style.color = signalColor;
    });

    document.querySelectorAll('.indikator-icon.wifi').forEach(icon => {
        icon.style.fill = signalColor;
    });

    document.querySelectorAll('.wifi-label').forEach(label => {
        label.style.color = signalColor;
    });


    // Indikator GPS
      document.querySelectorAll('.gps-val').forEach(el => {
        el.textContent = defaultGPS;
        el.style.color = defaultColorGPS;
      });
      document.querySelectorAll('.indikator-text.gps .indikator-name').forEach(label => {
        label.style.color = defaultColorGPS;
      });
      document.querySelectorAll('.indikator-icon.gps').forEach(icon => {
        icon.style.fill = defaultColorGPS;
      });
}
/**
 * 3. RENDER CHART (DIPERBAIKI: DISTRIBUSI LABEL MERATA)
 */
function renderChart(canvasId, type, labels, data, color, labelName) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error("Canvas tidak ditemukan:", canvasId);
        return;
    }
    
    const ctx = canvas.getContext('2d');

    // Hapus chart lama
    if (activeCharts[canvasId]) {
        activeCharts[canvasId].destroy();
    }

    const isWeekly = canvasId.includes('Weekly');
    const totalData = labels.length; // Hitung total jumlah data
    
    // Tentukan ukuran font berdasarkan lebar device
    const isMobile = window.innerWidth <= 992;
    const fontSize = isMobile ? 9 : 11;

    // --- KONFIGURASI SUMBU X ---
    const xTickConfig = {
        grid: { display: false },
        ticks: {
            font: { size: fontSize },
            maxRotation: 0,
            autoSkip: false, // Kita atur manual, jadi matikan autoSkip bawaan
            
            // CALLBACK: Logika manual untuk menentukan label mana yang muncul
            callback: function(val, index) {
                // val = index data saat ini
                const label = this.getLabelForValue(val);

                // KASUS 1: MINGGUAN (Tampilkan Semua)
                if (isWeekly) {
                    return label; 
                }

                // KASUS 2: HARIAN (Tampilkan per ~4 jam)
                // Logika: Kita bagi total data dengan 6 (karena 24 jam / 4 jam = 6 segmen)
                // Contoh: Jika ada 100 data, step = 16. Label muncul di index 0, 16, 32...
                const step = Math.ceil(totalData / 6);
                
                // Tampilkan label jika:
                // 1. Ini data pertama (index 0)
                // 2. ATAU ini data terakhir
                // 3. ATAU index saat ini kelipatan dari step
                if (index === 0 || index === totalData - 1 || index % step === 0) {
                    return label;
                }
                
                // Sembunyikan label lainnya
                return null; 
            }
        }
    };

    // Buat Chart Baru
    activeCharts[canvasId] = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: labelName,
                data: data,
                borderColor: color,
                backgroundColor: type === 'bar' ? color : color.replace('1)', '0.2)'), 
                borderWidth: 2,
                tension: 0.3,
                fill: type === 'line', 
                borderRadius: type === 'bar' ? 5 : 0,
                pointRadius: 1, // Titik garis
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: { legend: { display: false } },
            scales: {
                x: xTickConfig, // Gunakan config custom di atas
                y: { beginAtZero: false } 
            }
        }
    });
}

/**
 * 4. LOAD DATA ANALYTIC (Chart & Detail Angka)
 */
async function loadSensorAnalytics(sensorKey) {
    const config = SENSOR_CONFIG[sensorKey];
    if (!config) return;

    // URL: Daily (24 jam = 1440 menit), Weekly (7 hari)
    const urlDaily = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?minutes=1440&api_key=${READ_API_KEY}`;
    const urlWeekly = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?days=7&api_key=${READ_API_KEY}`;

    try {
        // --- PROSES DAILY ---
        const respDaily = await fetch(urlDaily);
        const dataDaily = await respDaily.json();

        let labelsDaily = [];
        let valuesDaily = [];
        let sumDaily = 0;
        let countDaily = 0;

        dataDaily.feeds.forEach(feed => {
            let value = feed[config.field];

            // Filter data kosong/null
            if (value !== null && value !== undefined && value !== "") {
                let floatVal = parseFloat(value);
                if(!isNaN(floatVal)) {
                    let dateObj = new Date(feed.created_at);
                    let timeLabel = dateObj.toLocaleTimeString('id-ID', {
                        hour: '2-digit', minute: '2-digit', hour12: false
                    });

                    labelsDaily.push(timeLabel);
                    valuesDaily.push(floatVal);
                    sumDaily += floatVal;
                    countDaily++;
                }
            }
        });

        // Update Text Nilai
        const lastValRaw = valuesDaily.length > 0 ? valuesDaily[valuesDaily.length - 1] : 0;
        const dailyAvgRaw = countDaily > 0 ? (sumDaily / countDaily) : 0;
        const lastValFormatted = lastValRaw.toFixed(config.decimals) + ' ' + config.unit;
        const dailyAvgFormatted = dailyAvgRaw.toFixed(config.decimals) + ' ' + config.unit;

        const elVal = document.getElementById(config.currentValId);
        if(elVal) elVal.innerText = lastValFormatted;

        const elAvgD = document.getElementById(config.dailyAvgId);
        if(elAvgD) elAvgD.innerText = dailyAvgFormatted;

        // --- FIX STATUS COLORING ---
        // Kita hanya ubah warna TEKS (h3) dan BORDER KOTAK (div parent)
        const statusData = getStatus(lastValRaw, config.statusType);
        const elStatus = document.getElementById(config.statusId);
        
        if(elStatus) {
            elStatus.innerText = statusData.text; // Ubah teks status
            elStatus.style.color = statusData.color; // Ubah warna teks status
        }

        renderChart(config.dailyChartId, 'line', labelsDaily, valuesDaily, config.color, "Harian");


        // --- PROSES WEEKLY ---
        const respWeekly = await fetch(urlWeekly);
        const dataWeekly = await respWeekly.json();

        const dailyDataMap = {};
        dataWeekly.feeds.forEach(feed => {
            const val = parseFloat(feed[config.field]);
            if (!isNaN(val)) {
                const d = new Date(feed.created_at);
                const key = formatDateKey(d);
                if (!dailyDataMap[key]) dailyDataMap[key] = { sum: 0, count: 0 };
                dailyDataMap[key].sum += val;
                dailyDataMap[key].count++;
            }
        });

        let labelsWeekly = [];
        let valuesWeekly = [];
        let totalWeeklySum = 0;
        let totalWeeklyCount = 0;

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = formatDateKey(d);
            const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
            
            labelsWeekly.push(dayName);

            if (dailyDataMap[key]) {
                const avg = dailyDataMap[key].sum / dailyDataMap[key].count;
                valuesWeekly.push(avg.toFixed(2));
                totalWeeklySum += avg;
                totalWeeklyCount++;
            } else {
                valuesWeekly.push(0);
            }
        }

        const weeklyAvgRaw = totalWeeklyCount > 0 ? (totalWeeklySum / totalWeeklyCount) : 0;
        const weeklyAvgFormatted = weeklyAvgRaw.toFixed(config.decimals) + ' ' + config.unit;

        const elAvgW = document.getElementById(config.weeklyAvgId);
        if(elAvgW) elAvgW.innerText = weeklyAvgFormatted;

        renderChart(config.weeklyChartId, 'bar', labelsWeekly, valuesWeekly, config.color, "Rata-rata Mingguan");

    } catch (error) {
        console.error("Error loading charts:", error);
    }
}

/**
 * 5. DATA OPENWEATHER (Memperbarui Prakiraan Cuaca)*/
function updateForecastData(data) {
    const fc = document.getElementById('cuaca-placeholder');

    if (!fc || !data.daily) {
        if (fc) fc.innerHTML = '<p>Data cuaca tidak tersedia.</p>';
        return;
    }

    const daily = data.daily;
    let html = '';

    for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const dayLabel = date.toLocaleDateString('id-ID', {weekday: 'long'});

        html += `
            <div class="forecast-row">
                <span class="forecast-day">${dayLabel}</span>
                <div class="forecast-details">
                <span class="forecast-humidity">
                <svg viewBox="0 0 20 23" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.623002 13.1969C0.215487 13.9095 0 14.7233 0 15.5503C0 18.1486 2.09353 20.2624 4.66669 20.2624C7.23985 20.2624 9.33321 18.1486 9.33321 15.5503C9.33321 14.7233 9.11789 13.9095 8.71038 13.1969L4.66669 6.59667C4.65383 6.6179 4.94926 6.1357 0.623002 13.1969ZM7.99997 15.5503C7.99997 17.4062 6.50476 18.9161 4.66669 18.9161C2.82862 18.9161 1.33341 17.4062 1.33341 15.5503C1.33341 14.9627 1.4853 14.3848 1.7729 13.8784L4.66669 9.15564L7.56048 13.8784C7.84808 14.3848 7.99997 14.9627 7.99997 15.5503ZM19.377 15.8894L15.3333 9.28935C15.3203 9.31041 15.6157 8.82838 11.2896 15.8894C10.8821 16.6021 10.6666 17.416 10.6666 18.243C10.6666 20.866 12.7601 23 15.3333 23C17.9065 23 20 20.866 20 18.243C20 17.416 19.7845 16.6023 19.377 15.8894ZM15.3333 21.6537C13.4952 21.6537 12 20.1236 12 18.243C12 17.6553 12.1519 17.0773 12.4395 16.5711L15.3333 11.8481L18.2271 16.5711C18.5147 17.0773 18.6666 17.6553 18.6666 18.243C18.6666 20.1236 17.1712 21.6537 15.3333 21.6537ZM11.3334 0C11.2978 0.0596619 11.5466 -0.357971 8.44449 4.84963C8.15376 5.35711 7.99997 5.93811 7.99997 6.52982C7.99997 8.38565 9.49534 9.89562 11.3332 9.89562C13.1713 9.89562 14.6667 8.38565 14.6667 6.52982C14.6667 5.93776 14.5127 5.35641 14.2213 4.84858L11.3334 0ZM11.3332 8.54937C10.2306 8.54937 9.33338 7.64339 9.33338 6.52982C9.33338 6.17623 9.42409 5.83002 9.59596 5.52837L11.3332 2.61196L13.0702 5.52785C13.2424 5.82984 13.3333 6.17623 13.3333 6.52982C13.3333 7.64339 12.436 8.54937 11.3332 8.54937Z"/>
                </svg>
                ${daily.precipitation_probability_max[i]}%
                </span>
                    <span class="forecast-temp">${daily.temperature_2m_max[i]}°C / ${daily.temperature_2m_min[i]}°C
                    </span>
                    
                </div>
            </div>
        `;
    }

    fc.innerHTML = html;
}

/**
 * 6. Logika Pemrosesan Data ThingSpeak (Mengambil data terakhir)
 * @param {Object} json - Object feeds lengkap dari ThingSpeak
 */
function processThingspeakData(json) {
    console.group('🌐 processThingspeakData');
    console.log('Full JSON response:', json);
    
    if (!json.feeds || json.feeds.length === 0) {
        console.error('❌ NO FEEDS FOUND!');
        console.groupEnd();
        return;
    }
    
    const d = json.feeds[0];
    console.log('✅ Latest feed (index 0):', d);
    console.log('Feed created_at:', d.created_at);

    const c = json.channel;

    console.log('Latest Feed', d);
    console.log('Data Channel (lokasi):', c);

    console.log('=== CHECKING FIELD VALUES ===');
    console.log('field1:', d.field1, `(type: ${typeof d.field1})`);
    console.log('field2:', d.field2, `(type: ${typeof d.field2})`);
    console.log('field3:', d.field3, `(type: ${typeof d.field3})`);
    console.log('field4:', d.field4, `(type: ${typeof d.field4})`);
    console.log('field5:', d.field5, `(type: ${typeof d.field5})`);
    console.log('field6:', d.field6, `(type: ${typeof d.field6})`);
    console.log('field7:', d.field7, `(type: ${typeof d.field7})`);
    console.log('field8:', d.field8, `(type: ${typeof d.field8})`);
    console.log('latitude:', d.latitude, `(type: ${typeof d.latitude})`);
    console.log('longitude:', d.longitude, `(type: ${typeof d.longitude})`);
    
    updateMetricCards(d);
    updateStatusIndicators(d, c);

    console.groupEnd();
}


// FUNGSI FETCH DATA (DATA UTAMA) //
async function updateDashboard() {
    console.group('📡 updateDashboard');
    console.log('Memperbarui dashboard...');
    console.log('API URL:', API_URLS.ThinkSpeak);

    try {
        console.log('Fetching ThinkSpeak and Forecast...');
        const [thinkSpeakResponse, forecastResponse] = await Promise.all([
            fetch(API_URLS.ThinkSpeak),
            fetch(API_URLS.forecast)
        ]);

        console.log('ThinkSpeak Response status:', thinkSpeakResponse.status, thinkSpeakResponse.ok);
        console.log('Forecast Response status:', forecastResponse.status, forecastResponse.ok);

        if (!thinkSpeakResponse.ok || !forecastResponse.ok) {
            throw new Error(`Alamat API atau gagal mengambil data. Status TS: ${thinkSpeakResponse.status}, Status OWM: ${forecastResponse.status}`);
        }

        const thinkSpeakData = await thinkSpeakResponse.json();
        const forecastData = await forecastResponse.json();

        console.log('✅ Successfully parsed JSON responses');
        console.log('ThinkSpeak data received:', thinkSpeakData);

        // PERBAIKAN 2 & 3: Pastikan pemanggilan fungsi benar dan menggunakan data yang sudah di-parse
        processThingspeakData(thinkSpeakData);
        updateForecastData(forecastData);

        console.groupEnd();
    } catch (error) {
        console.error('❌ Error memperbarui dashboard:', error);
        console.groupEnd();
    }
}

    document.addEventListener('DOMContentLoaded', function() {
    
    // Inisialisasi Data Awal
    updateDashboard();
    setInterval(updateDashboard, 15000);

    // --- SETUP NAVIGASI LENGKAP ---
    setupNavigation();

    // --- MEMEUAT PETA ---//
    initMap();

    collapseBtn();

    if(window.innerWidth <= 992) {
        const weatherSec = document.getElementById('weather-section');
      

        if(weatherSec) weatherSec.style.display = 'none';

    }
});

function setupNavigation() {
    // Definisi Element View
    const homeView = document.getElementById('home-view');
    const analyticView = document.getElementById('analytic-view');
    
    // Definisi Element Section di Home (untuk Mobile/Desktop handling)
    const cardSection = document.getElementById('cards-section-small'); // Note: ID di HTML kamu cards-section-small
    const weatherSection = document.getElementById('weather-section');
    const rainSection = document.getElementById('rain-section');
    const predicSection = document.getElementById('predic-section');

    // --- 1. LOGIKA TOMBOL DASHBOARD (SIDEBAR) ---
    const dashBtn = document.getElementById('dash-btn');
    if (dashBtn) {
        dashBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Tampilkan Home, Sembunyikan Analytic
            if(homeView) homeView.classList.remove('hidden');
            if(analyticView) analyticView.classList.add('hidden');

            // Reset tombol sidebar aktif
            document.querySelectorAll('.navbar-kiri .nav-link').forEach(l => l.classList.remove('active'));
            dashBtn.classList.add('active');

            // Pastikan elemen home terlihat (reset display style jika sebelumnya di-hide oleh script mobile)
            if(cardSection) cardSection.style.display = '';
            if(weatherSection) weatherSection.style.display = '';
            if(rainSection) rainSection.style.display = '';
            
            console.log("Navigasi: Ke Dashboard");
        });
    }

// --- LOGIKA TOMBOL SENSOR (SIDEBAR) ---
    const sidebarMap = [
        { btnId: 'rad-btn1',   panelId: 'panel-radiation', dataKey: 'radiasi'},
        { btnId: 'c02-btn1',   panelId: 'panel-co2',       dataKey: 'co2'},
        { btnId: 'temp-btn1',  panelId: 'panel-temp',      dataKey: 'suhu'},
        { btnId: 'humid-btn1', panelId: 'panel-humid',     dataKey: 'kelembapan'},
        { btnId: 'press-btn1', panelId: 'panel-press',     dataKey: 'tekanan'},
    ];

    sidebarMap.forEach(item => {
        const btn = document.getElementById(item.btnId);
        
        if (btn) {
            // Mencegah link <a> di dalamnya refresh halaman
            const link = btn.querySelector('a');
            if(link) link.addEventListener('click', e => e.preventDefault());

            btn.addEventListener('click', (e) => {
                e.preventDefault();

                // A. Pindah View ke Analytic
                if(homeView) homeView.classList.add('hidden');
                if(analyticView) analyticView.classList.remove('hidden');

                // B. Atur Tombol Sidebar Aktif
                document.querySelectorAll('.navbar-kiri .nav-link').forEach(l => l.classList.remove('active'));
                btn.classList.add('active');

                // C. Tampilkan Panel yang Sesuai & Sembunyikan yang lain
                document.querySelectorAll('.sensor-panel').forEach(p => p.classList.add('hidden'));
                const targetPanel = document.getElementById(item.panelId);
                if(targetPanel) targetPanel.classList.remove('hidden');

                // D. Sinkronisasi Tombol Tab di Atas (Sub-btn)
                // Supaya kalau kita klik sidebar "Suhu", tombol tab "Suhu" juga nyala
                document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
                const targetTab = document.getElementById(item.tabId);
                if(targetTab) targetTab.classList.add('active');

                // E. Load Data Chart
                loadSensorAnalytics(item.dataKey);

                console.log(`Navigasi Sidebar: Ke ${item.dataKey}`);
            });
        }
    });

/* NAVIGASI CARDS SENSOR KE PANEL MASING MASING */
    const cardsMove = [
        {cardId: 'rad-move', panelId: 'panel-radiation', dataKey: 'radiasi', sidebarId: 'rad-btn1'},
        {cardId: 'co2-move', panelId: 'panel-co2', dataKey: 'co2', sidebarId: 'c02-btn1' },
        {cardId: 'temp-move', panelId: 'panel-temp', dataKey: 'suhu', sidebarId: 'temp-btn1'},
        {cardId: 'humid-move', panelId: 'panel-humid', dataKey: 'kelembapan', sidebarId: 'humid-btn1'},
        {cardId: 'press-move', panelId: 'panel-press', dataKey: 'tekanan', sidebarId: 'press-btn1'},
    ];

    cardsMove.forEach(item => {
        const cardBtn = document.getElementById(item.cardId);

        if (cardBtn) {
            cardBtn.addEventListener('click', (e) => {
                e.preventDefault();

                if(homeView) homeView.classList.add('hidden');
                if(analyticView) analyticView.classList.remove('hidden');

                document.querySelectorAll('.sensor-panel').forEach(p => p.classList.add('hidden'));
                const targetPanel = document.getElementById(item.panelId);
                if(targetPanel) targetPanel.classList.remove('hidden');

                document.querySelectorAll('.navbar-kiri .nav-link').forEach(l => l.classList.remove('active'));
                const sidebarItem = document.getElementById(item.sidebarId);
                if (sidebarItem) sidebarItem.classList.add('active');

                loadSensorAnalytics(item.dataKey);
                console.log(`Navigasi Card: Pindah ke ${item.dataKey}`);
            })
        }
    })

/* NAVIGASI NAVBAR BAWAH MOBILE */
    const mobileHomeBtn = document.getElementById('mobile-home-btn');
    const mobileAnalyBtn = document.getElementById('mobile-analytic-btn');
    const mobilePredicBtn = document.getElementById('mobile-predic-btn');
    const mobileNavLogic = setupMobileSensorNav();

    if(mobileHomeBtn) {
        mobileHomeBtn.addEventListener('click', (e) => {
            e.preventDefault();

            if(homeView) homeView.classList.remove('hidden');
            if(analyticView) analyticView.classList.add('hidden');

            if(cardSection) cardSection.classList.remove('hidden');
            if(rainSection) rainSection.classList.remove('hidden');
            if(weatherSection) weatherSection.classList.add('hidden');
            if(predicSection) predicSection.classList.add('hidden');

            document.querySelectorAll('.btm-nav-mobile').forEach(b => b.classList.remove('active'));
            mobileHomeBtn.classList.add('active')
        });
    }
    
    if(mobileAnalyBtn) {
        mobileAnalyBtn.addEventListener('click', (e) => {
            e.preventDefault();

            if(homeView) homeView.classList.add('hidden');
            if(analyticView) analyticView.classList.remove('hidden');

            if(cardSection) cardSection.classList.add('hidden');
            if(weatherSection) weatherSection.classList.add('hidden');
            if(predicSection) predicSection.classList.add('hidden');

            mobileNavLogic.showMobilePanel(0);
            document.querySelectorAll('.btm-nav-mobile').forEach(b => b.classList.remove('active'));
            mobileAnalyBtn.classList.add('active')
        })
    }
    if(mobilePredicBtn) {
        mobilePredicBtn.addEventListener('click', (e) => {
            e.preventDefault();

            if(homeView) homeView.classList.remove('hidden');
            if(analyticView) analyticView.classList.add('hidden');

            if(cardSection) cardSection.classList.add('hidden');
            if(rainSection) rainSection.classList.add('hidden');

            if(weatherSection) {
                weatherSection.classList.remove('hidden');
                weatherSection.style.display = '';
            }
            if(predicSection) predicSection.classList.remove('hidden');

            document.querySelectorAll('.btm-nav-mobile').forEach(b => b.classList.remove('active'));
            mobilePredicBtn.classList.add('active')
        })
    }


    setupChartToggles();
}

/* NAVIGASI HARIAN/MINGGUAN */
function setupChartToggles() {
    const chartToggles = [
        { harian: 'rad-harian-btn', mingguan: 'rad-mingguan-btn', dailyChart: 'radDailyChart', weeklyChart: 'radWeeklyChart', title: 'rad-chart-title', dailyAvg: 'rad-daily-average', weeklyAvg: 'rad-weekly-average' },
        { harian: 'co2-harian-btn', mingguan: 'co2-mingguan-btn', dailyChart: 'co2DailyChart', weeklyChart: 'co2WeeklyChart', title: 'co2-chart-title', dailyAvg: 'co2-daily-average', weeklyAvg: 'co2-weekly-average' },
        { harian: 'temp-harian-btn', mingguan: 'temp-mingguan-btn', dailyChart: 'tempDailyChart', weeklyChart: 'tempWeeklyChart', title: 'temp-chart-title', dailyAvg: 'temp-daily-average', weeklyAvg: 'temp-weekly-average' },
        { harian: 'humid-harian-btn', mingguan: 'humid-mingguan-btn', dailyChart: 'humidDailyChart', weeklyChart: 'humidWeeklyChart', title: 'humid-chart-title', dailyAvg: 'humid-daily-average', weeklyAvg: 'humid-weekly-average' },
        { harian: 'press-harian-btn', mingguan: 'press-mingguan-btn', dailyChart: 'pressDailyChart', weeklyChart: 'pressWeeklyChart', title: 'press-chart-title', dailyAvg: 'press-daily-average', weeklyAvg: 'press-weekly-average'}
    ];
    
    chartToggles.forEach(toggle => {
        const harianBtn = document.getElementById(toggle.harian);
        const mingguanBtn = document.getElementById(toggle.mingguan);
        const dailyChart = document.getElementById(toggle.dailyChart);
        const weeklyChart = document.getElementById(toggle.weeklyChart);
        const titleEl = document.getElementById(toggle.title);

        if (harianBtn && mingguanBtn) {
            harianBtn.addEventListener('click', () => {
                harianBtn.classList.add('active');
                mingguanBtn.classList.remove('active');
                if (dailyChart) dailyChart.style.display = '';
                if (weeklyChart) weeklyChart.style.display = 'none';
                if (titleEl) titleEl.textContent = 'Grafik Harian';
            });
            
            mingguanBtn.addEventListener('click', () => {
                mingguanBtn.classList.add('active');
                harianBtn.classList.remove('active');
                if (dailyChart) dailyChart.style.display = 'none';
                if (weeklyChart) weeklyChart.style.display = '';
                if (titleEl) titleEl.textContent = 'Grafik Mingguan';
            });
        }
    });
}

/* NAVIGASI PANAH PANEL MOBILE */
function setupMobileSensorNav() {
    const sensorList = [
        {dataKey: 'radiasi', panelId: 'panel-radiation', title: 'Radiasi'},
        {dataKey: 'co2', panelId: 'panel-co2', title: 'Kadar Karbon'},
        {dataKey: 'suhu', panelId: 'panel-temp', title: 'suhu'},
        {dataKey: 'kelembapan', panelId: 'panel-humid', title: 'Kelembapan'},
        {dataKey: 'tekanan', panelId: 'panel-press', title: 'Tekanan Udara'},
    ];

    let currentIndex = 0;

    const prevBtn = document.getElementById('prev-nav');
    const nextBtn = document.getElementById('next-nav');
    const titleEl = document.getElementById('mobile-nav-title');

    function showMobilePanel(index) {

        document.querySelectorAll('.sensor-panel').forEach(p => p.classList.add('hidden'));
        const target = sensorList[index];

        const targetPanel = document.getElementById(target.panelId);
        if(targetPanel) targetPanel.classList.remove('hidden');
        if(titleEl) titleEl.textContent = target.title;

        loadSensorAnalytics(target.dataKey);
    }

    if(prevBtn && nextBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();

            currentIndex--;
            if(currentIndex < 0) currentIndex = sensorList.length - 1;
            showMobilePanel(currentIndex);
        });
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();

            currentIndex++;
            if(currentIndex >= sensorList.length) currentIndex = 0;
            showMobilePanel(currentIndex);
        });
    }
    return {showMobilePanel};
}

/** NAVBAR COLLAPSE **/
function collapseBtn() {
    const navbar = document.getElementById('sidebar');
    const clpsBtn = document.getElementById('collapse-btn');
    const mainContent = document.getElementById('main-content');

    if(clpsBtn && navbar && mainContent) {
        clpsBtn.addEventListener('click', (e) => {
            navbar.classList.toggle('collapsed');
            mainContent.classList.toggle('wide');

            console.log("navbar toggled:", navbar.classList.contains('collapsed'));
         }); 
    } else{
        console.error("Elemen sidebar atau tombol tidak ditemukan!");
    }
}