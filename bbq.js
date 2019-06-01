// Automatically control your smoker or BBQ grill

E.on('init', function() {
  var WIFI_NAME = 'WIFI SSID NAME';
  var WIFI_OPTIONS = { password: 'WIFI PASSWORD' };
  var hostname = "EspBBQ";
  setInterval(setDamperPosition, 5000);
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
      setInterval(sendTempToAdafruit, 15000);
      setInterval(sendDamperToAdafruit, 30000);
      setInterval(sendDesiredTempToAdafruit, 60000);
    }
  );
});

var ohm_total;
function getCurrentTemp(){
  reset_pwm(); // ensure pwm is stopped or temp reading will be off due to voltage fluctuation
  var reading = analogRead(A0); // between 0 and 1
  var known_resistor = 10000; // ohms
  var ohms = known_resistor*reading/(1-reading);
  ohm_total += ohms;
  // steinhart equation
  var stein_a = 0.0007342301572;
  var stein_b = 0.0002020284136;
  var stein_c = 0.00000002919156237;
  var log_r = Math.log(ohms);
  var kelvin = 1 / (stein_a + stein_b*log_r + stein_c * Math.pow(log_r, 3));
  var celcius = kelvin - 273.15;
  var farenheit = celcius * 9 / 5 + 32;
  return farenheit;
}

var servo_frequency = 333; // Hertz
var servo_interval;
function reset_pwm(){
  if ((typeof servo_interval) !== "undefined") {
    clearInterval(servo_interval);
    NodeMCU.D1.reset();
  }
}

function pwm(duty) {
  servo_interval = setInterval(function() {
    digitalPulse(NodeMCU.D1, 1, duty * (1000/servo_frequency));
  }, 1000/servo_frequency);
  setTimeout(reset_pwm, 1000); // stop pwm, it's process/voltage intensive
}

var desired_temp = 225;
var current_temp;
var current_duty_percentage;
function setDamperPosition(){
  ohm_total = 0;
  var num_samples = 5.0;
  current_temp = 0;
  for (i = 0; i < num_samples; i++) {
    // take a bunch of samples for better accuracy
    current_temp += getCurrentTemp();
  }
  current_temp = current_temp / num_samples; // avg temp
  //console.log(ohm_total/num_samples); // avg ohms
  var full_open_offset_temp = -5;
  var full_open_until = desired_temp + full_open_offset_temp; // temp at which we start closing the damper
  var full_close_offset_temp = 10;
  var full_close_at = desired_temp + full_close_offset_temp; // temp at which we completely close the damper
  var partial_open_temp_range = full_close_at - full_open_until;
  var full_close_duty = 0.3; // duty where the damper is completely closed
  var full_open_duty = 0.7; // duty where the damper is completely open
  var current_duty;
  if(current_temp < full_open_until){
    // below target temp, completely open
    current_duty = full_open_duty;
  } else if(current_temp > full_close_at){
    // above target temp, completely closed
    current_duty = full_close_duty;
  } else {
    // partially open
    var duty_range = full_open_duty - full_close_duty;
    var duty_percentage = (full_close_at - current_temp) / partial_open_temp_range;
    current_duty = full_close_duty + (duty_range * duty_percentage);
  }
  current_duty_percentage = (current_duty - full_close_duty) / (full_open_duty - full_close_duty) * 100;
  pwm(current_duty);
}

function sendTempToAdafruit(){
  mqttPublish(current_temp, 'bbq.temperature');
}

function sendDesiredTempToAdafruit(){
  mqttPublish(desired_temp, 'bbq.desired-temperature');
}

function sendDamperToAdafruit(){
  mqttPublish(current_duty_percentage, 'bbq.damper-position');
}

// send data to io.adafruit.com platform via HTTP POST
var adafruit_api_key = 'ADAFRUIT IO API KEY';
var adafruit_username = 'ADAFRUIT IO USERNAME';
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
  });
  mqtt.on('disconnected', function() {
    console.log("MQTT disconnected... reconnecting.");
    setTimeout(function() {
      mqtt.connect(opts);
    }, 1000);
  });
}

function mqttPublish(value, feed){
  var url = adafruit_username + '/feeds/' + feed;
  mqtt.publish(url, value);
}

save();