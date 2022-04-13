// import { redisClient } from "../config/connections.js";
import ParkingSpaceModel from "../model/ParkingSpace.js";
import { mqttClient, redisClient } from "../config/connections.js";
import { eventEmitter } from "../app.js";

const all_parking_spaces_get = async (req, res) => {
  try {
    const results = await ParkingSpaceModel.find();
    const mergedData = [];
    for (let i = 0; i < results.length; i++) {
      let value = await redisClient.get(results[i]._id);
      if (value) {
        value = JSON.parse(value);
        // console.log(value);
        mergedData.push({
          ...value,
          coordinates: results[i].location.coordinates,
        });
        // mergedData.push({ ...parkingSpaces[results[i]._id], ...results[i] });
      }
    }

    mergedData.length > 0
      ? res.status(201).json({ data: mergedData })
      : res.status(404).json({ errorMsg: "No parking spaces!" });
    // });
    // }
    // return res.json({ msg: "NOT AUTHORIZED!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
};

//incompleted... :'(
const parking_space_get_by_ID = async (req, res) => {
  const _id = req.params.id;
  const space = await ParkingSpaceModel.find({ _id: _id });
  console.log(...space);
  // return res.json(
  //   parkingSpaces[_id] ? { ...parkingSpaces[_id] } : { msg: "No such space!" }
  if (space) {
    return res.json(...space);
  }
  return res.status(404).json({ msg: "No such space!" });
};

const open_parking_barrier = (req, res) => {
  const id = req.params.id;
  // mqttClient.publish("parking/openbarrier/" + id, "open");
  // res.json({ id, status: "opened" });
  /***************/
  const checkTimeOut = setTimeout(() => {
    eventEmitter.emit("responseEvent/openbarrier/" + id, {
      error: true,
      message: "timeOut",
    });
  }, 5000);

  eventEmitter.once("responseEvent/openbarrier/" + id, (responseMessage) => {
    clearTimeout(checkTimeOut);
    res.json({ responseMessage });
  });

  mqttClient.publish(
    "request/openbarrier/" + id,
    // JSON.stringify({ action: "open" }),
    "open",
    {
      qos: 1,
      properties: {
        responseTopic: "response/openbarrier/" + id,
        // correlationData: Buffer.from("secret_" + id, "utf-8"),
      },
    }
  );
};

//get spaces close to longitude & latitude
const parking_spaces_near_get = async (req, res) => {
  const longitude = req.query.longitude;
  const latitude = req.query.latitude;

  //request near parking spaces from db based on location
  const results = await ParkingSpaceModel.find({
    location: {
      $near: {
        $maxDistance: 5000, //max distance to user's location
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
      },
    },
  });

  //merge current available spaces with the near spaces
  const mergedData = [];
  for (let i = 0; i < results.length; i++) {
    let value = await redisClient.get(results[i]._id);
    if (value) {
      value = JSON.parse(value);
      console.log(value);
      mergedData.push({
        ...value,
        coordinates: results[i].location.coordinates,
      });
    }
  }

  mergedData.length > 0
    ? res.status(201).json({ data: mergedData })
    : res.status(404).json({ errorMsg: "No parking spaces!" });
};

export {
  all_parking_spaces_get,
  parking_space_get_by_ID,
  open_parking_barrier,
  parking_spaces_near_get,
};
