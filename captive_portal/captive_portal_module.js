// WIFI Captive Portal

var wifi = require('Wifi');

var C = {
    DNSIPSTR: '192.168.4.1'
}

function CaptivePortal(){
    this.page = 'building...'
}

// get Query name out of message
// offset = 12
// end \x00
CaptivePortal.prototype.dnsQname = function(msg) {
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
CaptivePortal.prototype.dnsResponse = function(msg,dns_ip){
    return msg[0]+msg[1] + '\x81\x80'+'\x00\x01'+'\x00\x01'+'\x00\x00\x00\x00' +
	this.dnsQname(msg) + '\x00\x01' + '\x00\x01' +
	'\xc0\x0c'+'\x00\x01'+'\x00\x01'+'\x00\x00\x00\xf9'+'\x00\x04' + dns_ip  ;
}

CaptivePortal.prototype.startDNSServer = function(port){
    var dgram = require('dgram');
    var dns_srv = dgram.createSocket('udp4');    
    dns_srv.on('error', (err) => {
	dns_srv.close();
    });
    dns_srv.on('message', (msg, info) => {
	var dnsIP = C.DNSIPSTR.split('.').map(n => String.fromCharCode(parseInt(n, 10))).join('');
	// we only serve ip4
	if ( msg[msg.length-3] === '\x01') {
	    dns_srv.send(this.dnsResponse(msg,dnsIP),info.port,info.address);
	}
    });
    dns_srv.bind(port);
}

CaptivePortal.prototype.startHttpServer = function(port){
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
		    // stop AP and services after it has time to tell client it connected to wifi
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
		}
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

CaptivePortal.prototype.startAccessPoint = function(ssid,authMode, password){
    wifi.startAP(ssid,{"authMode" : authMode,"password" : password});
}

CaptivePortal.prototype.startServer = function(){
    //wifi.disconnect();
    this.startAccessPoint('EPS8266CaptivePortal','open',null);
    this.startHttpServer(80);
    this.startDNSServer(53);
}

CaptivePortal.prototype.ssidScan = function(){
    wifi.scan(function(s){
	var scan = s;
	scan.map( ap => console.log( ap.ssid ) );
	this.page=`<!DOCTYPE html>
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
	scan.map( ap => this.page+=`<option>${ap.ssid}</option>`);
	this.page+=`</select>
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

CaptivePortal.prototype.clearSavedWifiCredentials = function(){
    require("Storage").erase("wifi.txt");
}

CaptivePortal.prototype.start = function(){
    var wifi_info = require("Storage").readJSON("wifi.txt");
    console.log(wifi_info);
    if(wifi_info === undefined){
	console.log(wifi.getDetails());
	//wifi.restore();
	//console.log(wifi.getDetails());
	console.log("Starting captive portal...");
	setInterval(this.ssidScan, 10000);
	this.startServer();
    } else {
	console.log("Attempting to connect using saved connection...");
	wifi.connect(wifi_info.ssid, {password: wifi_info.password}, function(err){
	    if(err){
		console.log("Connection error: " + err);
		// TODO: might not want to delete saved credentials if wifi is temporarily unavailable.
		// maybe wire up a button or HTTP method to clear the wifi credentials?
		
		//console.log("Removing saved details and restarting");
		//this.clearSavedWifiCredentials();
		//E.reboot();
	    } else {
		console.log("Connected using saved connection!");
		console.log(wifi.getIP());
	    }
	});
    }
}

exports.start = function(callback){
    var portal = new CaptivePortal();
    portal.start();
    if(callback){
	callback();
    }
    return portal;
}
