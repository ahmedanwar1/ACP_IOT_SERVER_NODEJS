import bcrypt from "bcrypt";
import UserModel from "../model/User.js";

const register_user_post = async (req, res) => {
  const name = req.body.name;
  const registration_number = req.body.registration_number;
  const password = req.body.password;

  if (!name || !registration_number || !password) {
    return res.status(400).send("inserted data is not valid!");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let user = await UserModel.findOne({
    registration_number: registration_number,
  });
  if (user) {
    return res.status(400).send("That user already exisits!");
  } else {
    // Insert the new user if they do not exist yet
    user = new UserModel({
      name,
      registration_number,
      password: hashedPassword,
    });
    await user.save();
    res.send(user);
  }
};

const login_user_post = (req, res) => {};

export { register_user_post, login_user_post };
