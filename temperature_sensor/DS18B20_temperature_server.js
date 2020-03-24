// I2C, for displaying data on a 0.96" OLED SSD1306 screen
var graphics;

// track sensors and temps
var temps = {};
var high, low, sum, sensors;

E.on('init', function() {
  var wifi = require('Wifi');
  wifi.setHostname("EspBedroomTemp");
  wifi.connect(
    '<WIFI SSID NAME>',
    { password: '<WIFI PASSWORD>' },
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
  setInterval(writeDisplay, 60000);
  writeDisplay();
}

function writeDisplay(){
  graphics.clear();
  graphics.setFontAlign(-1,-1);
  graphics.setFontVector(20); // set font size
  var text = getAverageTemp() + ' F';
  graphics.drawString(text, 10, 30);
  graphics.flip(); // write to screen
  setTimeout(writeDisplayGraph, 30000);
}

var history = new Float32Array(128);

function writeDisplayGraph() {
  // quickly move all elements of history back one
  history.set(new Float32Array(history.buffer,4));
  // add new history element at the end
  var temp = getAverageTemp();
  if(!isTempValid(temp)){
   return;
  }
  history[history.length-1] = temp;
  // remove previous graphics
  graphics.clear();
  graphics.setFontBitmap();
  // Draw Graph
  var r = require("graph").drawLine(graphics, history, {
    //miny: 40,
    //maxy: 100,
    axes : true,
    gridy : 1,
    title: "Temperature: " + temp + " F"
  });
  // Label last reading
  graphics.setFontAlign(1,-1);
  graphics.drawString(Math.round(temp), r.x+r.w, r.gety(temp)+2);
  // Update the screen
  graphics.flip();
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

function isTempValid(temp){
  var min_temp = 35;
  var max_temp = 130;
  return (temp >= min_temp && temp <= max_temp);
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
  if(!isTempValid(avg_temp)){
    return;
  }
  // see https://docs.influxdata.com/influxdb/v1.7/write_protocols/line_protocol_tutorial/
  var influxDbLine = "temperature,location=bedroom farenheit=" + avg_temp;
  console.log("influxline: " + influxDbLine);
  mqtt.publish('temperature', influxDbLine);
}

save(); // make sure everything loads on restart
