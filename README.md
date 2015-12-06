## Dimmer software for ESP8266/Arduino

Dimmer software for ESP8266 based dimmer and a server component that connects to HOUM.io
and controls your dimmers.

### Dimmer software

Dimmer software uses PWM to control brightness. Pin 2 is used for output.

Use a 200 ohm resistor and a Mosfet to control the 12 volt led voltage.

You need to create a `network-settings.h` file in this folder before compiling. It should include the following:

```c
const char* ssid     = "your-wifi-ssid";
const char* password = "your-wifi-password";

const char* host = "your-server-hostname-or-ip";
const int   port = 8000;

#define LIGHT_ID 1
```

In addition to wifi and server settings, this file assigns a `LIGHT_ID` number (0-255) to your dimmer.


### Server software

You need to create a `houm-config.js` file to connect to your HOUM.io system. Like this:

```js
module.exports = { 
  siteKey: "your-site-key", 
  lights: {
    '566427ea122cdc0300fa07d2': 1
  }
}
```

The keys in the `lights` object must match the houm id's of the respective lights and the values match
the `LIGHT_ID`s of your dimmers.

In addition to wifi and server settings, this file assigns a `LIGHT_ID` number (0-255) to your dimmer.

To run the server, do

    npm install
    ./server.js

Requires node version 4 or above.
