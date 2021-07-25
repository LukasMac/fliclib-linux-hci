/*
 * This example program connects to already paired buttons and register event listeners on button events.
 * Run the newscanwizard.js program to add buttons.
 */

const axios = require("axios");
var fliclib = require("./fliclibNodeJs");
var FlicClient = fliclib.FlicClient;
var FlicConnectionChannel = fliclib.FlicConnectionChannel;

var client = new FlicClient("localhost", 5551);
var DOUBLE_CLICK_DELAY = 300; //ms
const HOME_AUTOMATION_URL = "http://192.168.86.22:3001",

function listenToButton(bdAddr) {
  var cc = new FlicConnectionChannel(bdAddr);
  var lastButtonUpTime = 0;
  var lastButtonDownTime = 0;
  var singleClickTimer;

  client.addConnectionChannel(cc);
  cc.on("buttonUpOrDown", function (clickType, wasQueued, timeDiff) {
    // console.log(bdAddr + " " + clickType + " " + (wasQueued ? "wasQueued" : "notQueued") + " " + timeDiff + " seconds ago");

    if (clickType === "ButtonDown" && timeDiff < 5) {
      lastButtonDownTime = new Date().getTime();
    }

    if (clickType === "ButtonUp" && timeDiff < 5) {
      var currentTime = new Date().getTime();
      var isDoubleClick = currentTime - lastButtonUpTime < DOUBLE_CLICK_DELAY;
      var isHoldClick = currentTime - lastButtonDownTime > DOUBLE_CLICK_DELAY;
      lastButtonUpTime = currentTime;

      if (isDoubleClick) {
        clearTimeout(singleClickTimer);
        console.log("next");
        await axios.get( `${HOME_AUTOMATION_URL}/speaker/next`);
      } else if (isHoldClick) {
        clearTimeout(singleClickTimer);
        console.log("previous");
        await axios.get( `${HOME_AUTOMATION_URL}/speaker/previous`);
      } else {
        singleClickTimer = setTimeout(function () {
          console.log("play pause");
        await axios.get( `${HOME_AUTOMATION_URL}/speaker/play-pause`);
        }, DOUBLE_CLICK_DELAY + 10);
      }
    }
  });
  cc.on(
    "connectionStatusChanged",
    function (connectionStatus, disconnectReason) {
      console.log(
        bdAddr +
          " " +
          connectionStatus +
          (connectionStatus == "Disconnected" ? " " + disconnectReason : "")
      );
    }
  );
}

client.once("ready", function () {
  console.log("Connected to daemon!");
  client.getInfo(function (info) {
    info.bdAddrOfVerifiedButtons.forEach(function (bdAddr) {
      listenToButton(bdAddr);
    });
  });
});

client.on("bluetoothControllerStateChange", function (state) {
  console.log("Bluetooth controller state change: " + state);
});

client.on("newVerifiedButton", function (bdAddr) {
  console.log("A new button was added: " + bdAddr);
  listenToButton(bdAddr);
});

client.on("error", function (error) {
  console.log("Daemon connection error: " + error);
});

client.on("close", function (hadError) {
  console.log("Connection to daemon is now closed");
});
