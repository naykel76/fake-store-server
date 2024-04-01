const { createUser, checkUser, updateUser } = require("../db/index");

const createUserMiddleware = async (req, res, next) => {
  const { name, email, password } = req.body;
  const result = await createUser({ name, email, password });
  res.locals.result = result;
  res.locals.userID = result.id;
  next();
};

const checkUserMiddleware = async (req, res, next) => {
  const { email, password } = req.body;
  const result = await checkUser({ email, password });
  res.locals.result = result;
  res.locals.userID = result.id;
  next();
};

const updateUserMiddleware = async (req, res, next) => {
  const userID = res.locals.userID;
  const { name, password } = req.body;
  const result = await updateUser({ userID, name, password });
  if (result.status === "OK") {
    res.locals.result = result;
    return next();
  }
  res.json(result); // if error, directly send back
};

const sendResponse = (req, res) => {
  res.json(res.locals.result);
};

module.exports = {
  sendResponse,
  createUserMiddleware,
  checkUserMiddleware,
  updateUserMiddleware,
};
