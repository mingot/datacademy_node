/* The following line is for disabling an unnecessary jshint warning. */
/* http://jslinterrors.com/eval-can-be-harmful/ */
/* jshint -W061 */
/* also the one var deletion */
/* jshint -W051 */
var http  = require('http'),
fs    = require('fs'),
io    = require('socket.io'),
rserve = require('rserve'),
spawn = require('child_process').spawn;

respcont = fs.readFileSync('test_servers/front_end.html');

// create a current user map -- just in memory for now
var usermap = {};
// add some default users for debugging
new_user("user_cookie_1");
new_user("user_cookie_2");
new_user("user_cookie_3");
console.log("Created usermap: %j", usermap);

// start test connection to verify the rserver is up, then destroy the connection
var r_test_connection = rserve.create();
delete r_test_connection;
console.log("Was able to create a test connection to rserve");

// start listening for connections from django frontend
var port = (process.env.PORT || 5000); // proces.env.PORT is the port set by Heroku to listen on
var server = http.createServer(routing_handler).listen(port);
console.log('Server up and listening at port ' + port);

// for handling different http endpoints
function routing_handler(req, res) {
    // do some parsing of the req.url to get the root domain
    var url_groups = req.url.split("/");
    if (url_groups.length < 2) {
        sendResponse(res, 400, 'URL endpoint ' + req.url + ' not supported');
    }
    // take all elements after first group
    url_groups = url_groups.slice(1, url_groups.length );
    var first_url_group = url_groups[0];

    switch(first_url_group) {
    case '': // '/'
	console.log('Posting locally');
        fs.readFile('test_servers/front_end.html', function(err, page) {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(page);
            res.end();
        });
        break;
    case 'lib': // '/lib' for loading jquery and other front_end dependencies
	if (url_groups.length > 2) {
            sendResponse(res, 400, 'URL endpoint ' + req.url + ' not supported');
	}
	// use second val to retreive file
	console.log('Posting local lib ' + req.url);
        // TODO: include Content-Length?
        fs.readFile('test_servers/lib/' + url_groups[1], function(err, page) {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(page);
            res.end();
        });
        break;
    // TODO eventually add the ability to register new users here
    // case 'login':
    //     break;
    case 'r_eval': // '/r_eval'
        // get user auth cookie
        console.log('Headers: %j', req.headers);
        if (!req.headers.hasOwnProperty("cookie")) {
            sendResponse(res, 400, 'Error: no cookie header in HTTP POST request');
        }

        // get the user's user_obj
        var user_obj = get_user_object(req.headers.cookie);

        // check this user exists already
        if (!user_obj) {
            sendResponse(res, 400, 'Error: no user with cookie "' + req.headers.cookie + '"');
        }

        // pass this user's rserve-js connection to handle_r_input
	handle_r_input(req, res, user_obj);
	break;
    default:
        sendResponse(res, 400, 'URL endpoint ' + req.url + ' not supported');
    }
}

// add a new user to the usermap
// TODO add username, other credentials? or is that front-end only?
function new_user(user_cookie) {
    var user_obj = {};
    // create a new connection
    user_obj.r_connection = rserve.create();
    set_user_object(user_cookie, user_obj);
}

// get the user object from the usermap. return false if it doesn't exist
function get_user_object(user_cookie) {
    if (!(user_cookie in usermap)) {
        return false;
    }
    return usermap[user_cookie];
}

// test if the usermap has a particular user's cookie
function has_user(user_cookie) {
    return (user_cookie in usermap);
}

// set a user object in the usermap
function set_user_object(user_cookie, user_object) {
    usermap[user_cookie] = user_object;
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

// a simple function to write to an HTTP response
function sendResponse(http_response, statusCode, responseString) {
    http_response.writeHead(statusCode, {
	'Content-Length': responseString.length,
	'Content-Type': 'text/plain'
    });
    http_response.write(responseString);
    http_response.end();
}

function handle_r_input(http_request, http_response, user_obj) {
    // we define this callback here so it has access to the http_response object
    function processResponse(r_response_raw,err) {
	if (!err){
            console.log("Raw value: %s", r_response_raw.toString());
            var r_response = r_response_raw.value.value['0'];
            console.log('Raw response: %j', r_response_raw);
            if (r_response.substring(0,4) == 'plot') {
                // handle replacing the "_\b" with nothing in help output
                if (r_response.indexOf('\b') >= 0) {
                    r_response = r_response.replace('\b','');
                }
            }
            responseString = JSON.stringify({'r_response':r_response});
            sendResponse(http_response, 200, responseString);
        } else {
            console.log('Error in response: ' + r_response_raw);
            responseString = JSON.stringify({'r_response':r_response_raw,
                                             'err':'An error occurred during expression eval: ' + err});
            sendResponse(http_response, 400, responseString);
        }
    }

    // first, only accept POSTs
    if (http_request.method == 'GET') {
        processResponse('','Error: not configured to support HTTP GET requests for /r_eval');
        return;
    } else if (http_request.method == 'POST') {
        console.log('Client has sent HTTP POST');
    } else {
        processResponse('','Error: not configured to support HTTP requests of type ' + http_request.method + ' for /r_eval');
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
            // extract expression from JSON body
            var body_obj = JSON.parse(fullBody);
            var r_cmd_raw = body_obj.r_cmd;
            console.log('r_cmd_raw is ' + r_cmd_raw);
            var r_cmd = expression_handler(r_cmd_raw);
            console.log('Evaluating command "' + r_cmd + '"');
            user_obj.r_connection.eval(r_cmd, processResponse);
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
