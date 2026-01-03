<div align="center">
 <img src="https://raw.githubusercontent.com/Sanjehaqi/PKM-TULIP-2025/main/PKM_TULIP_FINAL/assets/tulip-logo.png" alt="Logo PKM TULIP" width="120">

  <h1>PKM-TULIP: Smart Radiation & Air Quality Monitoring</h1>

  <p><b>Sistem Pemantauan Interaktif Kualitas Udara dan Radiasi Berbasis IoT untuk Edukasi Nuklir</b></p>

  <img src="https://img.shields.io/badge/Platform-ESP32-blue?style=for-the-badge&logo=espressif">
  <img src="https://img.shields.io/badge/Language-C%2B%2B%20%7C%20HTML-orange?style=for-the-badge">
  <img src="https://img.shields.io/badge/Comms-LoRa%20433MHz-red?style=for-the-badge">
  <img src="https://img.shields.io/badge/Sensors-Geiger%20%7C%20MQ7-yellow?style=for-the-badge">
  <img src="https://img.shields.io/badge/License-Open%20Source-green?style=for-the-badge">
</div>

---

## 📖 Latar Belakang & Motivasi

Kualitas udara dan tingkat radiasi lingkungan merupakan dua indikator vital yang berdampak langsung pada kesehatan manusia. Namun, literasi masyarakat terhadap bahaya radiasi dan polusi udara seringkali masih rendah.

**PKM-TULIP** hadir sebagai solusi inovatif yang menggabungkan teknologi nuklir dan *Internet of Things* (IoT). Proyek ini bertujuan untuk:

1. **Demokratisasi Data:** Menyediakan data lingkungan yang transparan dan *real-time* bagi masyarakat.  
2. **Edukasi Nuklir:** Memberikan pemahaman bahwa radiasi lingkungan dapat diukur dan dipantau secara aman.  
3. **Sistem Peringatan Dini:** Mendeteksi lonjakan gas berbahaya (CO) dan anomali radiasi gamma di lingkungan sekitar.

---

## 📸 Dokumentasi Perangkat (Hardware Gallery)

Berikut adalah implementasi fisik dari *Node Sensor* yang telah dikembangkan. Alat ini dirancang *compact*, *portable*, dan tahan terhadap kondisi luar ruangan.

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="PKM_TULIP_FINAL/assets/alat1.jpeg" width="300" alt="Tampak Depan Alat"><br>
        <b>Tampak Depan (Casing 3D Print)</b>
      </td>
      <td align="center">
        <img src="PKM_TULIP_FINAL/assets/alat2.jpeg" width="300" alt="Komponen Internal"><br>
        <b>Komponen Internal & Sensor</b>
      </td>
    </tr>
  </table>
  <p><i>Desain menggunakan casing PLA+ dengan ventilasi udara untuk sensor gas dan perlindungan tabung Geiger Müller.</i></p>
</div>

---

## 💻 Visualisasi Dashboard Web

Data yang dikirim oleh alat dapat diakses melalui dashboard berbasis web yang responsif dan mudah dipahami oleh pengguna awam.

<div align="center">
  <img src="PKM_TULIP_FINAL/assets/tampilanweb.png" width="90%" alt="Tampilan Web Dashboard">
  <p><i>Fitur Dashboard: Grafik Real-time, Indikator Status (Aman/Bahaya), Peta Lokasi GPS, dan Angka Parameter Terkini.</i></p>
</div>

---

## 🔄 Alur Kerja Sistem

1. **Akuisisi Data**
   - Sensor MQ-7 / MQ-135 membaca konsentrasi gas CO melalui ADC.
   - Geiger Counter mendeteksi pulsa radiasi gamma melalui interrupt.
   - Modul GPS NEO-7M menyediakan koordinat lokasi pengukuran.

2. **Pemrosesan Data**
   - ESP32 Node memproses data sensor dan mengonversinya ke satuan terukur
     (ppm untuk gas dan CPM/µSv untuk radiasi).

3. **Transmisi Data**
   - Data dikirimkan secara periodik menggunakan modul **LoRa 433 MHz**
     menuju ESP32 Gateway.

4. **Upload ke Cloud**
   - ESP32 Gateway menerima data dan mengirimkannya ke **ThingSpeak Server**
     melalui koneksi WiFi menggunakan protokol HTTP.

5. **Visualisasi**
   - Data ditampilkan dalam bentuk grafik, indikator status, dan peta lokasi
     pada **Dashboard Web**.

---

## 🧰 Spesifikasi Teknis

### 🔹 Node Sensor (Transmitter)
- Mikrokontroler : ESP32  
- Sensor Gas     : MQ-7 / MQ-135  
- Sensor Radiasi : Geiger Müller Tube  
- Modul GPS      : NEO-7M  
- Komunikasi     : LoRa 433 MHz  
- Catu Daya      : Baterai / Power Bank  

### 🔹 Gateway (Receiver)
- Mikrokontroler : ESP32  
- Komunikasi     : LoRa 433 MHz & WiFi  
- Cloud Server   : ThingSpeak  

---

## 📊 Parameter yang Dipantau

| Parameter | Satuan | Keterangan |
|---------|--------|------------|
| Gas CO | ppm | Indikator kualitas udara |
| Radiasi Gamma | CPM / µSv/h | Tingkat radiasi lingkungan |
| Lokasi | Latitude & Longitude | Posisi pengukuran |
| Waktu | Timestamp | Waktu pengambilan data |

---

## 🚨 Klasifikasi Status Lingkungan

| Kondisi | Keterangan |
|-------|------------|
| 🟢 Aman | Nilai parameter dalam batas normal |
| 🟡 Waspada | Terjadi peningkatan nilai |
| 🔴 Bahaya | Melebihi ambang batas aman |

---

## 🌐 Dashboard Web

Fitur utama dashboard:
- 📈 Grafik real-time kualitas udara & radiasi  
- 🧭 Peta lokasi berbasis GPS  
- 🚦 Indikator status lingkungan  
- 🕒 Riwayat data pengukuran  

Dashboard dirancang **responsif** sehingga dapat diakses melalui
desktop maupun perangkat mobile.

---

## 🚀 Keunggulan Sistem

- 📡 Jangkauan komunikasi luas dengan LoRa  
- ⚡ Monitoring real-time  
- 🌍 Terintegrasi GPS  
- 🧠 Media edukasi nuklir yang interaktif  
- 🔓 Open-source & mudah dikembangkan  

---

## 🔧 Pengembangan Selanjutnya

- Integrasi aplikasi Android  
- Penambahan notifikasi otomatis (Telegram / WhatsApp)  
- Analisis tren data jangka panjang  
- Penambahan sensor lingkungan lainnya  

---

## 📜 Lisensi

Proyek **PKM-TULIP** bersifat **Open Source** dan dikembangkan untuk
keperluan **pendidikan, penelitian, dan inovasi teknologi lingkungan
serta nuklir**.

---

<div align="center">
  <b>🌷 PKM-TULIP — Monitoring Lingkungan untuk Masa Depan yang Aman 🌍</b>
</div>

---

## 🏗️ Arsitektur & Alur Sistem

Sistem bekerja dengan prinsip *Telemetri Jarak Jauh*. Sensor mengambil data di lapangan, dikirim melalui LoRa ke Gateway, lalu diunggah ke Cloud untuk divisualisasikan.

```mermaid
graph LR
    subgraph NODE SENSOR [Transmitter - Lapangan]
    A1[Sensor MQ-7 / MQ-135] -->|ADC| MCU1(ESP32 Node)
    A2[Geiger Counter] -->|Interrupt| MCU1
    A3[GPS NEO-7M] -->|UART| MCU1
    MCU1 -->|LoRa 433 MHz| RF{Udara Bebas}
    end

    subgraph GATEWAY [Receiver - Indoor]
    RF -->|Receiver| MCU2(ESP32 Gateway)
    MCU2 -->|WiFi HTTP| CLOUD[ThingSpeak Server]
    end

    subgraph USER_INTERFACE [User Interface]
    CLOUD -->|JSON API| WEB[Web Dashboard]
    WEB -->|Visualisasi| USER[Masyarakat]
    end
