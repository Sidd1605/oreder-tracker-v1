const auth = require("./auth");
const role = require("./role");
const user = require("./users");
const order = require("./order");
const axios = require("axios");
const router = require("express").Router();

router.use("/auth", auth);
router.use("/role", role);
router.use("/user", user);
router.use("/order", order);
router.get("/ship", async (req, res) => {
  try {
    let response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: "dreamzhub1605@gmail.com", //"falakshair563@gmail.com",
        password: "Dreamz@123", // "Test@123",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("response", response?.data);

    res.status(200).json(response?.data);
  } catch (error) {
    res.status(500).json({
      message: error?.message,
    });
  }
});

module.exports = router;
