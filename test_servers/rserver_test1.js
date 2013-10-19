var http = require('http');
var Rserve = require('rserve');

var s = Rserve.create({
	    //host: 'http://54.200.76.215:6311',
 	    host: 'http://127.0.0.1:8081/',
        //host: 'http://ec2-54-200-76-215.us-west-2.compute.amazonaws.com:6311',
        on_connect: test,
        on_close: function(msg) {
            console.log("Socket closed. (!?)");
            console.log(msg);
        }
    });

// s.on('error', function(e) {
// 	console.log('ERROR:' + e);
// };

function test() {
	console.log('CONNECTED DAMMIT');
}
