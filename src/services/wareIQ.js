const axios = require("axios");
require("dotenv").config("../config/config.env");
const moment = require("moment");
module.exports.getWareIQOrders = async (ids) => {
  try {
    console.log("==================================================");
    console.log("ids", ids?.join(","));

    if (ids?.length) {
      let allData = [];
      const batchSize = 500;

      let totalPages = Math.ceil(ids.length / batchSize);

      for (let page = 1; page <= totalPages; page++) {
        let startIdx = (page - 1) * batchSize;
        let endIdx = startIdx + batchSize;
        let batchIds = ids.slice(startIdx, endIdx).join(",");

        let response = await axios.post(
          `${process.env.WAREIQ_URL}/orders/b2c/all`,
          {
            bulk_search: batchIds,
            per_page: batchSize,
            page: 1,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${process.env.WAREIQ_SECRET}`,
            },
          }
        );
        allData = allData.concat(response?.data?.data);
      }
      return allData;
    } else return [];
  } catch (error) {
    console.log("error", error);
    throw new Error(
      "Error getting wareIQ orders from Panel: " + error?.message
    );
  }
};
module.exports.getWareOrdersByDate = async (dateRange) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("==================================================");
      const to = moment(dateRange[1])?.endOf("day").toDate(),
        from = moment(dateRange[0])?.startOf("day").toDate();

      let page = 1,
        total = 1000,
        perPage = 500;
      let orders = [];

      console.log("start ", from, " end ", to);
      while (page <= total) {
        console.log("at while starts --> total ,page", total, page);
        let response = await axios.post(
          `${process.env.WAREIQ_URL}/orders/b2c/all`,
          {
            per_page: perPage,
            page,
            filters: {
              order_date: [from, to],
            },
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${process.env.WAREIQ_SECRET}`,
            },
          }
        );
        console.log("FILTER", {
          per_page: perPage,
          page: 1,
          filters: {
            order_date: [from, to],
          },
        });

        if (response?.status === 200) {
          let { data } = response.data;

          console.log("data?.length", data?.length);

          orders = [...orders, ...data];

          if (data?.length === 0) {
            page = total + 1;
            console.log("++ all data fetched: ", page);
            return resolve(orders);
          } else page++;
        } else {
          reject("Unexpected error code: " + response.status);
        }
      }
    } catch (error) {
      console.log("error", error);
      throw new Error(
        "Error getting wareIQ orders from Panel: " + error?.message
      );
    }
  });
};
