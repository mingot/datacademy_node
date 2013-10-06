
var http  = require('http'),
    fs    = require('fs'),
    io    = require('socket.io'),
    rio   = require('./rio/lib/rio'),
    spawn = require('child_process').spawn;

 
respcont = fs.readFileSync('term.html');

var port = (process.env.PORT || 5000);
server = http.createServer().listen(port);
console.log('Server up and listening at port ' + port);



var socket = io.listen(server);
socket.on('connection', function(client){

    // var sh = spawn('bash');

    client.on('message', function(msg) {
      console.log('client has sent:' + msg);
      // sh.stdin.write(msg + '\n');
      // rio.evaluate(msg,Roptions);
      rio.sourceAndEvalString(msg,Roptions);
    });
    
    client.on('disconnect', function() {
      console.log('Client has disconnected');
    });

    //R MANAGEMENT
    Roptions = {
      callback:processResponse,
      host: "ec2-54-200-76-215.us-west-2.compute.amazonaws.com",
      port: 6311
      // path: undefined,
      // user: "anon",
      // password: "anon"
    };

    function processResponse(err,res){
      if(!err){
        console.log('Response:' + res);
        client.emit('response', res);
      }else{
        console.log('error ocurred...');
        client.emit('response', 'An error ocurred...');
        console.log('Response:' + res);
      }
    }

    // //CONSOLE MANAGEMENT
    // sh.stdout.on('data', function(data) {
    //   client.emit('response', data);
    // });
 
    // sh.stderr.on('data', function(data) {
    //   client.emit('response', data);
    // });
 
    // sh.on('exit', function (code) {
    //   client.emit('response','** Shell exited: ' + code + ' **');
    // });
});

