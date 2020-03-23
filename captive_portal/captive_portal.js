// WIFI Captive Portal

var wifi = require('Wifi');

var dnsIPStr = '192.168.4.1';
var page = 'building...';

// get Query name out of message
// offset = 12
// end \x00
function dnsQname(msg) {
    var i = 12;
    var qname = '';
    while ( msg[i] !== '\x00' ) {
	qname +=  msg[i];
	i++;
    }
    //console.log({qname:qname});
    return qname + '\x00';
}

/*
  1. line header
  2. line query
  3. line resource
*/
function dnsResponse(msg,dns_ip){
    return msg[0]+msg[1] + '\x81\x80'+'\x00\x01'+'\x00\x01'+'\x00\x00\x00\x00' +
	dnsQname(msg) + '\x00\x01' + '\x00\x01' +
	'\xc0\x0c'+'\x00\x01'+'\x00\x01'+'\x00\x00\x00\xf9'+'\x00\x04' + dns_ip  ;
}

function startDNSServer(port){
    var dgram = require('dgram');
    var dns_srv = dgram.createSocket('udp4');    
    dns_srv.on('error', (err) => {
	dns_srv.close();
    });
    dns_srv.on('message', (msg, info) => {
	var dnsIP = dnsIPStr.split('.').map(n => String.fromCharCode(parseInt(n, 10))).join('');
	// we only serve ip4
	if ( msg[msg.length-3] === '\x01') {
	    dns_srv .send(dnsResponse(msg,dnsIP),info.port,info.address);
	}
    });
    dns_srv.bind(port);
}

function startHttpServer(port){
    var server = require('http').createServer(function (req, res) {
	accept = req.headers.Accept || '';
	var a = url.parse(req.url, true);
	//console.log( { accept:accept,a :a } );
	if (a.pathname=="/connect") {
	    res.writeHead(200, {'Content-Type': 'text/plain'});
	    console.log(a.query);
	    wifi.connect(a.query.ssid,{password:a.query.pwd},function(err){
		if(err){
		    // TODO: If connect fails - this will not happen... need to handle errors
		} else {
		    console.log("Connected to access point, ", wifi.getIP());
		}
		// stop AP after it has time to tell client it connected to wifi
		setTimeout(function(){
		    server.close();
		    //dns_srv.close();
		    wifi.stopAP();
		    console.log(wifi.getStatus());
		    console.log(wifi.getDetails());
		    //wifi.save();
		    //wifi.disconnect();
		    console.log(process.memory());
		    var json_wifi_info = JSON.stringify(wifi.getDetails());
		    require("Storage").write("wifi.txt", json_wifi_info);
		    E.reboot();
		}, 15000);
		res.end(`connected to ${wifi.getIP().ip}`);
	    });
	    res.write("Connecting....\n");
	} else
	    if (accept !== '*\/*' || a.page === '/hotspot-detect.html'  ) {
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end(page);
	    } else  { // redirect to the Setup page
		var loc_ip = 'http://' + dnsIPStr;
		res.writeHead(302, {'Location': loc_ip,
				    'Content-Type': 'text/plain'});
		res.end();
	    }
    });
    server.listen(port);
}

function startAccessPoint(ssid,authMode, password){
    wifi.startAP(ssid,{"authMode" : authMode,"password" : password});
}

function start(){
    wifi.disconnect();
    startAccessPoint('EPS8266CaptivePortal','open',null);
    startHttpServer(80);
    startDNSServer(53);
}

function ssidScan(){
    wifi.scan(function(s){
	var scan = s;
	scan.map( ap => console.log( ap.ssid ) );
	page=`<!DOCTYPE html>
     <title> WiFi</title>
     <meta name="viewport" content="initial-scale=1.0">


     <body>
     <html>
     <h1>Captive Hotspot</h1>

     <form action="/connect" class="pure-form pure-form-aligned">
     <fieldset>
     <div class="pure-control-group">
     <label for="Sid">Access Point</label>
     <select name="ssid">`;
	scan.map( ap => page+=`<option>${ap.ssid}</option>`);
	page+=`</select>
     </div>
     <div class="pure-control-group">
     <label>Password</label>
     <input name="pwd" type="text" value="espruino">
     </div>
     <div class="pure-controls">
     <input type="submit" class="pure-button pure-button-primary" value="Connect">
     </div>
     </fieldset>
     </form>
     </html>
     </body>
     `;
    });
}

function clearSavedWifiCredentials(){
    require("Storage").erase("wifi.txt");
}

function onInit(){
    var wifi_info = require("Storage").readJSON("wifi.txt");
    console.log(wifi_info);
    if(wifi_info === undefined){
	console.log(wifi.getDetails());
	//wifi.restore();
	//console.log(wifi.getDetails());
	console.log("Starting captive portal...");
	ssidScan();
	setTimeout(start, 3000);
    } else {
	console.log("Attempting to connect using saved connection...");
	wifi.connect(wifi_info.ssid, {password: wifi_info.password}, function(err){
	    if(err){
		console.log("Connection error: " + err);
		//console.log("Removing saved details and restarting");
		//clearSavedWifiCredentials();
		//E.reboot();
	    } else {
		console.log("Connected using saved connection!");
		console.log(wifi.getIP());
		afterWifiConnected();
	    }
	});
    }
}

function afterWifiConnected(){
    // PUT YOUR CODE HERE TO RUN WHEN WIFI IS CONNECTED
}
