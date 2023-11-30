require("dotenv").config("../config/config.env");
const moment = require("moment");
const { httpsShip } = require("../httpShip");
const axios = require("axios");
module.exports.getShipOrdersByIds = async (ids) => {
  return new Promise(async (resolve, reject) => {
    try {
      let promises = [];

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

      let token = response?.data?.token;
      console.log("====================== SHIP ==========================");
      console.log("ids", ids);
      ids?.forEach((element) => {
        promises.push(
          httpsShip(token).get(
            `/orders?filter_by=channel_order_id&filter=${element}`
          )
        );
      });

      Promise.all(promises)
        .then((response) => {
          let orders = response?.map((value) => ({
            channel_order_id: value?.data?.data?.[0]?.channel_order_id,
            status: value?.data?.data?.[0]?.status,
          }));
          resolve(orders);
        })
        .catch((error) => {
          reject(error);
        });
    } catch (error) {
      reject("Error getting wareIQ orders from Panel: " + error?.message);
    }
  });
};

module.exports.getShipOrders = async (dateRange, orderIds) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (orderIds?.length) {
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

        let token = response?.data?.token;
        console.log("==================================================");
        let page = 1,
          total = 1,
          perPage = 500;
        let orders = [];
        const to = moment(dateRange[1]).format("YYYY-MM-DD"),
          from = moment(dateRange[0]).format("YYYY-MM-DD");
        console.log("start ", from, " end ", to);
        while (page <= total) {
          console.log("at while starts --> total ,page", total, page);
          let response = await httpsShip(token).get(
            `/orders?to=${to}&from=${from}&per_page=${perPage}&page=${page}`
          );
          console.log(
            `/orders?to=${to}&from=${from}&per_page=${perPage}&page=${page}`
          );

          if (response?.status === 200) {
            let { data, meta } = response.data;

            orders = [...orders, ...data];
            total = meta?.pagination?.total_pages;
            console.log("total pages from meta", total);
            if (page === total) {
              console.log("++ inside if page,total", page, total);

              if (orderIds?.length) {
                console.log("order ids from system (SHIP) ->", orderIds);
                console.log(
                  "CHANNEL ORDER IDS (SHIP) from API--> ",
                  orders?.map((value) => value?.channel_order_id)
                );
                let shipOrders = orders?.filter((value) =>
                  orderIds?.includes(value?.channel_order_id)
                );

                console.log(
                  "FILTERED SHIP --> ",
                  shipOrders?.map((value) => value?.channel_order_id)
                );

                return resolve(shipOrders);
              }
              return resolve(orders);
            }
            page++;
          } else {
            reject("Unexpected error code: " + response.status);
          }
        }
      } else {
        return resolve([]);
      }
    } catch (error) {
      console.log("error", error);
      reject("Error getting ShipRocker orders from Panel: " + error?.message);
    }
  });
};
