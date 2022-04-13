import * as dotenv from "dotenv";
dotenv.config();

import mqtt from "mqtt";
import mongoose from "mongoose";
import { createClient } from "redis";

//connect to the MONGODB
mongoose.connect(
  `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.hduzz.mongodb.net/${process.env.MONGODB_DB_NAME}?retryWrites=true&w=majority`
);
//connect to mqtt cloud.
const mqttClient = mqtt.connect({
  host: process.env.MQTT_URL,
  port: process.env.MQTT_PORT,
  protocol: process.env.MQTT_PROTOCOL,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  protocolVersion: 5,
  properties: {
    requestResponseInformation: true,
    requestProblemInformation: true,
  },
});

// connect to redis
const redisClient = createClient(6379);

redisClient.connect();

redisClient.on("error", (err) => console.log("Redis Client Error", err));

export { mqttClient, redisClient };
