require("dotenv").config("../config/config.env");
const moment = require("moment");
const Order = require("../models/Orders/order");
const Fetch = require("../models/Orders/fetching");
const OrderCopy = require("../models/Orders/orderCopy");
const ErrorHandler = require("../utils/ErrorHandler");

const addOrders = async (req, res) => {
  try {
    let { orders } = req.body;
    let createdBy = req.user?._id;
    orders = orders?.map((order) => ({ ...order, createdBy }));
    let newOrders = await Order.insertMany(orders);
    let newOrders2 = await OrderCopy.insertMany(orders);
    if (newOrders && newOrders2) {
      return res.status(200).json(newOrders);
    }
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

const getOrders = async (req, res) => {
  try {
    let { start, end, page, perPage } = req.body;
    console.log("start,end", start, end);
    let user = req.user,
      obj;

    if (user?.type?.toLowerCase() === "user")
      obj = {
        createdBy: user?._id,
      };
    let startDate = moment(start).startOf("day")?.toDate();
    let endDate = moment(end).endOf("day")?.toDate();

    console.log("startDate, endDate", startDate, endDate);
    if (start && end)
      obj = {
        ...obj,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    let count = await Order.count(obj);

    let allOrders = await Order.aggregate([
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $match: {
          ...obj,
          ndrFunnel: false,
        },
      },

      {
        $skip: (page - 1) * perPage,
      },
      {
        $limit: perPage,
      },
    ]);

    res.status(200).json({
      data: allOrders,
      meta: {
        total: count,
        perPage,
        page,
      },
    });
    // if (allOrders) {
    //   // let shiprocketOrders = [],
    //   //   wareIQOrders = [];
    //   // let dates = allOrders?.map((order) => {
    //   //   if (order?.courier?.toLowerCase() === "wareiq") {
    //   //     wareIQOrders.push(order);
    //   //   } else {
    //   //     shiprocketOrders.push(order);
    //   //   }
    //   //   return order?.shipRocketCreatedAt;
    //   // });
    //   // dates = dates?.filter((value) => {
    //   //   return Object.prototype.toString.call(value) === "[object Date]"
    //   //     ? true
    //   //     : false;
    //   // });
    //   // const to = new Date(Math.max(...dates)),
    //   //   from = new Date(Math.min(...dates));
    //   // to.setHours(23, 59, 59, 999);
    //   // from.setHours(0, 0, 0, 0);
    //   // let wareIQids = wareIQOrders?.map((value) => value?.orderId);
    //   // let shipIds = shiprocketOrders?.map((value) => value?.orderId);
    //   // console.log(
    //   //   "wareIQ from database",
    //   //   wareIQOrders?.map((value) => ({
    //   //     orderId: value?.orderId,
    //   //     status: value?.status,
    //   //   }))
    //   // );
    //   // console.log(
    //   //   "Ship from database",
    //   //   shiprocketOrders?.map((value) => ({
    //   //     orderId: value?.orderId,
    //   //     status: value?.status,
    //   //   }))
    //   // );
    //   // if (wareIQids?.length) {
    //   //   let wareOrders = await getWareIQOrders(wareIQids);
    //   //   let updatedStatusesWareIQ = {};
    //   //   wareOrders?.forEach((value) => {
    //   //     updatedStatusesWareIQ[value?.order_id] = value?.status;
    //   //   });
    //   //   console.log("updatedStatusesWareIQ", updatedStatusesWareIQ);
    //   //   wareIQOrders = wareIQOrders?.map((order) => {
    //   //     let changed = updatedStatusesWareIQ[order?.orderId]
    //   //       ? updatedStatusesWareIQ[order?.orderId]?.toLowerCase() ===
    //   //         order?.status?.toLowerCase()
    //   //       : false;
    //   //     return {
    //   //       ...order,
    //   //       status: updatedStatusesWareIQ[order?.orderId] || order?.status,
    //   //       changed: !changed
    //   //         ? `${order?.status} -> ${updatedStatusesWareIQ[order?.orderId]}`
    //   //         : undefined,
    //   //     };
    //   //   });
    //   // }
    //   // if (shipIds?.length) {
    //   //   let shipOrders = await getShipOrdersByIds(shipIds);
    //   //   let updatedStatusesShip = {};
    //   //   shipOrders?.forEach((value) => {
    //   //     updatedStatusesShip[value?.channel_order_id] = value?.status;
    //   //   });
    //   //   console.log("updatedStatusesShip", updatedStatusesShip);
    //   //   shiprocketOrders = shiprocketOrders?.map((order) => {
    //   //     let changed = updatedStatusesShip[order?.orderId]
    //   //       ? updatedStatusesShip[order?.orderId]?.toLowerCase() ===
    //   //         order?.status?.toLowerCase()
    //   //       : false;
    //   //     return {
    //   //       ...order,
    //   //       status: updatedStatusesShip[order?.orderId] || order?.status,
    //   //       changed: !changed
    //   //         ? `${order?.status} -> ${updatedStatusesShip[order?.orderId]}`
    //   //         : undefined,
    //   //     };
    //   //   });
    //   // }
    //   // allOrders = [...shiprocketOrders, ...wareIQOrders];
    //   // console.log("================================================================")
    //   // console.log("shipOrders", shipOrders);
    // }
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

const getOrdersStatusByEmployees = async (req, res) => {
  try {
    let { start, end } = req.body;
    let obj = {};
    let startDate = new Date(start);
    let endDate = new Date(end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (start && end)
      obj = {
        ...obj,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };

    const ordersByEmployees = await Order.aggregate([
      {
        $group: {
          _id: "$createdBy",
          orders: { $push: "$$ROOT" },
        },
      },
    ]);

    res.status(200).json(ordersByEmployees);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// for both admin and employee
const getOrdersCounts = async (req, res) => {
  try {
    let { type, _id } = req?.user;
    if (type === "user") {
      let todayStart = moment().startOf("day"),
        todayEnd = moment().endOf("day");

      let previousDayStart = moment().subtract(1, "days").startOf("day"),
        previousDayEnd = moment().subtract(1, "days").endOf("day");

      let weekDayStart = moment().subtract(6, "days").startOf("day");
      let monthStart = moment().startOf("month").startOf("day");

      // let month = new Date();
      // month.setDate(1);
      // month.setHours(0, 0, 0, 0);

      let todaysOrders = await Order.count({
        createdAt: { $gte: todayStart, $lte: todayEnd },
        createdBy: _id,
      });

      let lastDayOrders = await Order.count({
        createdAt: { $gte: previousDayStart, $lte: previousDayEnd },
        createdBy: _id,
      });

      let weekOrders = await Order.count({
        createdBy: _id,
        createdAt: {
          $gte: weekDayStart,
          $lte: todayEnd,
        },
      });
      let monthOrders = await Order.count({
        createdBy: _id,
        createdAt: {
          $gte: monthStart,
          $lte: todayEnd,
        },
      });

      res.status(200).json({
        todaysOrders,
        lastDayOrders,
        weekOrders,
        monthOrders,
      });
    } else {
      let todayStart = moment().startOf("day"),
        todayEnd = moment().endOf("day");

      let previousDayStart = moment().subtract(1, "days").startOf("day"),
        previousDayEnd = moment().subtract(1, "days").endOf("day");

      let weekDayStart = moment().subtract(6, "days").startOf("day");
      let monthStart = moment().startOf("month").startOf("day");

      let todaysOrders = await Order.count({
        createdAt: { $gte: todayStart, $lte: todayEnd },
      });

      let lastDayOrders = await Order.count({
        createdAt: { $gte: previousDayStart, $lte: previousDayEnd },
      });

      let weekOrders = await Order.count({
        createdAt: {
          $gte: weekDayStart,
          $lte: todayEnd,
        },
      });
      let monthOrders = await Order.count({
        createdAt: {
          $gte: monthStart,
          $lte: todayEnd,
        },
      });

      res.status(200).json({
        todaysOrders,
        lastDayOrders,
        weekOrders,
        monthOrders,
      });
    }
  } catch (error) {
    throw new Error(error);
  }
};

// for admin
const separateOrderByTypes = (orders) => {
  const types = {};
  orders?.forEach((order) => {
    types[order?.callType] = [...(types[order?.callType] || []), order];
  });

  const returnObject = {};

  for (var key in types) {
    // add if for three (riskyAbandoned, abandoned & whatsapp) calls.
    // if key is equal to any don't perform this separation for OrderByStatus.
    if (key?.toLowerCase() === "pending") {
      returnObject[key] = separateOrderByStatus(types[key]);
      console.log("UNIQUE STATUSES:", separateOrderByStatus(types[key])?.obj);
    } else if (key?.toLowerCase() === "engage") {
      returnObject[key] = separateOrderByStatus(types[key]);
      console.log(
        "UNIQUE STATUSES: engage",
        separateOrderByStatus(types[key])?.obj
      );
    } else returnObject[key] = types[key];
  }

  return returnObject;
};

const separateOrderByStatus = (response) => {
  const confirmed = [],
    cancelled = [],
    delivered = [],
    notConnected = [],
    total = response?.length;
  let obj = {};
  response?.forEach((order) => {
    let status = order?.status?.toLowerCase();
    obj[status] = "";
    if (
      status?.includes("confirmed") ||
      status?.includes("ready to ship") ||
      status?.includes("picked up") ||
      status?.includes("in transit") ||
      status?.includes("pickup scheduled") ||
      status?.includes("pickup queued") ||
      status?.includes("pickup rescheduled") ||
      status?.includes("pickup error") ||
      status?.includes("out for pickup") ||
      status?.includes("pickup requested") ||
      status?.includes("pickup exception")
    )
      confirmed.push(order);
    if (
      status?.includes("canceled") ||
      status?.includes("cancellation requested") ||
      status?.includes("canceled reason") ||
      status?.includes("canceled reason: none") ||
      status?.includes("canceled reason: other") ||
      status?.includes("canceled reason: customer cancelled the order")
    )
      cancelled.push(order);
    if (status?.includes("delivered")) delivered.push(order);
    if (status?.includes("new")) notConnected.push(order);
  });

  return {
    obj,
    confirmed,
    cancelled,
    delivered,
    notConnected,
    total,
  };
};

const getOverallPerformance = async (req, res) => {
  try {
    let { start: startDate, end: endDate } = req.body;
    console.log("startDate,endDate", startDate, endDate);
    const start = moment(startDate).startOf("day")?.toDate(),
      end = moment(endDate).endOf("day").toDate();
    console.time("1");
    const ordersByEmployees = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          ndrFunnel: false,
        },
      },
      {
        $group: {
          _id: "$createdBy",
          orders: {
            $push: {
              orderId: "$orderId",
              status: "$status",
              createdBy: "$createdBy",
              callType: "$callType",
            },
          },
        },
      },
      {
        $lookup: {
          from: "users", // Replace with the actual name of the users collection
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
    ]);

    console.log("ordersByEmployees?.length", ordersByEmployees?.length);
    console.time("2");
    const orders = ordersByEmployees?.map((order) => ({
      ...order,
      orders: separateOrderByTypes(order?.orders),
    }));
    console.timeEnd("2");
    if (ordersByEmployees) console.timeEnd("1");
    res.json(orders);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: error });
  }
};

const getStage1 = async (req, res) => {
  try {
    let { start: startDate, end: endDate } = req.body;
    console.log("startDate,endDate", startDate, endDate);
    const start = moment(startDate).startOf("day")?.toDate(),
      end = moment(endDate).endOf("day").toDate();
    console.time("1");
    const ordersByEmployees = await OrderCopy.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$createdBy",
          orders: {
            $push: {
              orderId: "$orderId",
              status: "$status",
              createdBy: "$createdBy",
              callType: "$callType",
            },
          },
        },
      },
      {
        $lookup: {
          from: "users", // Replace with the actual name of the users collection
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
    ]);

    console.log("ordersByEmployees?.length", ordersByEmployees?.length);
    console.time("2");
    const orders = ordersByEmployees?.map((order) => ({
      ...order,
      orders: separateOrderByTypes(order?.orders),
    }));
    console.timeEnd("2");
    if (ordersByEmployees) console.timeEnd("1");
    res.json(orders);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: error });
  }
};

const getTotalCallsByDateRangeAndUsers = async (req, res) => {
  try {
    let { start: startDate, end: endDate } = req.body;
    console.log("startDate,endDate", startDate, endDate);
    const start = moment(startDate).startOf("day")?.toDate(),
      end = moment(endDate).endOf("day").toDate();
    console.time("1");
    const ordersCountsByEmployees = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          ndrFunnel: false,
        },
      },
      {
        $group: {
          _id: "$createdBy",
          orderCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users", // Replace with the actual name of the users collection
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
    ]);
    res.status(200).json(ordersCountsByEmployees);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: error });
  }
};

const getNDROrders = async (req, res) => {
  try {
    let { start: startDate, end: endDate } = req.body;
    console.log("startDate,endDate", startDate, endDate);
    const start = moment(startDate).startOf("day")?.toDate(),
      end = moment(endDate).endOf("day").toDate();

    console.log("start,end", start, end);
    const ndrOrders = await Order.find({
      callType: "ndr",
      createdAt: { $gte: start, $lte: end },
      ndrFunnel: true,
    });

    let counts = {
      total: ndrOrders?.length,
    };

    ndrOrders?.forEach((element) => {
      counts[element?.status?.toLowerCase()] =
        (counts[element?.status?.toLowerCase()] || 1) + 1;
    });

    res.status(200).json({
      data: ndrOrders,
      meta: counts,
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: error });
  }
};

const getOrdersByUId = async (req, res) => {
  let { start: startDate, end: endDate } = req.body;
  console.log("startDate,endDate", startDate, endDate);
  const start = moment(startDate).startOf("day")?.toDate(),
    end = moment(endDate).endOf("day").toDate();

  let user = req.user,
    obj;

  console.log("user?.type", user?.type);

  if (user?.type?.toLowerCase() === "user")
    obj = {
      createdBy: user?._id,
    };

  const ordersByUId = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        ...obj,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "createdBy",
      },
    },
    {
      $unwind: "$createdBy",
    },
    {
      $group: {
        _id: "$uId",
        orders: { $push: "$$ROOT" },
        createdBy: { $first: "$createdBy" },
      },
    },
  ]);

  console.log("ordersByUId", ordersByUId);

  res.status(200).json(ordersByUId);
};

const deleteOrders = async (req, res) => {
  let id = req?.query?.uId;
  const deleted = await Order.deleteMany({
    uId: id,
  });
  const deleted2 = await OrderCopy.deleteMany({
    uId: id,
  });

  res.status(200).json(deleted);
};

const fetchStatus = async (req, res) => {
  try {
    let status = await Fetch.find({}).sort({ createdAt: -1 }).lean();
    if (status) return res.status(200).json({ ...status?.[0] });
  } catch (error) {
    throw new Error(error);
  }
};
const addFetchStatus = async (req, res) => {
  try {
    let previous = await Fetch.findById(req?.body?.id);
    if (previous) {
      let status = await Fetch.findOneAndUpdate(
        { _id: req?.body?.id },
        {
          $set: {
            ...req?.body,
          },
        }
      );
      if (status) return res.status(200).json(status);
    } else {
      let status = await Fetch.create({
        ...req?.body,
      });
      if (status) return res.status(200).json(status);
    }
  } catch (error) {
    throw new Error(error);
  }
};

const bulkDeleteOrders = async (req, res) => {
  try {
    let ordersDeleted = await Order.deleteMany({
      // _id: {
      //   $in: req?.body?.ids,
      // },
      createdBy: "652bff6e851cdbb99d67f1fa",
    });
    let ordersDeleted2 = await OrderCopy.deleteMany({
      // status: null,
      createdBy: "652bff6e851cdbb99d67f1fa",
    });

    if (ordersDeleted && ordersDeleted2) {
      res.status(200).json({
        deleted: true,
      });
    }
  } catch (error) {
    console.log("error", error);
    res.status(500)?.json({
      error,
    });
  }
};

module.exports = {
  bulkDeleteOrders,
  addOrders,
  getOrders,
  getOrdersCounts,
  getOrdersStatusByEmployees,
  getOverallPerformance,
  getNDROrders,
  getTotalCallsByDateRangeAndUsers,
  getStage1,
  getOrdersByUId,
  deleteOrders,
  fetchStatus,
  addFetchStatus,
};

// https://apiv2.shiprocket.in/v1/external/auth/login
