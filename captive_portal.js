// Captive Portal
// Original:
// https://gist.github.com/MaBecker/ae9dade26b44524e076ca19f5fd72fab
// https://gist.githubusercontent.com/wilberforce/cc6025a535b8a4c7e2910d4ba7845f11

var http = require('http');
var wifi = require('Wifi');

var dgram = require('dgram');

var dns_srv = dgram.createSocket('udp4');

var SSID  = 'CaptivePortalTest';
var authMode = 'open';
var password = null;
var portHTTP = 80;
var portDNS  = 53;

var dnsIPStr = '192.168.4.1';
var dnsIP    = dnsIPStr.split('.').map(n => String.fromCharCode(parseInt(n, 10))).join('');

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
    console.log({qname:qname});
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
    dns_srv .on('error', (err) => {
	dns_srv.close();
    });
    dns_srv.on('message', (msg, info) => {
	// we only serve ip4
	if ( msg[msg.length-3] === '\x01') {
	    dns_srv .send(dnsResponse(msg,dnsIP),info.port,info.address);
	}
    });
    dns_srv.bind(port);
}

function startHttpServer(port){
    var server = http.createServer(function (req, res) {
	accept = req.headers.Accept || '';
	var a = url.parse(req.url, true);
	console.log( { accept:accept,a :a } );
	if (a.pathname=="/connect") {
	    res.writeHead(200, {'Content-Type': 'text/plain'});
	    console.log(a.query);
	    wifi.connect(a.query.ssid,{password:a.query.pwd},function(){
		// TODO: If connect fails - this will not happen... need to handle errors
		console.log("Connected to access point, ",wifi.getIP());
		// stop AP after it has time to tell client it connected to wifi
		setTimeout(function(){
		    wifi.stopAP();
		}, 15000);
		//wifi.save();
		res.end(`connected to ${wifi.getIP().ip}`);
	    });
	    res.write("Connecting....\n");
	} else
	    if (accept !== '*\/*' || a.page === '/hotspot-detect.html'  ) {
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end(page);
	    } else  { // redirect to the Setup page
		res.writeHead(302, {'Location': 'http://192.168.4.1',
				    'Content-Type': 'text/plain'});
		res.end();
	    }
    });
    server.listen(port);
}

function startAccessPoint(ssid,authMode, password){
    wifi.startAP(ssid,{"authMode" : authMode,"password" : password});
}

function disconnectStation(){
    wifi.disconnect();
}
var scan=[];

function start(){
    disconnectStation();
    startAccessPoint('CaptivePortalTest','open',null);
    startHttpServer(80);
    startDNSServer(53);
}

function ssidScan(){
    wifi.scan(function(s){
	scan=s;
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

function onInit(){
    ssidScan();
    setTimeout(start,3000);
}

save();
