const express = require("express");
const user = require("../controllers/userController");
const isAuthenticated = require("../middleware/auth");
const router = express.Router();

//get
router.route("/getAllUsers").get(isAuthenticated, user.getAllUsers);
router.route("/getUser").get(isAuthenticated, user.getUser);
router.route("/activateUser").get(isAuthenticated, user.activateUser);
router.route("/inActivateUser").get(isAuthenticated, user.inactivateUser);

//post

router.route("/createUser").post(isAuthenticated, user.createUser);
router.route("/updateUser").post(isAuthenticated, user.editUser);

module.exports = router;
