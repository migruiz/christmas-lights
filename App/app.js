var spawn = require('child_process').spawn;


var mqtt = require('mqtt')
global.mtqqURL=process.env.mtqqURL
global.turnOnLightsTopic="lightson"
global.lightsOnNextNodeTopic="lightsOnNextNode"
global.lightsOffNextNodeTopic="lightsOffNextNode"
global.turnOffLightsTopic="lightsoff"
global.onCodes=JSON.parse(process.env.onCodes)
global.offCodes=JSON.parse(process.env.offCodes)
global.nodeId=parseInt(process.env.nodeId)
global.waitForNextCommand=500
global.expectedSingleCommandExecTime=200
global.roundCycles=4

var client  = mqtt.connect(global.mtqqURL)
 
client.on('connect', function () {
  client.subscribe(global.turnOnLightsTopic)
  client.subscribe(global.turnOffLightsTopic)
  client.subscribe(global.lightsOnNextNodeTopic)
  client.subscribe(global.lightsOffNextNodeTopic)
})
client.on('message',async function (topic, message) {
    if (topic === global.turnOnLightsTopic) {    
        if (global.nodeId==1){
            await executeMultipleCommandsAsync(global.onCodes)
            client.publish(global.lightsOnNextNodeTopic,global.nodeId+1)
        }  
        else{  
            waitToSwitchLightsOn()
        }
    }
    else  if (topic === global.lightsOnNextNodeTopic && parseInt(message)==global.nodeId) {
        clearTimeout(lightsOnTimeout)
        await executeMultipleCommandsAsync(global.onCodes)
    }    
    else  if (topic === global.turnOffLightsTopic) {
        if (global.nodeId==1){
            await executeMultipleCommandsAsync(global.offCodes)
            client.publish(global.lightsOffNextNodeTopic,global.nodeId+1)
        }  
        else{  
            waitToSwitchLightsOff()
        }
    }
    else  if (topic === global.lightsOffNextNodeTopic && parseInt(message)==global.nodeId) {
        clearTimeout(lightsOffTimeout)
        await executeMultipleCommandsAsync(global.offCodes)
    }  
  })

var lightsOnTimeout;
function waitToSwitchLightsOn(){
    var expectedSingleCommandExecution=global.waitForNextCommand+global.expectedSingleCommandExecTime;
    console.log("expectedSingleCommandExecutionOn",expectedSingleCommandExecution)
    var expectedFullCycleExecution=global.roundCycles*global.onCodes.length*expectedSingleCommandExecution
    console.log("expectedFullCycleExecutionOn",expectedFullCycleExecution)
    var waitTime=(global.nodeId-1)*expectedFullCycleExecution;
    console.log("waitTimeOn",waitTime)
    lightsOnTimeout=setTimeout(async ()=>{ 
       await executeMultipleCommandsAsync(global.onCodes)
       client.publish(global.lightsOnNextNodeTopic,global.nodeId+1)
    },waitTime)
}



var lightsOffTimeout;
function waitToSwitchLightsOff(){
    var expectedSingleCommandExecution=global.waitForNextCommand+global.expectedSingleCommandExecTime;
    console.log("expectedSingleCommandExecutionOff",expectedSingleCommandExecution)
    var expectedFullCycleExecution=global.roundCycles*global.offCodes.length*expectedSingleCommandExecution
    console.log("expectedFullCycleExecutionOff",expectedFullCycleExecution)
    var waitTime=(global.nodeId-1)*expectedFullCycleExecution;
    console.log("waitTimeOff",waitTime)
    lightsOffTimeout=setTimeout(async ()=>{ 
       await executeMultipleCommandsAsync(global.offCodes)
       client.publish(global.lightsOffNextNodeTopic,global.nodeId+1)
    },waitTime)
}


const timeout = ms => new Promise(res => setTimeout(res, ms))

async function executeMultipleCommandsAsync(codes) {
    for (var i = 0; i < global.roundCycles; i++) {
        for (codeIndex = 0; codeIndex < codes.length;codeIndex++) { 
            var code=codes[codeIndex];
             await executeSingleCommandAsync(code);
             await timeout(global.waitForNextCommand);
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
