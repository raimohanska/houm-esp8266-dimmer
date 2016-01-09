#include "network_settings.h"
#include <ESP8266WiFi.h>
#include <EEPROM.h>

WiFiClient client;

int rounds = 0;
int brightness = 0;

void setup() {
  EEPROM.begin(128);
  Serial.begin(115200);
  pinMode(2, OUTPUT);
  Serial.println();
  brightness = EEPROM.read(0);
  Serial.print("Using stored brightness: "); Serial.println(brightness);
  setBrightness(brightness);
  connectToHost(); 
}

void loop() {
  if (client.available() > 0) {
    char command = client.read();
    if (command == 'b') {
      brightness = readByte();
      Serial.print("Got new brightness: "); Serial.println(brightness);
      EEPROM.write(0, brightness);
      EEPROM.commit();
      setBrightness(brightness);
    } else if (command == 'p') {
      Serial.println("Got ping");
    } else if (command == '\n' || command == '\r') {
      // ignore CR, LF
    } else {
      Serial.print("Unknown command: "); Serial.println(command);
    }
  }

  if (client.connected()) {
    keepAlive();    
  } else {
    delay(10000);
    Serial.println("Reconnecting");
    connectToHost();
  }
}

byte readByte() {
  int count = 0;
  while(client.available() < 1 && (count++) < 1000) {
    delay(1);
  }
  return client.read();
}

void keepAlive() {
  if (rounds++ > 1000) {
    rounds = 0;
    Serial.println("Pinging");
    client.write("p ");
    client.flush();
  }
  delay(10);
}

// Range: 0-100
void setBrightness(int b) {
  analogWrite(2, map(b, 0, 255, 0, 1023));
}

int connectToHost() {
  connectToWifi();
  Serial.print("connecting to ");
  Serial.print(host);
  Serial.print(":");
  Serial.println(port);

  if (!client.connect(host, port)) {
    Serial.println("connection failed");
    blink();
    return false;
  } else {
    client.write('i');
    client.write((char)LIGHT_ID);
    client.flush();
  }

  Serial.println("Connected");
  return true;
}

void connectToWifi() {  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.print("Connecting to ");
    Serial.println(ssid);
  
    WiFi.mode(WIFI_AP_STA);
    WiFi.begin(ssid, password);
    
    while (WiFi.status() != WL_CONNECTED) {
      delay(100);
      Serial.print(".");
    }
  
    Serial.println("");
    Serial.println("WiFi connected");  
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());      
  }
}

void blink() {
  setBrightness(brightness - 100);
  delay(200);
  setBrightness(brightness + 100);
  delay(200);
  setBrightness(brightness);
}

