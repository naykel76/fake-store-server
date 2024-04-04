var express = require("express");
var router = express.Router();
const { getAllOrders } = require("../db/index");
const {
  createOrderMiddleware,
  getOrderByUserMiddleware,
  updateOrderMiddleware,
} = require("../middle_ware/order");
const { auth } = require("../middle_ware/auth");
const { sendResponse } = require("../middle_ware/user");
router.get("/", async function (req, res, next) {
  const result = await getAllOrders();
  res.json(result);
});

router.get("/all", [auth, getOrderByUserMiddleware, sendResponse]);

router.post("/neworder", [auth, createOrderMiddleware, sendResponse]);

router.post("/updateorder", [auth, updateOrderMiddleware, sendResponse]);

module.exports = router;
