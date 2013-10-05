var rio = require('rio');

options = {
    // callback: function (err, res) {
    //     if (err) {
    //         util.puts(res);
    //     } else {
    //         util.puts("Rserve call failed");
    //     }
    // },
    host: "ec2-54-200-76-215.us-west-2.compute.amazonaws.com",
    port: 6311
    // path: undefined,
    // user: "anon",
    // password: "anon"
};

function getPlot(err, res) {
    if (!err) {
        var image = new PNG(res);
        fs.writeFile("myPlot.png", res, { encoding: "binary" }, function (err) {
            if (!err) {
                console.log("myPlot.png saved in " + __dirname);
            }
        });
    } else {
        console.log("Loading image failed");
    }
}

rio.evaluate("pi / 2 * 2",options);
rio.evaluate('c(1, 2)',options);
rio.evaluate("as.character('Hello World')",options);
rio.evaluate('c("a", "b")',options);
rio.evaluate('Sys.sleep(5); 11',options);
// rio.evaluate('plot(1:5,1:5)',{
//     callback:getPlot
// });




