const app = require("./app");
const cron = require("node-cron");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const http = require("http");
const { updateOrders, freezeOrders } = require("./services/cronJob");

dotenv.config({ path: "./src/config/config.env" }); //load env vars

//server setup
const PORT = process.env.PORT || 8001;

var server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});

cron.schedule("0 * * * *", () => {
  console.log("Cron job is running every hour!");
  console.time("CronJob started");
  updateOrders();
  console.timeEnd("CronJob started");
});

// cron.schedule(
//   "0 21 * * *",// "0 21 * * *", // "*/1 * * * *",
//   () => {
//     freezeOrders();
//   },
//   {
//     scheduled: true,
//     timezone: "Asia/Kolkata", // Specify your timezone
//   }
// );
