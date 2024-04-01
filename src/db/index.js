const sql = require("sqlite3").verbose();
const util = require("util");
const fileName = "./fake-store.sqlite3";

const createDataBase = (fname) => {
  return new sql.Database(fname, sql.OPEN_READWRITE | sql.OPEN_CREATE, (err) =>
    err
      ? console.error(err.message)
      : console.log(`Connected to database through ${fname}`)
  );
};

const db = createDataBase(fileName);

const dbRun = (query, paras = []) => {
  return new Promise((res, rej) => {
    db.run(query, paras, function (err) {
      // can't use array function here.
      if (err) rej(err);
      else res({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const dbAll = util.promisify(db.all.bind(db));
const dbGet = util.promisify(db.get.bind(db));
const dbClose = util.promisify(db.close.bind(db));
const dbTest = async () => {
  const createTable = `create table if not exists test (id integer primary key autoincrement,name text not null)`;
  const insertRecord = `insert into test (name) values (?)`;
  const updateRecord = `update test set name = $name where id = $id`;
  const selectAll = `select * from test`;
  const seletcOne = `select * from test where id = $id`;
  const deleteAll = `delete from test`;
  try {
    const createRes = await dbRun(createTable);
    console.log("createRes", createRes);
    const insertRes = await dbRun(insertRecord, ["testName"]);
    console.log("insertRes:", insertRes);
    const allRes = await dbAll(selectAll);
    console.table(allRes);
    const myId = insertRes.lastID;
    const updateRes = await dbRun(updateRecord, {
      $id: myId,
      $name: "new name",
    });
    console.log("updateRes:", updateRes);
    console.table(await dbAll(selectAll));
    console.log(await dbGet(seletcOne, { $id: myId }));
    console.log(await dbRun(deleteAll));
    await dbClose();
  } catch (e) {
    console.error(e);
  }
};

const createUserTable = async () => {
  const createTableSql = `create table if not exists user 
  (id integer primary key autoincrement,
    name text not null,
    email text not null unique,
    password text not null)`;
  try {
    await dbRun(createTableSql);
    return true;
  } catch (e) {
    console.error(`Error in createUserTable: ${e}.`);
    return false;
  }
};

const checkEmailTaken = async (email) => {
  const query = "select * from user where email = $email";
  try {
    if (!(await createUserTable()))
      return { status: "error", message: "Failed to create User table!" };
    const result = await dbGet(query, { $email: email });
    if (!result) return { status: "OK" };
    return { status: "error", message: "The email is already used." };
  } catch (e) {
    console.error(`Error in checkEmailTaken: ${e}`);
    return { status: "error", message: e.message };
  }
};

// this function is used for sign up a user.
// the validation is to check if email has been used before
// and all the three properties can't be empty.
const createUser = async ({ name, email, password }) => {
  const insertUserSql = `insert into user (name,email,password) 
        values (?,?,?)`;

  if (!name || !email || !password)
    return {
      status: "error",
      message: "Name, Email, and Password can't be empty.",
    };
  try {
    if (!(await createUserTable()))
      return { status: "error", message: "Failed to create User table!" };
    const checkEmailResult = await checkEmailTaken(email);
    if (checkEmailResult.status === "error") return checkEmailResult;
    const res = await dbRun(insertUserSql, [name, email, password]);
    return { status: "OK", id: res.lastID, name, email };
  } catch (e) {
    console.error(`Error in createUser: ${e}.`);
    return { status: "error", message: "Failed to insert user into table!" };
  }
};
// used for login a user
const checkUser = async ({ email, password }) => {
  const query = `select * from user where email=$email and password = $password`;
  try {
    if (!(await createUserTable()))
      return { status: "error", message: "Failed to create User table!" };
    const res = await dbGet(query, { $email: email, $password: password });
    if (!res) return { status: "error", message: "Wrong email or password." };

    const id = res.id;
    return { status: "OK", id, name: res.name, email };
  } catch (e) {
    console.error(`Error in loginUser: ${e}.`);
    return { status: "error", message: "Failed to login user!" };
  }
};

// update user name and password
const updateUser = async ({ userID, name, password }) => {
  const query = `update user set name = $name, password = $password where id = $id`;
  if (!name || !password)
    return {
      status: "error",
      message: "New Name and Password can't be empty.",
    };
  try {
    if (!(await createUserTable()))
      return { status: "error", message: "Failed to create User table!" };
    await dbRun(query, { $name: name, $password: password, $id: userID });
    return {
      status: "OK",
      name,
      message: "User name and password update successfully.",
    };
  } catch (e) {
    console.error(`Error in updateUser: ${e}.`);
    return { status: "error", message: "Failed to update user!" };
  }
};

const deleteUser = async (email) => {
  const query = `delete from user where email = $email`;
  try {
    if (!(await createUserTable()))
      return { status: "error", message: "Failed to create User table!" };
    const res = await dbRun(query, { $email: email });
    return { status: "OK", users: res }; // don't check if deleted or not
  } catch (e) {
    console.error(`Error in deleteUser: ${e}.`);
    return { status: "error", message: "Failed to delete user!" };
  }
};
// this is a test purpose function.
const getAllUser = async () => {
  const query = `select * from user`;
  try {
    if (!(await createUserTable()))
      return { status: "error", message: "Failed to create User table!" };
    const res = await dbAll(query);
    return { status: "OK", users: res };
  } catch (e) {
    console.error(`Error in getAllUser: ${e}.`);
    return { status: "error", message: "Failed to get all user!" };
  }
};

// dbTest(); // this function is for internal test.
module.exports = { createUser, checkUser, getAllUser, deleteUser, updateUser };
