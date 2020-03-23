# Esrupino Apps for ESP8266 and ESP32
Variety of lightweight [Espruino](https://github.com/espruino/Espruino) apps for a ESP8266 or ESP32 microcontroller.

## General ESP8266 ESP12E Setup
[Official flash tutorial](https://www.espruino.com/ESP8266_Flashing)

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
    - This command worked for a ESP-01: `esptool.py --port /dev/ttyUSB0 --baud 115200 write_flash --flash_freq 40m --flash_mode qio --flash_size 4m 0x0000 "boot_v1.6.bin" 0x1000 espruino_esp8266_user1.bin 0x7C000 esp_init_data_default.bin 0x7E000 blank.bin`
- You should now be able to connect to the ESP8266 by running: `screen /dev/ttyUSB0 115200`
  - To kill a `screen` session, press `CTRL+a` then `k`. A prompt should ask confirming you want to close, press `y` to confirm and exit
- Copy and paste the contents of whatever app js file to the ESP8266 terminal
  - This won't work if you are loading other modules besides Wifi since they need to be uploaded via the [web UI](https://chrome.google.com/webstore/detail/espruino-web-ide/bleoifhkdalbjfbobjackfdifdneehpo?hl=en)
  - First be sure to replace your Wifi credentials in the file!
- (Optional) Run this command to set the name of your device to something recognizable in your router list and to other devices:
```
var wifi = require('Wifi');
wifi.setHostname("MyDeviceName");
wifi.save(); // load hostname even if power loss/restart
```
  - Be careful of saving SSID/password with `wifi.save()`. It doesn't seem to work properly (has connection issue on reconnect/reboot?). Hostname seems to save and load correctly though.

### Common Issues
- Not all USB cables support data transport (ie. some only supply power). If you can't connect try a couple different USB cables.
- The USB port you use must provide a good amount of power for a ESP chip to run successfully. Usually a common PC USB port will not provide enough power. If you're having issues, try using a higher power USB port like a RaspberryPi provides.
  - It might appear that the ESP chip is working, but some things will not work until enough power is supplied (ie. you might be able to flash firmware, but not run/connect to Espruino via `screen` command). Certain functions like PWM or pin output might behave oddly.

## [Modules](https://www.espruino.com/Modules)
[Espruino Modules](https://www.espruino.com/Modules) provide extended functionality for a variety of hardware and software services, such as One Wire interfaces, MQTT and database connections, WIFI functionality, graphical display interface libraries, and more.
It's a good place for project ideas and sensors.

Additionally, it has instructions on how to write your own custom modules and load them straight from github.