var mqtt = require('mqtt')

function MQTTClient(mqttServer) {

    var client = mqtt.connect(mqttServer);



    client.on('reconnect', function () {
        console.log((new Date()).toString());
        console.log('reconnect');
    })
    client.on('close', function () {
        console.log((new Date()).toString());
        console.log('close');
    })
    client.on('offline', function () {
        console.log((new Date()).toString());
        console.log('offline');
    })
    client.on('error', function (error) {
        console.log((new Date()).toString());
        console.log('error');
        console.log(error);
    })
    client.on('end', function () {
        console.log((new Date()).toString());
        console.log('end');
    })

    this.subscribeData = function (topic, onData) {
        client.subscribe(topic);
        client.on("message", function (mtopic, message) {
            if (topic === mtopic) {
                var data = JSON.parse(message);
                onData(data);
            }
        });
    }
    this.publishData = function (topic, data) {
        var message = JSON.stringify(data);
        client.publish(topic, message);
    }
}



var singleton;


exports.cluster = function () {

    if (!singleton) {
        singleton = new MQTTClient(global.mtqqURL);
    }

    return singleton;
}