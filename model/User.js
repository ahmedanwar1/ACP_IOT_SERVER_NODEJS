import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  registration_number: {
    type: String,
    required: true,
    unique: true,
  },
});

export default mongoose.model("User", userSchema);
