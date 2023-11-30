const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const roleSchema = new Schema(
  {
    name: String,
    permissions: {},
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
  }
);

const role = mongoose.model("role", roleSchema);

module.exports = role;
