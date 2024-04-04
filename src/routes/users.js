var express = require("express");
var router = express.Router();
const { getAllUsers } = require("../db/index");
const {
  createUserMiddleware,
  sendResponse,
  checkUserMiddleware,
  updateUserMiddleware,
} = require("../middle_ware/user");
const { setToken, auth } = require("../middle_ware/auth");
// test purpose function
router.get("/", async function (req, res, next) {
  const result = await getAllUsers();
  res.json(result);
});
router.post("/signup", [createUserMiddleware, setToken, sendResponse]);

router.post("/signin", [checkUserMiddleware, setToken, sendResponse]);

router.post("/update", [auth, updateUserMiddleware, sendResponse]);

module.exports = router;
