//to use env variables
import * as dotenv from "dotenv";
dotenv.config();

import {
  mqttClient,
  //  redisClient
} from "./config/connections.js";
import express from "express";
import parkingSpacesRoutes from "./routes/parkingSpacesRoutes.js";

const app = express();

app.use(express.json());

// //redis connection triggers
// redisClient.on("connect", () => console.log("Redis Client connected"));
// redisClient.on("error", (err) => console.log("Redis Client Error", err));

//current available parking spaces
const parkingSpaces = {};

//delete old parking spaces based on date
setInterval(() => {
  for (const _id in parkingSpaces) {
    if (new Date().getTime() - parkingSpaces[_id].date > 50000) {
      // console.log(`${_id}: ${parkingSpaces[_id]}`);
      delete parkingSpaces[_id];
    }
  }
}, 60000);

//when connecting to mqtt protocol
mqttClient.on("connect", function () {
  console.log("connected to mqtt!");

  mqttClient.subscribe("parking/space/#");

  setInterval(() => {
    mqttClient.publish(
      "parking/space/6230e4050551177b1192d7cd",
      '{"_id": "6230e4050551177b1192d7cd", "vacant": false, "barrierIsOpened": true}'
    );
  }, 5000);
});

//when receiving massages from broker (mqtt)
mqttClient.on("message", function (topic, message) {
  let incomingSpace = JSON.parse(message.toString());

  //if incoming space arrives
  if (incomingSpace) {
    //add/update the incoming space status
    parkingSpaces[incomingSpace._id] = {
      _id: incomingSpace._id,
      vacant: incomingSpace.vacant,
      barrierIsOpened: incomingSpace.barrierIsOpened,
      date: new Date().getTime(),
    };

    console.log(parkingSpaces);
    // console.log(message.toString());
    console.log("*********");
  }
});

app.use(parkingSpacesRoutes);

app.listen(3000);

export { parkingSpaces };
