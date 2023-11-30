const axios = require("axios");
require("dotenv")?.config("./config/config.env");
const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

module.exports.httpsShip = (token) => {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};
