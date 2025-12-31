// ======================================================
//    RECEIVER FINAL 
// ======================================================

#include <SPI.h>
#include <LoRa.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
#include <WiFi.h>
#include <HTTPClient.h>

// 1. SETTING WIFI
const char* ssid     = "Raden Sandi";         
const char* password = "yangmuliasandi";   
String apiKey        = "AP7PJGEFE1E8PYHE";      

// 2. PIN LORA 
#define SCK 18
#define MISO 19
#define MOSI 23
#define SS 5     
#define RST 14
#define DIO0 2   
#define BAND 433E6 

Adafruit_SH1106G display = Adafruit_SH1106G(128, 64, &Wire, -1);

// Variabel Data
String receivedData = "";
float rad_uSv = 0;
float co_ppm = 0; 
float temp = 0;
float hum = 0;
int batt_percent = 0;
float pressure = 0;
float altitude = 0;
String lat_val = "0";
String lng_val = "0";
int rssi = 0; 

unsigned long lastDisplayTime = 0;
const long displayInterval = 3000; 
int screenIndex = 0;

unsigned long lastThingSpeakTime = 0;
const long thingSpeakInterval = 20000; 

String getValue(String data, char separator, int index) {
  int found = 0;
  int strIndex[] = {0, -1};
  int maxIndex = data.length() - 1;
  for (int i = 0; i <= maxIndex && found <= index; i++) {
    if (data.charAt(i) == separator || i == maxIndex) {
      found++;
      strIndex[0] = strIndex[1] + 1;
      strIndex[1] = (i == maxIndex) ? i + 1 : i;
    }
  }
  return found > index ? data.substring(strIndex[0], strIndex[1]) : "";
}

void setup() {
  Serial.begin(115200);
  
  // Setup OLED
  Wire.begin(21, 22);
  if (!display.begin(0x3C, true)) { while (1); }
  display.clearDisplay(); display.setTextColor(SH110X_WHITE);
  
  // Setup WiFi
  display.setCursor(0, 0); display.println("Connecting WiFi..."); 
  display.setCursor(0, 15); display.println(ssid);
  display.display();
  
  WiFi.begin(ssid, password);
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 20) {
    delay(500); Serial.print("."); retry++;
  }
  
  display.clearDisplay();
  if (WiFi.status() == WL_CONNECTED) {
    display.setCursor(0, 20); display.println("WiFi Connected!");
    Serial.println("\nWiFi OK!");
  } else {
    display.setCursor(0, 20); display.println("WiFi Failed :("); 
    Serial.println("\nWiFi Fail!");
  }
  display.display(); delay(1000);

  // Setup LoRa
  SPI.begin(SCK, MISO, MOSI, SS);
  LoRa.setPins(SS, RST, DIO0);
  if (!LoRa.begin(BAND)) {
    display.clearDisplay(); display.setCursor(0, 0); display.println("LORA ERROR!"); 
    display.setCursor(0, 15); display.println("Check Wiring!");
    display.display(); 
    Serial.println("LORA INIT FAILED!");
    while (1);
  }
  Serial.println("RECEIVER READY! Waiting for Data...");
}

void loop() {
  // A. TERIMA DATA
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    receivedData = "";
    while (LoRa.available()) receivedData += (char)LoRa.read();
    rssi = LoRa.packetRssi();
    
    Serial.print("RX Data: "); Serial.println(receivedData);

    // Parsing
    rad_uSv      = getValue(receivedData, ',', 0).toFloat();
    co_ppm       = getValue(receivedData, ',', 1).toFloat();
    temp         = getValue(receivedData, ',', 2).toFloat();
    hum          = getValue(receivedData, ',', 3).toFloat();
    batt_percent = getValue(receivedData, ',', 4).toInt();
    pressure     = getValue(receivedData, ',', 5).toFloat();
    altitude     = getValue(receivedData, ',', 6).toFloat();
    lat_val      = getValue(receivedData, ',', 7);
    lng_val      = getValue(receivedData, ',', 8);
  }

  // B. UPLOAD THINGSPEAK
  if (millis() - lastThingSpeakTime > thingSpeakInterval) {
    if (WiFi.status() == WL_CONNECTED && receivedData != "") { 
      lastThingSpeakTime = millis();
      HTTPClient http;
      String url = "https://api.thingspeak.com/update?api_key=" + apiKey;
      url += "&field1=" + String(rad_uSv, 4);
      url += "&field2=" + String(co_ppm, 2);
      url += "&field3=" + String(temp, 1);
      url += "&field4=" + String(hum, 0);
      url += "&field5=" + String(batt_percent);
      url += "&field6=" + String(rssi);
      url += "&field7=" + String(pressure, 1);
      url += "&field8=" + String(altitude, 1);
      
      if (lat_val != "0") {
        url += "&lat=" + lat_val + "&long=" + lng_val;
      }

      Serial.println("Uploading to ThingSpeak...");
      http.begin(url);
      int httpCode = http.GET();
      Serial.printf("Status Code: %d\n", httpCode);
      http.end();
    }
  }

  // C. TAMPILAN OLED
  if (millis() - lastDisplayTime > displayInterval) {
    lastDisplayTime = millis();
    display.clearDisplay(); display.setTextSize(1); display.setCursor(0, 0); 
    display.printf("RX RSSI: %d dBm", rssi);
    display.drawLine(0, 10, 128, 10, SH110X_WHITE);

    switch (screenIndex) {
      case 0: 
        display.setCursor(0, 15); display.print("Rad (F1):");
        display.setCursor(0, 30); display.print(rad_uSv, 4); display.print(" uSv"); break;
      case 1: 
        display.setCursor(0, 15); display.printf("CO: %.1f ppm", co_ppm);
        display.setCursor(0, 30); display.printf("Bat: %d %%", batt_percent); break;
      case 2: 
        display.setCursor(0, 15); display.printf("T:%.1f H:%.0f", temp, hum);
        display.setCursor(0, 30); display.printf("P:%.1f", pressure); break;
      case 3: 
        display.setCursor(0, 15); display.print("GPS Data:");
        display.setCursor(0, 25); display.print(lat_val);
        display.setCursor(0, 35); display.print(lng_val); break;
    }
    screenIndex = (screenIndex + 1) % 4; 
    display.display();
  }
}