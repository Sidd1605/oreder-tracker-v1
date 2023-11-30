const express = require("express");
const order = require("../controllers/orderController");
const isAuthenticated = require("../middleware/auth");
const router = express.Router();

//get
router.route("/getOrdersCounts").get(isAuthenticated, order.getOrdersCounts);

//post
router.route("/getOrders").post(isAuthenticated, order.getOrders);
router.route("/addOrders").post(isAuthenticated, order.addOrders);
router
  .route("/getOverallPerformance")
  .post(isAuthenticated, order.getOverallPerformance);
router.route("/getStage1").post(isAuthenticated, order.getStage1);
router.route("/getNDROrders").post(isAuthenticated, order.getNDROrders);
router
  .route("/getTotals")
  .post(isAuthenticated, order.getTotalCallsByDateRangeAndUsers);
router.route("/getOrdersByUId").post(isAuthenticated, order.getOrdersByUId);
router.route("/deleteOrders").delete(isAuthenticated, order.deleteOrders);
router.route("/updateFetch").post(order.addFetchStatus);
router.route("/fetchStatus").get(order.fetchStatus);
router.route("/bulkDeleteOrders").post(order.bulkDeleteOrders);

module.exports = router;
