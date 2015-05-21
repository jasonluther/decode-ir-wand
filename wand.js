var util = require('util');
var spawn = require('child_process').spawn;
var wand = spawn('/home/pi/git/decode-ir-wand/wand.pl');
var os = require("os");
var hostname = os.hostname();

wand.stdout.on('data', function(data) {
  var string = data.toString().trim();
  var m;
  if (m = string.match(/^ID:(......)$/)) {
    var id = m[1];
    console.log(id + " waved at " + hostname);
  }
});

wand.stderr.on('data', function(data) {
  console.log('stderr: ' + data.toString());
});

wand.on('exit', function (code) {
  console.log('child process exited with code ' + code);
});
