// send data to io.adafruit.com platform
var adafruit_api_key = 'ADAFRUIT IO API KEY';
var adafruit_username = 'ADAFRUIT IO USERNAME';
var adafruit_feed = 'ADAFRUIT IO FEED NAME';

// I2C, for displaying data on a 0.96" OLED SSD1306 screen
var graphics;

// track sensors and temps
var temps = {};
var high, low, sum, sensors;

E.on('init', function() {
  var WIFI_NAME = 'WIFI SSID NAME';
  var WIFI_OPTIONS = { password: 'WIFI PASSWORD' };
  var hostname = "EspTemperature";
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
      setupSensors();
      setInterval(sendTempToAdafruit, 60000);
      setupDisplay();
    }
  );
});

function setupDisplay(){
  var sda_pin = NodeMCU.D1;
  var scl_pin = NodeMCU.D2;
  I2C1.setup({scl: scl_pin, sda: sda_pin});
  graphics = require("SSD1306").connect(I2C1);
  setInterval(writeDisplay, 5000);
}

function writeDisplay(){
  graphics.clear();
  graphics.setFontVector(20); // set font size
  var text = getAverageTemp() + ' F';
  graphics.drawString(text, 10, 30);
  graphics.flip(); // write to screen
}

function refreshTemps(){
  sensors.forEach(function(sensor, index) {
    var farenheit = sensor.getTemp() * 9/5 + 32;
    temps[sensor.sCode] = farenheit;
  });
}

function analyzeTemps(){
  high = -99999;
  low = 99999;
  sum = 0;
  Object.keys(temps).forEach(function(sensor_id, index) {
    var farenheit = temps[sensor_id];
    if(low > farenheit){
      low = farenheit;
    }
    if(high < farenheit){
      high = farenheit;
    }
    sum += farenheit;
  });
}

function setupSensors(){
  var ow = new OneWire(NodeMCU.D7);
  sensors = ow.search().map(function (device) {
    return require("DS18B20").connect(ow, device);
  });
  if (sensors.length === 0) print("No OneWire devices found");
  // make sure temps are no older than 5 seconds
  setInterval(refreshTemps, 5000);
}

function getAverageTemp(){
  analyzeTemps();
  return sum/Object.keys(temps).length;
}

function sendTempToAdafruit(){
  var avg_temp = getAverageTemp();
  var payload = JSON.stringify({
    value: getAverageTemp()
  });
  var path = '/api/v2/' + adafruit_username + '/feeds/' + adafruit_feed + '/data';
  var opts = {
    host: 'io.adafruit.com',
    path: path,
    method: 'POST',
    protocol: 'https:',
    headers: {
      'X-AIO-KEY': adafruit_api_key,
      'Content-Length': payload.length,
      'Content-Type': 'application/json'
    }
  };

  var req = require('http').request(opts, function(res){
    res.on('data', function(data) {
     //console.log("HTTP> "+data);
    });
  });
  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });
  req.end(payload);
}

save(); // make sure everything loads on restart