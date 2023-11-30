const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const orderSchema = new Schema(
  {
    orderId: String,
    forwardId: String,
    status: String,
    productName: String,
    shipRocketCreatedAt: Date,
    customerName: String,
    customerMobile: String,
    addressPINCode: String,
    courier: String,
    callType: String,
    billingPhone: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    ndrFunnel: Boolean,
    uId: String,
  },
  {
    timestamps: true,
  }
);

const orderCopy = mongoose.model("orderCopy", orderSchema);

module.exports = orderCopy;
