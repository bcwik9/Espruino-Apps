var WIFI_NAME = 'WIFI SSID NAME';
var WIFI_OPTIONS = { password: 'WIFI PASSWORD' };
var hostname = 'EspServer';

E.on('init', function() {
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
      console.log('Connected!');
      runServer();
    }
  );
});

function runServer() {
  http.createServer(function(req, res) {
    // send a JSON response
    res.writeHead(200, {'Content-Type': 'application/json'});
    var response_data = {
      hello: "world"
    };
    res.end(JSON.stringify(response_data));
  }).listen(3000);
}

save(); // make sure everything loads on restart