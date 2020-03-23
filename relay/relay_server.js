// send data to io.adafruit.com platform
var adafruit_api_key = 'IO.ADAFRUIT.COM API KEY';
var adafruit_username = 'IO.ADAFRUIT.COM USERNAME';
var adafruit_feed = 'IO.ADAFRUIT.COM FEED';

E.on('init', function() {
  var WIFI_NAME = 'WIFI SSID NAME';
  var WIFI_OPTIONS = { password: 'WIFI PASSWORD' };
  var hostname = "EspRelay";
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
      runServer();
    }
  );
});

function runServer() {
  var http = require('http');
  http.createServer(function(req, res) {
    res.writeHead(200);
    var status = req.url.replace('/?', '');
    if(status === '/on'){
      digitalWrite(NodeMCU.D0, false);
      sendDataToAdafruit('true');
    } else if (status === '/off'){
      digitalWrite(NodeMCU.D0, true);
      sendDataToAdafruit('false');
    }
    res.end();
  }).listen(3000);
}

function sendDataToAdafruit(datapoint){
  var payload = JSON.stringify({
    value: datapoint
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
