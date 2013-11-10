/* The following line is for disabling an unnecessary jshint warning. */
/* http://jslinterrors.com/eval-can-be-harmful/ */
/* jshint -W061 */
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
server = http.createServer(routing_handler).listen(port);
console.log('Server up and listening at port ' + port);

// for handling different http endpoints
function routing_handler(req, res) {
    switch(req.url) {
    case '/r_eval':
	handle_r_input(req, res);
	break;
    default:
	res.writeHead(400, 'URL endpoint ' + req.url + ' not supported', {'Content-Type': 'text/plain'});
	res.end();
    }
}

// a pre-parser for user input
function expression_handler(expr) {
    // check for single-quotes, throw error if there are
    // any, since we use them in the wrap_capture command
    if (expr.indexOf("'") >= 0) {
        throw "Error: expression cannot contain single-quotes at this time.\nPlease use double-quotes instead.";
    }
    if (expr.charAt(0) == "#") { // comments
        return expr;
    }
    // first char can only be . or alphanum. second can be ., alpha, _. All subsequent can be ., alphanum, _
    // see variable_name_regexp.txt
    var reg = RegExp("^([\\.]([\\.a-zA-Z_][\\.a-zA-Z0-9_]*)?|([a-zA-Z]([\\.a-zA-Z0-9_]*)?))$");
    if (reg.test(expr)) {
        return wrap_variable_access(expr);
    }
    if (expr.substring(0,4) == 'help') {
        return wrap_help_cmd(expr);
    }
    if (expr.substring(0,4) == 'plot') {
        return wrap_plot_cmd(expr);
    } // else
    return wrap_capture(expr);
}

// wrap a help command with the necessary peripherals to capture output
function wrap_help_cmd(expr) {
    return "out<-capture.output(tools:::Rd2txt(utils:::.getHelpFile(as.character(" + expr + ")))); outp = paste(out, collapse='\n'); outp";
}

// wrap a string in with "out=capture.output(eval(try(parse(text='MY_STRING'), silent=TRUE))); out"
function wrap_capture(expr) {
    return "out=capture.output(eval(try(parse(text='" + expr + "'), silent=TRUE))); outp = paste(out, collapse='\n'); outp";
}

// a special wrapper for printing raw variable names, which in rserve-js cause a fatal error in node
function wrap_variable_access(expr) {
    return "out=capture.output(eval(try(" + expr + ", silent=TRUE))); outp = paste(out, collapse='\n'); outp";
}

// wrap a plot command to capture output
function wrap_plot_cmd(expr) {
    // need to wrap the expr in error handling.
    var cmd = 'filename <- tempfile("plot", fileext=".svg"); ' +
	'svg(filename); ' +
	//wrap_capture(expr) + ' ' +
	expr + '; ' +
	'dev.off(); ' +
	'text <- readLines(filename, encoding="UTF-8"); ' +
	'paste(text, collapse="\n")';
    return cmd;
}

// some hard-coded tests
// r.eval('3*4',function(a) {console.log(a);});
// r.eval('try(3*4foobar, silent=TRUE)',function(a) {console.log(a);});
// r.eval('try(fizzbizz, silent=TRUE)',function(a) {console.log(a);});
// r.eval('3*5',function(a) {console.log(a);});

function handle_r_input(http_request, http_response) {
    // we define this callback here so it has access to the http_response object
    function processResponse(r_response_raw,err) {
	if (!err){
            var r_response = r_response_raw.value.value['0'];
            console.log('Raw response:' + r_response_raw);
	    if (r_response.substring(0,4) == 'plot') {
		// handle replacing the "_\b" with nothing in help output
		if (r_response.indexOf('\b') >= 0) {
		    r_response = r_response.replace('\b','');
		}
	    }
	    http_response.writeHead(200, {
		'Content-Length': r_response.length,
		'Content-Type': 'text/plain'
	    });
	    http_response.write(JSON.stringify({'r_response':r_response}));
	    http_response.end();
	} else {
            console.log('Error in response: ' + r_response_raw);
	    http_response.writeHead(400, {
		'Content-Length': r_response_raw.length,
		'Content-Type': 'text/plain'
	    });
	    http_response.write(JSON.stringify({'r_response':r_response_raw,
						'err':'An error occurred during expression eval: ' + err}));
	    http_response.end();
	}
    }

    // first, only accept POSTs
    if (http_request.method == 'GET') {
	processResponse('','Error: not configured to support HTTP GET requests');
	return;
    } else if (http_request.method == 'POST') {
	console.log('Client has sent HTTP POST');
    } else {
	processResponse('','Error: not configured to support HTTP requests of type ' + http_request.method);
	return;
    }

    console.log('Body of post:' + http_request.body);
    //console.assert(http_request.body, 'Error: no http_request.body');

    // start collecting the http POST data
    var fullBody = '';
    http_request.on('data', function(chunk) {
	console.log('Received more data:' + chunk.toString());
	fullBody += chunk.toString();
    });

    http_request.on('end', function() {
	try {
	    console.log('Client has sent:' + fullBody);
            msg = expression_handler(fullBody);
            console.log('Evaluating command "' + msg + '"');
            r.eval(msg, processResponse);
	    return;
	} catch (err) {
            console.log('Received error:');
            console.log(err);
	    // use error handling code in processResponse
	    processResponse('',err);
	    return;
	}
    });
}
