import mongoose from "mongoose";

const parkingSpaceSchema = new mongoose.Schema({
  location: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ["Point"], // 'location.type' must be 'Point'
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
});

parkingSpaceSchema.index({ location: "2dsphere" });

export default mongoose.model("ParkingSpace", parkingSpaceSchema);
