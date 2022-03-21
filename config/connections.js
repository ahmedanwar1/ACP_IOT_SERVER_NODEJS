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
const mqttClient = mqtt.connect(
  `mqtt://${process.env.MQTT_INSTANCE}:${process.env.MQTT_SECRET}@${process.env.MQTT_URL}`,
  {
    clientId: "NODE JS SERVER",
  }
);

//connect to redis
const redisClient = createClient(6379);

export { mqttClient, redisClient };
