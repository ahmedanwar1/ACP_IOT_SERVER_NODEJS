// import { redisClient } from "../config/connections.js";
import { parkingSpaces } from "../src/app.js";
import ParkingSpaceModel from "../model/ParkingSpace.js";

const all_parking_spaces_get = async (req, res) => {
  try {
    // if (req.query.API_Key == "123456789") {
    // redisClient.get("parkingspaces", async (error, spaces) => {
    //   let results = null;
    //   if (error) {
    //     console.error(error);
    //   }
    //   if (spaces != null) {
    //     results = JSON.parse(spaces);
    //   } else {
    //     const data = await ParkingSpaceModel.find();
    //     if (data) {
    //       redisClient.setex("parkingspaces", 120000, JSON.stringify(data));
    //       results = data;
    //     }
    //   }
    const results = await ParkingSpaceModel.find();
    const mergedData = [];
    for (let i = 0; i < results.length; i++) {
      if (parkingSpaces[results[i]._id]) {
        mergedData.push({
          ...parkingSpaces[results[i]._id],
          coordinates: results[i].location.coordinates,
        });
        // mergedData.push({ ...parkingSpaces[results[i]._id], ...results[i] });
      }
    }

    res.json(
      mergedData.length > 0
        ? { data: mergedData }
        : { errorMsg: "No parking spaces!" }
    );
    // });
    // }
    // return res.json({ msg: "NOT AUTHORIZED!" });
  } catch (error) {
    console.log(error);
    res.json({ error });
  }
};

//incompleted... :'(
const parking_space_get_by_ID = (req, res) => {
  const _id = req.params.id;

  return res.json(
    parkingSpaces[_id] ? { ...parkingSpaces[_id] } : { msg: "No such space!" }
  );
};

const open_parking_barrier = (req, res) => {
  const id = req.params.id;
  mqttClient.publish("parking/openbarrier/" + id, "open");
  res.json({ id, status: "opened" });
};

//get spaces close to longitude & latitude
const parking_spaces_near_get = async (req, res) => {
  const longitude = req.query.longitude;
  const latitude = req.query.latitude;

  const results = await ParkingSpaceModel.find({
    location: {
      $near: {
        $maxDistance: 5000,
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
      },
    },
  });

  const mergedData = [];
  for (let i = 0; i < results.length; i++) {
    if (parkingSpaces[results[i]._id]) {
      mergedData.push({
        ...parkingSpaces[results[i]._id],
        coordinates: results[i].location.coordinates,
      });
    }
  }

  res.json(
    mergedData.length > 0
      ? { data: mergedData }
      : { errorMsg: "No parking spaces!" }
  );
};

export {
  all_parking_spaces_get,
  parking_space_get_by_ID,
  open_parking_barrier,
  parking_spaces_near_get,
};
