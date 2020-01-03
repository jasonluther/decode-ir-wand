const fs = require('fs');
const readline = require('readline');
const util = require('util');
var spawn = require('child_process').spawn;
var irdata = spawn('/usr/bin/ir-ctl', ['-r']);
//var irdata = spawn('/bin/cat', ['./new.txt']);

console.log("Started");

var ir_counter = 0;
var ir_current_nibble = '';
var ir_total_counter = 0;
var ir_current_reading = '';
var ir_last_space_time = 0;
var ir_last_duty_cycle = 0;
const ir_duration_cutoff = 0.3481;

var lines_buffer = [];

irdata.stdout.on('data', function(data) {
  var str = data.toString();
  var lines = str.split(/\n/g);
  lines_buffer.push(lines);
});

function waitForLines() {
  if (lines_buffer.length > 0) {
    var lines = lines_buffer.shift();
    for (var i=0; i < lines.length; i++) {
      handleLine(lines[i]);
    }
  } else {
    //console.log('waiting');
  }
}

setInterval(waitForLines, 100);

function handleLine(line) {
  var m;
  if (m = line.match(/(pulse|space|timeout) (\d+)/)) {
    var what = m[1];
    var timing = parseInt(m[2]);
    //console.log('What: ' + what + ' -> ' + timing);

    switch(what) {
      case 'pulse': 
        ir_counter++;
        ir_total_counter++;
        if (ir_last_space_time > 0) {
          var duty_cycle = ir_last_duty_cycle = ir_last_space_time + timing;
          var duration = timing/duty_cycle;
          if (duration < ir_duration_cutoff) {
            ir_current_nibble += 0;
          } else {
            ir_current_nibble += 1;
          }
        } else {
          // First pulse in the reading, so assume 0
          ir_current_nibble += 0;
        }
        //console.log(ir_counter + ' ' + ir_total_counter + ' ' + ir_current_nibble + ' ' + timing + ' ' + duty_cycle);
        break;
      case 'space': 
        ir_last_space_time = timing
        break;
      case 'timeout': 
        if ((ir_total_counter > 0) && (ir_total_counter < 56)) {
          console.log("Reading was short: " + ir_total_counter + " bits");
        } else if (ir_total_counter > 56) {
          console.log("Reading was too long: " + ir_total_counter + " bits");
        }
        ir_counter = ir_total_counter = 0;
        ir_current_nibble = ir_current_reading = '';
        break;
    }
    if (ir_counter == 4) {
      nibble = parseInt(ir_current_nibble, 2).toString(16);
      ir_current_reading += nibble;
      ir_current_nibble = '';
      ir_counter = 0;
    }
    if (ir_total_counter == 56) {
      var result = ir_current_reading;
      ir_current_reading = '';
      ir_total_counter = 0;
      handleResult(result);
    }
  }
}

function handleResult(reading) {
  console.log('Raw reading: ' + reading);
  if (m = reading.match(/(..)(......)(......)/)) {
    var zeroes = m[1];
    var id = m[2];
    var motion = m[3];
    if (zeroes != '00') {
      console.log('Reading did not start with 00');
      return;
    }
    console.log('ID: ' + id);
    return id;
  }
}

irdata.stderr.on('data', function(data) {
  console.log('stderr: ' + data.toString());
});

irdata.on('exit', function (code) {
  console.log('child process exited with code ' + code);
});
