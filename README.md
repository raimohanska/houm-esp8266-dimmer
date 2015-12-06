## Dimmer software for ESP8266/Arduino

Connects to server using TCP and listens for commands.

Server sends character `b` followed by brightness as a single byte in the range of 0-100.

Dimmer software uses PWM to control brightness. Pin 2 is used for output.

Use a 200 ohm resistor and a Mosfet to control the 12 volt led voltage.

You need to create a `network-settings.h` file in this folder before compiling. It should include the following:

```c
const char* ssid     = "your-wifi-ssid";
const char* password = "your-wifi-password";

const char* host = "your-server-hostname-or-ip";
const int   port = 8000;
```
