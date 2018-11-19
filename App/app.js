var spawn = require('child_process').spawn;


var mqtt = require('mqtt')
global.mtqqURL=process.env.mtqqURL
global.turnOnLightsTopic=process.env.turnOnLightsTopic
global.turnOffLightsTopic=process.env.turnOffLightsTopic
global.onCodes=process.env.onCodes
global.offCodes=process.env.offCodes

var client  = mqtt.connect(global.mtqqURL)
 
client.on('connect', function () {
  client.subscribe(global.turnOnLightsTopic)
  client.subscribe(global.turnOffLightsTopic)
})
client.on('message',function (topic, message) {
    if (topic === global.turnOnLightsTopic) {
        executeMultipleCommandsAsync(JSON.parse(global.onCodes))
    }
    else  if (topic === global.turnOffLightsTopic) {
        executeMultipleCommandsAsync(JSON.parse(global.offCodes))
    }
  })


const timeout = ms => new Promise(res => setTimeout(res, ms))

async function executeMultipleCommandsAsync(codes) {
    for (var i = 0; i < 4; i++) {
        for (codeIndex = 0; codeIndex < codes.length;codeIndex++) { 
            var code=codes[codeIndex];
             await executeSingleCommandAsync(code);
             await timeout(500);
        }


    }
}

function executeSingleCommandAsync(code) {
    return new Promise(function (resolve, reject) {
        const command = spawn('/433Utils/RPi_utils/codesend'
            , [
                code
                , '-l'
                , '200'
            ]);
        command.stdout.on('data', data => {
            console.log(data.toString());
        });
        command.on('exit', function (code, signal) {
            console.log('exited');
            resolve();
        });
    });
}



// Catch uncaught exception
process.on('uncaughtException', err => {
    console.dir(err, { depth: null });
    process.exit(1);
});
process.on('exit', code => {
    console.log('Process exit');
    process.exit(code);
});
process.on('SIGTERM', code => {
    console.log('Process SIGTERM');
    process.exit(code);
});
