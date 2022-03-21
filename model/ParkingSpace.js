import mongoose from "mongoose";

const parkingSpaceSchema = new mongoose.Schema({
  longitude: {
    type: Number,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
});

export default mongoose.model("ParkingSpace", parkingSpaceSchema);
