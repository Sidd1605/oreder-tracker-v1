const jwt = require("jsonwebtoken");
const User = require("../models/User/user");
const dotenv = require("dotenv");

dotenv.config({ path: ".././src/config/config.env" });

const isAuthenticated = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (token?.split(" ")[0] === "tracker") {
      token = token?.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .json({ success: false, message: "Not logged in" });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded._id);
      next();
    } else
      return res
        .status(401)
        .json({ success: false, message: "Not a valid token" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = isAuthenticated;
