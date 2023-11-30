const Order = require("../models/Orders/order");
const OrderCopy = require("../models/Orders/orderCopy");
const moment = require("moment");
const { getShipOrders } = require("./shipRocket");
const { getWareIQOrders, getWareOrdersByDate } = require("./wareIQ");
const separateOrdersByCourier = (orders) => {
  const ware = [],
    ship = [],
    wareIds = [],
    shipIds = [],
    dates = [],
    wareRisky = [],
    wareAbandoned = [],
    shipRisky = [],
    shipAbandoned = [];

  orders?.forEach((element) => {
    if (element?.courier?.toLowerCase() === "wareiq") {
      if (
        element?.callType !== "abandoned" &&
        element?.callType !== "riskyAbandoned"
      ) {
        wareIds.push(element?.orderId);
        ware?.push(element);
        let date = new Date(element?.shipRocketCreatedAt);
        if (!isNaN(date.getTime())) dates.push(date);
      }
      if (element?.callType?.toLowerCase() === "abandoned")
        wareAbandoned.push(element);
      if (element?.callType?.toLowerCase() === "riskyAbandoned")
        wareRisky.push(element);
    } else {
      if (
        element?.callType !== "abandoned" &&
        element?.callType !== "riskyAbandoned"
      ) {
        ship.push(element);
        shipIds.push(element?.orderId);
        let date = new Date(element?.shipRocketCreatedAt);
        if (!isNaN(date.getTime())) dates.push(date);
      }
      if (element?.callType?.toLowerCase() === "abandoned")
        shipAbandoned.push(element);
      if (element?.callType?.toLowerCase() === "riskyAbandoned")
        shipRisky.push(element);
    }
  });

  console.log("dates", dates);
  const max = Math.max(...dates),
    min = Math.min(...dates);

  console.log("min, max", min, max);

  return {
    ship,
    ware,
    wareIds,
    shipIds,
    max,
    min,
    shipRisky,
    shipAbandoned,
    wareRisky,
    wareAbandoned,
  };
};

const getFoundOrders = (databaseOrders, orders, courier) => {
  let phoneNumbersWare = [],
    phoneNumbersShip = [],
    ordersFoundWare = [],
    ordersFoundShip = [];

  const last8Digits = [],
    last8DigitsShip = [];

  if (courier === "ware") {
    databaseOrders?.forEach((order) => {
      phoneNumbersWare.push(order?.billingPhone);
      last8Digits.push(order?.billingPhone?.slice(-8));
    });

    console.time(`Filtering on ${orders?.length}`);

    // ordersFoundWare = orders?.filter((value) => {
    //   return last6Digitis.includes(value?.customer_details?.phone?.slice(-6));
    // });
    ordersFoundWare = ordersFoundWare?.filter((value) => {
      return last8Digits.includes(value?.customer_details?.phone?.slice(-8));
    });

    console.timeEnd(`Filtering on ${orders?.length}`);

    console.log("phoneNumbersWare", phoneNumbersWare);
    // return res
    //   .status(200)
    //   .json(orders?.map((value) => value?.customer_details?.phone));
    console.log(
      "from ware --> ",
      orders?.map((value) => value?.customer_details?.phone)
    );
    ordersFoundWare = ordersFoundWare?.map((value) => {
      return {
        orderId: value?.order_id,
        status: value?.status,
        billingPhone: value?.customer_details?.phone,
        customerName: value?.customer_details?.name,
        shipRocketCreatedAt: value?.order_date,
      };
    });
  } else {
    databaseOrders?.forEach((order) => {
      phoneNumbersShip.push(order?.billingPhone);
      last8DigitsShip.push(order?.billingPhone?.slice(-8));
    });
    ordersFoundShip = orders?.filter((value) =>
      last8DigitsShip.includes(value?.customer_phone?.slice(-8))
    );
    ordersFoundShip = ordersFoundShip?.map((value) => {
      return {
        orderId: value?.channel_order_id,
        status: value?.status,
        billingPhone: value?.customer_phone,
        customerName: value?.customer_name,
        shipRocketCreatedAt: value?.channel_created_at,
      };
    });
  }

  return [...ordersFoundShip, ...ordersFoundWare];
};

module.exports.updateOrders = async () => {
  console.time("Filtering Orders");
  const orders = await Order.find({
    status: {
      $nin: ["rto", "rto delivered"],
    },
  });
  console.log("orders filtered: ", orders?.length);
  console.timeEnd("Filtering Orders");
  let {
    shipIds,
    wareIds,
    max,
    min,
    shipAbandoned,
    shipRisky,
    wareAbandoned,
    wareRisky,
  } = separateOrdersByCourier(orders);

  console.log("wareAbandoned", wareAbandoned?.length);
  console.log("wareRisky", wareRisky?.length);

  let wareOrders = await getWareIQOrders(wareIds);
  let minDate = moment().subtract(45, "days").startOf("day")?.toDate(),
    maxDate = moment().endOf("day")?.toDate();
  console.log("Last 45 date:", minDate, maxDate);
  let shipOrders = await getShipOrders([minDate, maxDate], shipIds);

  let shipTodaysOrder = await getShipOrders([new Date(), new Date()]);
  let wareTodaysOrder = await getWareOrdersByDate([new Date(), new Date()]);

  /*
  getFoundOrders(
    [...shipAbandoned, ...shipRisky],
    shipTodaysOrder,
    "ship"
  );
  */
  let wareFound = getFoundOrders(
    [...wareAbandoned, ...wareRisky],
    wareTodaysOrder,
    "ware"
  );
  let shipFound = getFoundOrders(
    [...shipAbandoned, ...shipRisky],
    shipTodaysOrder,
    "ship"
  );
  console.log("wareFound", wareFound);
  const allOrders = [
    ...wareOrders?.map((value) => ({
      orderId: value?.order_id,
      status: value?.status,
      courier: "ware iq",
    })),
    ...shipOrders?.map((value) => ({
      orderId: value?.channel_order_id,
      status: value?.status,
      courier: "shipRocket",
    })),
  ];

  const abandonedAndRisky = [...shipFound, ...wareFound];

  console.log(
    "orders to be updated: ",
    allOrders?.length + abandonedAndRisky?.length
  );

  let bulkUpdateAbandonedAndRisky = abandonedAndRisky?.map(
    ({ billingPhone, ...rest }) => ({
      updateOne: {
        filter: { billingPhone },
        update: { $set: { ...rest } },
      },
    })
  );

  let bulkUpdateOps = allOrders?.map((order) => ({
    updateOne: {
      filter: { orderId: order?.orderId },
      update: { $set: { status: order?.status } },
    },
  }));

  console.time("Bulk Update Started");
  const result = await Order.bulkWrite(bulkUpdateOps);

  // copy orders to other collection
  const currentHour = new Date().getHours();
  if (currentHour < 22) {
    console.log(`******* Copying orders at 12 - ${currentHour} ******* `);
    let todays = await Order.find({
      createdAt: {
        $gte: moment().startOf("day")?.toDate(),
        $lte: moment().endOf("day")?.toDate(),
      },
    }).select("orderId");

    let todaysIds = todays?.map((e) => e?.orderId);
    let todaysOrders = allOrders?.filter((v) => todaysIds.includes(v?.orderId));

    let bulkUpdate = todaysOrders?.map((order) => ({
      updateOne: {
        filter: { orderId: order?.orderId },
        update: { $set: { status: order?.status } },
      },
    }));

    let todaysRisky = abandonedAndRisky?.filter((v) =>
      todaysIds?.includes(v?.orderId)
    );

    let bulkUpdateAbandonedAndRisky = todaysRisky?.map(
      ({ billingPhone, ...rest }) => ({
        updateOne: {
          filter: { billingPhone },
          update: { $set: { ...rest } },
        },
      })
    );

    // Save the updated data to the frozen collection
    await OrderCopy.bulkWrite(bulkUpdate);
    await OrderCopy.bulkWrite(bulkUpdateAbandonedAndRisky);
  }

  const abandonedUpdated = await Order.bulkWrite(bulkUpdateAbandonedAndRisky);
  console.log(`Orders updated successfully: `, result);
  console.log(
    `Abandoned and risky orders updated successfully: `,
    abandonedUpdated
  );
  if (result && abandonedAndRisky) console.timeEnd("Bulk Update Started");
};

module.exports.freezeOrders = async () => {
  try {
    let startDate = moment().startOf("day").toDate(),
      endDate = moment().endOf("day").toDate();

    const dailyRecords = await Order.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    })?.lean();

    await OrderCopy.insertMany(dailyRecords);

    console.log("Orders copied successfully", dailyRecords?.length);
  } catch (error) {
    console.log("error creating copy: ", error);
  }
};
