const express = require("express");
const role = require("../controllers/roleController");
const isAuthenticated = require("../middleware/auth");
const router = express.Router();

//get
router.route("/getRoles").get(isAuthenticated, role.getRoles);
router
  .route("/getRolePermissions")
  .get(isAuthenticated, role.getRolePermissions);
//post
router.route("/updateRole").post(isAuthenticated, role.updateRole);
router.route("/createRole").post(isAuthenticated, role.createRole);

module.exports = router;
