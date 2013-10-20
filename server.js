var http  = require('http'),
    fs    = require('fs'),
    io    = require('socket.io'),
    rserve = require('rserve'),
    spawn = require('child_process').spawn;


respcont = fs.readFileSync('test_servers/front_end.html');

// start r connection
console.log("Starting rserve connection");
var r = rserve.create();

// start listening for connections from django frontend
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

    // some hard-coded tests
    // r.eval('3*4',function(a) {console.log(a);});
    // r.eval('try(3*4foobar, silent=TRUE)',function(a) {console.log(a);});
    // r.eval('try(fizzbizz, silent=TRUE)',function(a) {console.log(a);});
    // r.eval('3*5',function(a) {console.log(a);});

    client.on('message', function(msg) {
      console.log('client has sent:' + msg);
        try {
            // if message doesn't contain an "=", this works
            // but if it does, write eval(varname=try(rest_of_expr,silent=TRUE));
            msg = 'try(' + msg + ', silent=TRUE)';
            r.eval(msg, processResponse);
        } catch (err) {
            console.log(err);
        }
    });

    client.on('disconnect', function() {
      console.log('Client has disconnected');
    });

    function processResponse(res,err){
      if(!err){
        console.log('Response:' + res.value.value['0']);
        client.emit('response', res.value.value['0']);
      }else{
        console.log('error ocurred...');
        client.emit('response', 'An error ocurred: ' + res);
        console.log('Response:' + res);
      }
    }
});

