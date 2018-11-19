var spawn = require('child_process').spawn;
var amqp = require('amqplib');


const serverURI="amqp://mslgcpgp:n5Ya32JaLtoYt7Qu0uemu7SFNPpGw8T5@puma.rmq.cloudamqp.com/mslgcpgp";
const queuename='restartCamera'
const config={ durable: true, noAck: false }


const timeout = ms => new Promise(res => setTimeout(res, ms))

async function executeCommandAsync(code){
    for (var i = 0; i < 5; i++) {
        await executeSingleCommandAsync(code);
        await timeout(1000);
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



async function  onMessageReceived(content){
    var msgData = JSON.parse(content);
    var delta = msgData.timestamp - Math.floor(Date.now() / 1000)
    if (Math.abs(delta) < 20) {
        await executeCommandAsync(process.env.OFFCODE);
        await executeCommandAsync(process.env.ONCODE);
    }
    else{
        console.log("ignore");
    }
    

}





function reportError() {
    console.log(Math.floor(new Date() / 1000));
}
async function monitorConnection(connection) {
    var onProcessTerminatedHandler = function () { connection.close(); };
    connection.on('error', function (err) {
        console.log("on error queue" + serverURI + queuename);
        console.log(err);
        reportError();
        setTimeout(function () {
            listenToQueue(serverURI, queuename, config, onMessageReceived);
        }, 1000);
    });
    process.once('SIGINT', onProcessTerminatedHandler);
}

async function initAsync(){

    try {
        var connection = await amqp.connect(serverURI);
    }
    catch (connerr) {
        console.log("error connecting queue" + serverURI + queuename);
        reportError();
        setTimeout(function () {
            listenToQueue(serverURI, queuename, config, onMessageReceived);
        }, 1000);
        return;
    }
    monitorConnection(connection);
    var channel = await connection.createChannel();
    await channel.assertQueue(queuename, { durable: config.durable });
    channel.consume(queuename, function (msg) {
        try {
            var content = msg.content.toString();
            onMessageReceived(content);
            channel.ack(msg);
        } catch (err) {
            console.log("err consuming message" + serverURI + queuename);
            console.log(msg);
        }
    }, { noAck: config.noAck });
}

initAsync();




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