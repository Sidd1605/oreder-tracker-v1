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
    awbNumber:String,
    billingPhone: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    ndrFunnel: {
      type: Boolean,
      default: false,
    },
    uId: String,
  },
  {
    timestamps: true,
  }
);

const order = mongoose.model("order", orderSchema);

module.exports = order;
