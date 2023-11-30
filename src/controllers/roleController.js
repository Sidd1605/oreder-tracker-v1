const Role = require("../models/Role/role");
const User = require("../models/User/user");

const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
//register
const createRole = async (req, res) => {
  // #swagger.tags = ['role']
  try {
    const { name, permissions } = req.body;
    let createdBy = req.user._id;
    const role = await Role.findOne({ name: name?.toLowerCase() });
    if (role) {
      return ErrorHandler("Role already exists by this name", 400, req, res);
    }
    const newRole = await Role.create({
      name: name?.toLowerCase(),
      permissions,
      createdBy,
    });
    newRole.save();
    return SuccessHandler(
      {
        role: newRole,
        message: "Role created successfully",
      },
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

const getRoles = async (req, res) => {
  // #swagger.tags = ['role']
  try {
    let roles = await Role.find({});
    if (roles) return res.status(200).json(roles);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

const updateRole = async (req, res) => {
  // #swagger.tags = ['role']
  try {
    let { permissions, name, id } = req.body;
    let obj = { name };
    if (permissions) obj.permissions = permissions;

    let updated = await Role.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $set: obj,
      },

      { new: true }
    );

    res.status(200).json(updated);
  } catch (error) {
    console.log("error", error);
    return ErrorHandler(error.message, 500, req, res);
  }
};

const getRolePermissions = async (req, res) => {
  try {
    let user = await User.findById(req?.user?._id).populate(
      "role"
    );
    if (user?.status?.toLowerCase() === "inactive")
      return res.status(400).json({
        message:
          "Your account has been blocked Please contact the administrator",
      });
    return res.status(200).json(user?.role);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createRole,
  updateRole,
  getRolePermissions,
  getRoles,
};
