// I2C, for displaying data on a 0.96" OLED SSD1306 screen
var graphics;

// track sensors and temps
var temps = {};
var high, low, sum, sensors;

E.on('init', function() {
  var wifi = require('Wifi');
  wifi.setHostname("EspBedroomTemp");
  wifi.connect(
    '<YOUR WIFI SSID NAME>',
    { password: '<YOUR WIFI PASSWORD>' },
    function(err) {
      if (err) {
        console.log('Connection error: ' + err);
        return;
      }
      console.log('Wifi connected!');
      setupSensors();
      startMqtt();
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
  // refresh temps immediately
  refreshTemps();
  // make sure temps are no older than 5 seconds
  //setInterval(refreshTemps, 5000);
}

function getAverageTemp(){
  analyzeTemps();
  return sum/Object.keys(temps).length;
}

var mqtt;

function startMqtt(){
  mqtt = require("tinyMQTT").create('services.lan');
  var mqtt_publish_interval;
  mqtt.on('connected', function() {
    console.log('MQTT connected');
    mqtt_publish_interval = setInterval(mqttPublish, 60000); // send data
  });
  mqtt.on('disconnected', function() {
    console.log("MQTT disconnected... reconnecting.");
    clearInterval(mqtt_publish_interval);
    setTimeout(function() {
      //mqtt.connect(opts);
      mqtt.connect();
    }, 1000);
  });
  mqtt.connect();
}

function mqttPublish(){
  refreshTemps();
  // don't publish bad data
  var avg_temp = getAverageTemp();
  if(avg_temp < 35 || avg_temp > 150){
    return;
  }
  // see https://docs.influxdata.com/influxdb/v1.7/write_protocols/line_protocol_tutorial/
  var influxDbLine = "temperature,location=bedroom farenheit=" + avg_temp;
  console.log("influxline: " + influxDbLine);
  mqtt.publish('temperature', influxDbLine);
}

save(); // make sure everything loads on restart
