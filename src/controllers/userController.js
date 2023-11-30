const User = require("../models/User/user");
const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const bcrypt = require("bcryptjs");
//register
const createUser = async (req, res) => {
  // #swagger.tags = ['user']
  try {
    const { firstName, lastName, email, password, role, phoneNumber, type } =
      req.body;
    if (
      !password.match(
        /(?=[A-Za-z0-9@#$%^&+!=]+$)^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^&+!=])(?=.{8,}).*$/
      )
    ) {
      return ErrorHandler(
        "Password must contain atleast one uppercase letter, one special character and one number",
        400,
        req,
        res
      );
    }
    const user = await User.findOne({ email });
    if (user) {
      return ErrorHandler("User already exists", 400, req, res);
    }
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      role,
      type,
      createdBy: req.user._id,
    });
    newUser.save();
    return SuccessHandler("User created successfully", 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ type: "user" }, "-password").populate(
      "role"
    );
    if (users) {
      res.status(200).json(users);
    }
  } catch (err) {
    res.status(500).json({
      message: err.toString(),
    });
  }
};

const getUser = async (req, res) => {
  try {
    const _id = req.query.user;
    const user = await User.findOne({ _id: _id }, "-password").populate("role");
    if (user) {
      res.status(200).json(user);
    }
  } catch (err) {
    res.status(500).json({
      message: err.toString(),
    });
  }
};

const editUser = async (req, res) => {
  try {
    let { id } = req.body;

    let obj = {};
    if ("password" in req?.body) {
      const salt = await bcrypt.genSalt(10);
      let password = await bcrypt.hash(req?.body?.password, salt);
      obj.password = password;
    }
    User.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          ...req.body,
          ...obj,
        },
      },
      { new: true },
      (err, data) => {
        if (data) {
          res.status(200).json({
            message: "user updated scessfully",
          });
        } else {
          res.status(500).json({
            message: "not updated",
          });
        }
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const inactivateUser = async (req, res) => {
  try {
    User.findOne({ _id: req.query?.user }).then((user) => {
      user.isActive = false;
      user.save();
      res.status(200).json({
        message: "User status updated",
      });
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};
const activateUser = async (req, res) => {
  try {
    User.findOne({ _id: req.query?.user }).then((user) => {
      user.isActive = true;
      user.save();
      res.status(200).json({
        message: "User status updated",
      });
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

module.exports = {
  createUser,
  editUser,
  getAllUsers,
  getUser,
  inactivateUser,
  activateUser,
};
