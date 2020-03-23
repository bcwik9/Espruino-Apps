# relay_server.js
App that controls a relay. Can switch on and off.

## Additional Setup Instructions
A server should be running. Get the IP of the ESP8266 (look at your router's DHCP client list), and navigate to that in a web browser in port 3000 (or whatever you set it to). It should look something like `192.168.0.100:3000`. A page should load. Going to `/on` in the browser will turn the relay on; going to `/off` in the browser will turn it off.