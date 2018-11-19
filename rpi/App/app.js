var spawn = require('child_process').spawn;
var mqtt = require('./mqttCluster.js');


//global.mtqqURL


const timeout = ms => new Promise(res => setTimeout(res, ms))

async function executeMultipleCommandsAsync(codes) {
    for (var i = 0; i < 3; i++) {
        for (var code in codes) {
            await executeSingleCommandAsync(code);
            await timeout(250);
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








function reportError() {
    console.log(Math.floor(new Date() / 1000));
}


function init() {

    mqtt.cluster().subscribeData(global.turnOnLightsTopic, () => { executeMultipleCommandsAsync(global.SwitchOnCodes) });
    mqtt.cluster().subscribeData(global.turnOffLightsTopic, () => { executeMultipleCommandsAsync(global.SwitchOffCodes) });
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