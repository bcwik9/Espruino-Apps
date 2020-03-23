// send data to io.adafruit.com platform
var adafruit_api_key = 'IO.ADAFRUIT.COM API KEY';
var adafruit_username = 'IO.ADAFRUIT.COM USERNAME';
var adafruit_feed = 'IO.ADAFRUIT.COM FEED';

E.on('init', function() {
  var WIFI_NAME = 'WIFI SSID NAME';
  var WIFI_OPTIONS = { password: 'WIFI PASSWORD' };
  var hostname = "EspMQTT";
  var wifi = require('Wifi');
  wifi.setHostname(hostname);
  wifi.connect(
    WIFI_NAME,
    WIFI_OPTIONS,
    function(err) {
      if (err) {
        console.log('Connection error: ' + err);
        return;
      }
      console.log('Wifi connected to: ' + WIFI_NAME);
      startMqtt();
    }
  );
});

var mqtt;

function startMqtt(){
  var opts = {
    host: "io.adafruit.com",
    port: 1883,
    protocol_level: 0,
    username: adafruit_username,
    password: adafruit_api_key
  };
  mqtt = require("MQTT").connect(opts);
  mqtt.on('connected', function() {
    console.log('MQTT connected');
    mqttPublish("hello world"); // send data
  });
  mqtt.on('disconnected', function() {
    console.log("MQTT disconnected... reconnecting.");
    setTimeout(function() {
      mqtt.connect(opts);
    }, 1000);
  });
}

function mqttPublish(status){
  var feed = adafruit_username + '/feeds/' + adafruit_feed;
  mqtt.publish(adafruit_feed,status);
}

save(); // make sure everything loads on restart
