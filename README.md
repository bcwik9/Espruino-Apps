# Esrupino Apps for ESP8266 and ESP32
Variety of lightweight [Espruino](https://github.com/espruino/Espruino) apps for a ESP8266 or ESP32 microcontroller.

## General ESP8266 ESP12E Setup
[Tutorial found here](https://cuneyt.aliustaoglu.biz/en/programming-esp8266-using-javascript-with-espruino/)

[Pinout diagram here](https://lastminuteengineers.com/wp-content/uploads/2018/08/ESP-12E-Development-Board-ESP8266-NodeMCU-Pinout.jpg)
- Flash your ESP8266 with [Espruino firmware](https://www.espruino.com/Download)
  - I downloaded the "combined" file: `espruino_2v01_esp8266_4mb_combined_4096.bin`
  - Run command to flash on linux (I flashed using a raspberry pi):
    ```
    esptool.py --port /dev/ttyUSB0 erase_flash
    esptool.py --port /dev/ttyUSB0 --baud 115200 write_flash --flash_size=detect -fm dio 0 espruino_2v01_esp8266_4mb_combined_4096.bin
    ```
      - Note: Your device could be on something other than `/dev/ttyUSB0` depending on if you have other things plugged in, etc.
      - Note: You can use a higher baud rate (230400, 460800, etc) and the flash will be faster, but all devices don't support high baud rates.
- You should now be able to connect to the ESP8266 by running: `screen /dev/ttyUSB0 115200`
- Copy and paste the contents of whatever app js file to the ESP8266 terminal
  - This won't work if you are loading other modules besides Wifi since they need to be uploaded via the [web UI](https://chrome.google.com/webstore/detail/espruino-web-ide/bleoifhkdalbjfbobjackfdifdneehpo?hl=en)
  - First be sure to replace your Wifi credentials in the file!
- (Optional) Run this command to set the name of your device to something recognizable in your router list and to other devices:
```
var wifi = require('Wifi');
wifi.setHostname("MyDeviceName");
wifi.save(); // load hostname even if power loss/restart
```

### Common Issues
- Not all USB cables support data transport (ie. some only supply power). If you can't connect try a couple different USB cables.
- The USB port you use must provide a good amount of power for a ESP chip to run successfully. Usually a common PC USB port will not provide enough power. If you're having issues, try using a higher power USB port like a RaspberryPi provides.
  - It might appear that the ESP chip is working, but some things will not work until enough power is supplied (ie. you might be able to flash firmware, but not run/connect to Espruino via `screen` command). Certain functions like PWM or pin output might behave oddly.

## Apps
### bbq.js: Control the temperature of your smoker or BBQ grill.
Servo and thermometers control the damper on a smoker or BBQ grill to control the temperature automatically.

### http_server.js: Simple HTTP Server
A server should be running. Get the IP of the ESP8266 (look at your router's DHCP client list), and navigate to that in a web browser in port 3000 (or whatever you set it to). It should look something like `192.168.0.100:3000`. A page should load.

### DS18B20_temperature_server.js: App that reads one wire temperature sensors (specifically a DS18B20 sensor).
Additional Setup Instructions:
- Displays temperature on a [SSD1306 0.96" OLED screen](https://www.espruino.com/SSD1306). Sends temperatures to an [Adafruit IO account](https://io.adafruit.com) once set up.

### relay_server.js: App that controls a relay. Can turn on/off.
Additional Setup Instructions:
A server should be running. Get the IP of the ESP8266 (look at your router's DHCP client list), and navigate to that in a web browser in port 3000 (or whatever you set it to). It should look something like `192.168.0.100:3000`. A page should load. Going to `/on` in the browser will turn the relay on; going to `/off` in the browser will turn it off.

### adafruit_http_post.js
Example of how to use HTTP POST to send data to an [Adafruit IO account](https://io.adafruit.com) once set up.

### adafruit_mqtt.js
Example of how to use MQTT to send data to an [Adafruit IO account](https://io.adafruit.com) once set up.

### captive_portal.js
Example of starting a wifi access point (AP) to let a user enter wifi credentials for their personal network to let the device connect to the internet, without having to program the device directly (ie. non-technical users can set up wifi).
