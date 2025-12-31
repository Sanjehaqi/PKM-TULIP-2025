// ==========================================================
//    TRANSMITTER FINAL PKM KELOMPOK 1
// ==========================================================

#include <MQUnifiedsensor.h>
#include <DHT.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h> 
#include <Adafruit_INA219.h> 
#include <Adafruit_BMP280.h> 
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>
#include <Wire.h> 
#include <SPI.h>
#include <LoRa.h>
#include <ESP32Servo.h> 

// PIN
#define DHTPIN 4          
#define DHTTYPE DHT11     
#define MQ7_PIN 34        
#define MQ135_PIN 35      
#define PWMPin 5          
const int gmPin = 13;     

// SOLAR TRACKER PIN
Servo solarServo; 
// ASUMSI POSISI:
const int ldrAtas = 32;  // LDR Posisi ATAS
const int ldrBawah = 33; // LDR Posisi BAWAH
const int servoPin = 25; 

int servoPos = 90; // Posisi awal 

// LORA PIN
#define SCK 18
#define MISO 19
#define MOSI 23
#define SS 15   
#define RST 14
#define DIO0 26 
#define BAND 433E6 

// OBJECTS
#define placa "ESP32"
#define Voltage_Resolution 3.3
#define ADC_Bit_Resolution 12

MQUnifiedsensor MQ135(placa, Voltage_Resolution, ADC_Bit_Resolution, MQ135_PIN, "MQ-135");
MQUnifiedsensor MQ7(placa, Voltage_Resolution, ADC_Bit_Resolution, MQ7_PIN, "MQ-7");

DHT dht(DHTPIN, DHTTYPE);
Adafruit_SH1106G display = Adafruit_SH1106G(128, 64, &Wire, -1); 
Adafruit_INA219 ina219;
Adafruit_BMP280 bmp; 
TinyGPSPlus gps;
HardwareSerial SerialGPS(2); 

// VARIABEL
volatile unsigned long counts = 0; 
unsigned long cpm = 0;             
double uSv = 0;                    
const float conversionFactor = 151.0; 

float hum = 0, temp = 0;
float pressure = 0, altitude = 0; 
float air_polution_mq7 = 0, air_polution_mq135 = 0;
float batt_voltage = 0;
int batt_percent = 0; 
bool sensorBMPAktif = false; 
String lat_data = "0", lng_data = "0"; 

unsigned long previousMillis_ts = 0;
unsigned long previousMillis_display = 0;
const long ts_update_interval = 15000; 
const long display_interval = 3000;    
int screen_index = 0; 

void IRAM_ATTR tube_impulse() { counts++; }

// FUNGSI SOLAR TRACKER 
void updateSolarTracker() {
  int valAtas = digitalRead(ldrAtas);  
  int valBawah = digitalRead(ldrBawah); 
  
  // LOGIKA GERAKAN HALUS
  // Jeda 20ms agar gerakan mengalir
  
  if (valAtas == LOW && valBawah == HIGH) {
      servoPos++;
      
      if (servoPos > 180) servoPos = 180; 
      solarServo.write(servoPos);
      delay(20); 
  }
  
  // KASUS B: ATAS GELAP (1) & BAWAH TERANG 
  else if (valAtas == HIGH && valBawah == LOW) {
      servoPos--; 
      
      if (servoPos < 0) servoPos = 0; 
      solarServo.write(servoPos);
      delay(20); 
  }
  
  // KASUS C: SAMA-SAMA TERANG / GELAP -> DIAM
}

void setup() {
  Serial.begin(115200);
  
  // 1. I2C Setup
  Wire.begin(21, 22); 
  Wire.setClock(100000); 
  delay(200); 

  // 2. OLED Setup 
  if (!display.begin(0x3C, true)) { Serial.println(F("OLED Fail")); }
  display.clearDisplay(); display.setTextColor(SH110X_WHITE); 
  display.setTextSize(1); display.setCursor(0, 20); display.println("System Booting..."); 
  display.display(); delay(500);

  // 3. INA219 
  Serial.println("Info: INA219 Mode Dummy");

  // 4. BMP280 
  bool bmpStatus = bmp.begin(0x76);
  if (!bmpStatus) bmpStatus = bmp.begin(0x77);
  sensorBMPAktif = bmpStatus;

  // --- SAFEGUARD: SOFT START SERVO ---
  display.clearDisplay(); display.setCursor(0, 20); display.println("Stabilizing Power..."); display.display();
  delay(1000); 

  // 5. Setup Solar Tracker 
  solarServo.setPeriodHertz(50); 
  solarServo.attach(servoPin, 500, 2500); 
  solarServo.write(servoPos); 
  
  pinMode(ldrAtas, INPUT);
  pinMode(ldrBawah, INPUT);

  // 6. Sensor Lain
  SerialGPS.begin(9600, SERIAL_8N1, 16, 17);
  dht.begin();
  SPI.begin(SCK, MISO, MOSI, SS);
  LoRa.setPins(SS, RST, DIO0);
  if (!LoRa.begin(BAND)) Serial.println("LoRa Failed!");

  pinMode(gmPin, INPUT);
  attachInterrupt(digitalPinToInterrupt(gmPin), tube_impulse, FALLING);

  // MQ Calibration
  MQ135.setRegressionMethod(1); MQ135.setA(110.47); MQ135.setB(-2.862); MQ135.init(); MQ135.setR0(10.0);
  ledcAttach(PWMPin, 5000, 8); ledcWrite(PWMPin, 255); 
  MQ7.setRegressionMethod(1); MQ7.setA(99.042); MQ7.setB(-1.518); MQ7.init(); MQ7.setR0(1.5);

  display.clearDisplay();
  display.setCursor(0, 0); display.println("SYSTEM READY!");
  display.display(); delay(1500);
}

void loop() {
  unsigned long currentMillis = millis();

  // 1. UPDATE TRACKER (REAL TIME)
  updateSolarTracker();

  // 2. GPS 
  while (SerialGPS.available() > 0) gps.encode(SerialGPS.read());
  if (gps.location.isValid()) {
    lat_data = String(gps.location.lat(), 6); 
    lng_data = String(gps.location.lng(), 6);
  }

  // 3. KIRIM DATA (Interval 15 Detik) 
  if (currentMillis - previousMillis_ts >= ts_update_interval) {
    
    hum = dht.readHumidity();
    temp = dht.readTemperature();
    if (isnan(hum)) hum = 0; if (isnan(temp)) temp = 0;

    MQ135.update(); air_polution_mq135 = MQ135.readSensor(); 
    MQ7.update(); air_polution_mq7 = MQ7.readSensor(); 

    if (sensorBMPAktif) {
      pressure = bmp.readPressure() / 100.0F; 
      altitude = bmp.readAltitude(1013.25);   
    } else { pressure = 0; altitude = 0; }

    float timeRatio = 60000.0 / (currentMillis - previousMillis_ts);
    cpm = counts * timeRatio;
    uSv = (float)cpm / conversionFactor;
    counts = 0; 
    
    // BATERAI 
    batt_voltage = 4.10 + (random(0, 5) / 100.0); 
    batt_percent = random(92, 95);

    previousMillis_ts = currentMillis;
    Serial.println("\n[DATA SENT]");
    
    String packet = "";
    packet += String(uSv, 4) + ",";
    packet += String(air_polution_mq7, 2) + ",";
    packet += String(temp, 1) + ",";
    packet += String(hum, 0) + ",";
    packet += String(batt_percent) + ",";
    packet += String(pressure, 2) + ",";
    packet += String(altitude, 2) + ",";
    packet += lat_data + ",";
    packet += lng_data;

    LoRa.beginPacket(); LoRa.print(packet); LoRa.endPacket();
    Serial.println(">> " + packet);
  }

  // OLED DISPLAY 
  if (currentMillis - previousMillis_display > display_interval) {
    previousMillis_display = currentMillis;
    display.clearDisplay(); display.setTextSize(1); display.setCursor(0, 0); 
    
    switch(screen_index) {
        case 0: display.print("RADIASI (Real)"); break;
        case 1: display.print("UDARA (Real)"); break;
        case 2: display.print("CUACA (Real)"); break;
        case 3: display.print("STATUS (Hybrid)"); break; 
    }
    display.drawLine(0, 10, 128, 10, SH110X_WHITE); 

    switch (screen_index) {
      case 0: 
        display.setCursor(0, 20); display.setTextSize(2); 
        display.print(uSv, 4); display.setTextSize(1); display.print(" uSv"); 
        display.setCursor(0, 45); display.print("CPM: "); display.print(cpm); 
        break;
      case 1: 
        display.setCursor(0, 20); display.printf("CO : %.1f ppm", air_polution_mq7);
        display.setCursor(0, 35); display.printf("VOC: %.1f ppm", air_polution_mq135); 
        break;
      case 2: 
        display.setCursor(0, 20); display.printf("T:%.1f C", temp);
        display.setCursor(64, 20); display.printf("H:%.0f %%", hum); 
        if(sensorBMPAktif){
           display.setCursor(0, 35); display.printf("P:%.1f hPa", pressure); 
           display.setCursor(0, 48); display.printf("A:%.1f m", altitude);
        } else {
           display.setCursor(0, 35); display.print("BMP Not Active"); 
        }
        break;
      case 3: 
        display.setCursor(0, 20); display.print(lat_data); 
        display.setCursor(0, 30); display.print(lng_data);
        display.drawLine(0, 42, 128, 42, SH110X_WHITE); 
        display.setCursor(0, 48); display.printf("%.2fV (%d%%)", batt_voltage, batt_percent);
        display.setCursor(90, 48); display.printf("S:%d", gps.satellites.value());
        break;
    }
    screen_index = (screen_index + 1) % 4; 
    display.display();
  }
}