//to use env variables
import * as dotenv from "dotenv";
dotenv.config();

import { mqttClient, redisClient } from "./config/connections.js";
import express from "express";
import parkingSpacesRoutes from "./routes/parkingSpacesRoutes.js";
import usersRouter from "./routes/usersRouter.js";
import EventEmitter from "events";
import cors from "cors";
import https from "https";
import fs from "fs";
import path from "path";

const app = express();

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  console.log("testttstst");
  next();
});

//when connecting to mqtt protocol
mqttClient.on("connect", () => {
  console.log("connected to mqtt!");

  mqttClient.subscribe("parking/space/#");
  mqttClient.subscribe("response/+/+");

  // mqttClient.publish(
  //   "parking/space/6230e4050551177b1192d7cd",
  //   '{"_id": "6230e4050551177b1192d7cd", "vacant": false, "barrierIsOpened": true ,"time":' +
  //     new Date().getTime() +
  //     "}"
  // );

  // setInterval(() => {
  //   mqttClient.publish(
  //     "parking/space/6230e4050551177b1192d7cd",
  //     '{"_id": "6230e4050551177b1192d7cd", "vacant": false, "barrierIsOpened": true ,"time":' +
  //       new Date().getTime() +
  //       "}"
  //   );
  // }, 40000);
});

export const eventEmitter = new EventEmitter();

//when receiving massages from broker (mqtt)
mqttClient.on("message", (topic, message) => {
  let incomingSpace = JSON.parse(message.toString());

  const topicArr = topic.split("/"); //spliting the topic ==> [response,action,_id]
  if (topicArr[0] == "response") {
    const eventName = `responseEvent/${topicArr[1]}/${topicArr[2]}`;
    const eventData = JSON.parse(message.toString());
    return eventEmitter.emit(eventName, eventData);
  } else if (topicArr[0] == "parking" && topicArr[1] == "space") {
    //if incoming space arrives
    if (incomingSpace) {
      redisClient.set(incomingSpace._id, JSON.stringify(incomingSpace), {
        EX: 60,
      });
      console.log(incomingSpace);
      // console.log(message.toString());
      console.log("*********");
    }
  }
});

app.use(parkingSpacesRoutes);
app.use(usersRouter);

const __dirname = path.resolve();

app.listen(process.env.PORT || 4000);
// const sslServer = https.createServer(
//   {
//     key: fs.readFileSync(path.join(__dirname, "cert", "key.pem")),
//     cert: fs.readFileSync(path.join(__dirname, "cert", "cert.pem")),
//   },
//   app
// );

// sslServer.listen(4000);
