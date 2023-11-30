const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const fetchSchema = new Schema(
  {
    status: String,
    error: String,
    success: String,
  },
  {
    timestamps: true,
  }
);

const fetchModel = mongoose.model("fetch", fetchSchema);

module.exports = fetchModel;
