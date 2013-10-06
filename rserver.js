var rio = require('rio'),
    fs = require("fs");



options = {
    // callback: function (err, res) {
    //     if (err) {
    //         util.puts(res);
    //     } else {
    //         util.puts("Rserve call failed");
    //     }
    // },
    callback: getPlot,
    host: "127.0.0.1",
    port: 6311,
    // path: undefined,
    // user: "anon",
    // password: "anon"
};

function getPlot(err, res) {
    if (!err) {
        fs.writeFile("myPlot.png", res, { encoding: "binary" }, function (err) {
            if (!err) {
                console.log("myPlot.png saved in " + __dirname);
            }
        });
    } else {
        console.log("Loading image failed");
    }
}

function getResponse(err, res){
    if (!err) {
        console.log("res:"+res);
    } else {
        console.log("Error");
        console.log(res);
    }
}

// rio.evaluate("try(j, silent=TRUE)",options);

rio.sourceAndEval("nd.R", options);

// "paste(capture.output(print(summary(mymodel))),collapse=\"\\n\")"
// rio.evaluate('plot(1:5,1:5)',{
//     callback:getPlot
// });




