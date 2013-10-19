var http  = require('http'),
    fs    = require('fs'),
    io    = require('socket.io'),
    rio   = require('./rio'),
    // rserve = require('rserve-client'),
    spawn = require('child_process').spawn;


respcont = fs.readFileSync('test_servers/front_end.html');

var port = (process.env.PORT || 5000); // proces.env.PORT is the port set by Heroku to listen on
server = http.createServer( function(req, res){
    fs.readFile('test_servers/front_end.html', function(err, page) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(page);
        res.end();
    });
    
}).listen(port);


console.log('Server up and listening at port ' + port);


var socket = io.listen(server);




socket.on('connection', function(client){


    client.on('message', function(msg) {
      console.log('client has sent:' + msg);
      //rio.evaluate(msg,Roptions);
      rio.sourceAndEvalString(msg,Roptions);

    });
    
    client.on('disconnect', function() {
      console.log('Client has disconnected');
    });

    //R MANAGEMENT
    Roptions = {
      callback:processResponse,
      host: "ec2-54-200-76-215.us-west-2.compute.amazonaws.com",
      //host: "localhost",
      port: 6311
    };

    function processResponse(err,res){
      if(!err){
        console.log('Response:' + res);
        client.emit('response', res);
      }else{
        console.log('error ocurred...');
        client.emit('response', 'An error ocurred: ' + res);
        console.log('Response:' + res);
      }
    }
});
