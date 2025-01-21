//
//  index.js
//  Frontend version 1.0
//  Created by Ingenuity i/o on 2025/01/15
//
//  la partie front de l'app
//  Copyright © 2023 Ingenuity i/o. All rights reserved.
//

//server connection
function isConnectedToServerChanged(isConnected)
{
    if (isConnected)
        document.getElementById("connectedToServer").style.background = 'green';
    else
        document.getElementById("connectedToServer").style.background = 'red';
}


IGS.netSetServerURL("ws://localhost:5000");
IGS.agentSetName("Frontend");
IGS.observeWebSocketState(isConnectedToServerChanged);

IGS.definitionSetDescription("la partie front de l'app");
IGS.definitionSetVersion("1.0");



IGS.outputCreate("symbol", iopTypes.IGS_STRING_T, "");
IGS.outputCreate("timeframe", iopTypes.IGS_STRING_T, "");
IGS.outputCreate("start_time", iopTypes.IGS_DOUBLE_T, 0);
IGS.outputCreate("end_time", iopTypes.IGS_DOUBLE_T, 0);
IGS.outputCreate("manual_order", iopTypes.IGS_DATA_T, new ArrayBuffer());


//Initialize agent

//actually start ingescape
IGS.start();


//
// HTML example
//

document.getElementById("serverURL").value = IGS.netServerURL();
document.getElementById("name").innerHTML = IGS.agentName();

function executeAction() {
    //add code here if needed
}

//update websocket config
function setServerURL() {
    IGS.netSetServerURL(document.getElementById("serverURL").value);
}

//write outputs
function setsymbolOutput() {
    IGS.outputSetString("symbol", document.getElementById("symbol_output").value);
}

function settimeframeOutput() {
    IGS.outputSetString("timeframe", document.getElementById("timeframe_output").value);
}

function setstart_timeOutput() {
    IGS.outputSetDouble("start_time", Number(document.getElementById("start_time_output").value));
}

function setend_timeOutput() {
    IGS.outputSetDouble("end_time", Number(document.getElementById("end_time_output").value));
}

function setmanual_orderOutput() {
    var dataHex = document.getElementById("manual_order_output").value;
    if (dataHex.length === 0) {
        IGS.outputSetData("manual_order", null);
        return false;
    }
    else {
        // split the string into pairs of octets
        var pairs = dataHex.match(/[0-9A-Fa-f]{2}/g);
        if (pairs) {
            // dataHex is valid, convert the octets to integers
            var uint8array = new Uint8Array(pairs.map(function (h) {
                return parseInt(h, 16);
            }));
            IGS.outputSetData("manual_order", uint8array.buffer);
            return false;
        }
    }
    return true;
}

