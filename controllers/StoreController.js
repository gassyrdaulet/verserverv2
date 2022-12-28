import * as dotenv from "dotenv";
import config from "config";
dotenv.config();
const { PRODUCTION, ADMIN_ID } = process.env;
const { dbConfig: dataBaseConfig, dbConfigProd: dataBaseConfigProduction } =
  config.get("dbConfig");
const production = PRODUCTION === "0" ? false : true;
import { validationResult } from "express-validator";
import mysql from "mysql2/promise";

export const getAllMyStores = async (req, res) => {
  try {
    const { id } = req.user;
    const sql1 = `SELECT storelist FROM users WHERE id = ${id} `;
    const sql3 = `SELECT * FROM stores`;
    const conn = await mysql.createConnection(
      production ? dataBaseConfigProduction : dataBaseConfig
    );
    if (id === parseInt(ADMIN_ID)) {
      const stores = (await conn.query(sql3))[0];
      const filteredStores = stores.map((store) => {
        if (store.premium === "0" || store.activated === "no") {
          delete store.api_token;
          return store;
        }
        return store;
      });
      res.send(filteredStores);
      await conn.end();
      return;
    }
    const { storelist } = (await conn.query(sql1))[0][0];
    const sql2 = `SELECT * FROM stores WHERE uid IN(${storelist})`;
    const stores = (await conn.query(sql2))[0];
    const filteredStores = stores.map((store) => {
      if (store.premium === "0") {
        delete store.api_token;
        return store;
      }
      return store;
    });
    res.send(filteredStores);
    await conn.end();
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Error! " + e });
  }
};

export const deleteStore = async (req, res) => {
  try {
    const { store_uid, user_uid: user_id } = req.body;
    const sql1 = `SELECT storelist FROM users WHERE uid = ${user_id} `;
    const sql2 = `SELECT users FROM stores WHERE uid = ${store_uid}`;
    const conn = await mysql.createConnection(
      production ? dataBaseConfigProduction : dataBaseConfig
    );
    const storelist = (await conn.query(sql1))[0][0]["storelist"].split(",");
    const userlist = (await conn.query(sql2))[0][0]["users"].split(",");

    if (!storelist.includes(store_uid)) {
      await conn.end();
      return res
        .status(400)
        .json({ message: "No such Store in the Storelist." });
    }
    if (!userlist.includes(user_id)) {
      await conn.end();
      return res.status(400).json({ message: "No such User in the Userlist." });
    }

    const sql3 = `UPDATE users SET storelist = ? WHERE uid = ${user_id} `;
    const sql4 = `UPDATE stores SET users = ? WHERE uid = ${store_uid}`;
    await conn.query(sql3, storelist.filter((e) => e !== store_uid).join());
    await conn.query(sql4, userlist.filter((e) => e !== user_id).join());
    res.status(200).json({ message: "Success!" });
    await conn.end();
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Error! " + e });
  }
};

export const addStoreToUser = async (req, res) => {
  try {
    const { id: my_id } = req.user;
    const { uid } = req.body;
    const sql = `SELECT store FROM users WHERE id = ${my_id}`;
    const sql1 = `SELECT storelist FROM users WHERE uid = ${uid} `;
    const conn = await mysql.createConnection(
      production ? dataBaseConfigProduction : dataBaseConfig
    );
    const { store: storeThatNeedsToBeAdded } = (await conn.query(sql))[0][0];
    // console.log(storeThatNeedsToBeAdded);
    const sql5 = `SELECT premium FROM stores WHERE uid = ${storeThatNeedsToBeAdded} `;
    const { premium } = (await conn.query(sql5))[0][0];
    if (premium === "0") {
      await conn.end();
      return res.status(400).json({ message: "Ваша подписка неактивна." });
    }
    const candidate = (await conn.query(sql1))[0][0];
    if (!candidate) {
      await conn.end();
      return res.status(400).json({ message: "Пользователь не найден!" });
    }
    const storelist = candidate["storelist"].split(",");
    // console.log(storeThatNeedsToBeAdded);
    // console.log(storelist);
    if (storelist.includes(storeThatNeedsToBeAdded)) {
      await conn.end();
      return res
        .status(400)
        .json({ message: "У этого пользователя уже есть доступ к магазину." });
    }
    if (storelist.length > 20) {
      await conn.end();
      return res
        .status(400)
        .json({ message: "Слишком много магазинов у пользователя." });
    }
    if (storelist.length === 1 && storelist[0] === "") {
      storelist[0] = storeThatNeedsToBeAdded;
    } else {
      storelist.push(storeThatNeedsToBeAdded);
    }
    // console.log(storelist);
    const sql2 = `SELECT users FROM stores WHERE uid = ${storeThatNeedsToBeAdded}`;

    const userlist = (await conn.query(sql2))[0][0]["users"].split(",");
    if (userlist.length > 50) {
      await conn.end();
      return res
        .status(400)
        .json({ message: "Слишком много пользователей у магазина." });
    }
    if (userlist.includes(uid)) {
      await conn.end();
      return res
        .status(400)
        .json({ message: "У пользователя уже есть доступ к этому магазину." });
    }

    if (userlist.length === 1 && userlist[0] === "") {
      userlist[0] = uid;
    } else {
      userlist.push(uid);
    }
    const sql3 = `UPDATE stores SET users = ? WHERE uid = ${storeThatNeedsToBeAdded}`;
    const sql4 = `UPDATE users SET storelist = ? WHERE uid = ${uid} `;

    await conn.query(sql3, userlist.join());
    await conn.query(sql4, storelist.join());

    res.status(200).json({ message: "Success!" });
    await conn.end();
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Error! " + e });
  }
};

export const getInfoAboutMyStore = async (req, res) => {
  try {
    const { id } = req.user;
    const sql1 = `SELECT store FROM users WHERE id = ${id} `;
    const conn = await mysql.createConnection(
      production ? dataBaseConfigProduction : dataBaseConfig
    );
    const { store: store_uid } = (await conn.query(sql1))[0][0];
    const sql2 = `SELECT * FROM stores WHERE uid = ${store_uid} `;
    const sql3 = `SELECT adate FROM users WHERE store = ${store_uid} `;
    const { adate } = (await conn.query(sql3))[0][0];
    const storeinfo = (await conn.query(sql2))[0][0];
    res.send({ ...storeinfo, adate });
    await conn.end();
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Error! " + e });
  }
};

export const getUsersOfOneStore = async (req, res) => {
  try {
    const { id } = req.user;
    const sql1 = `SELECT store FROM users WHERE id = ${id} `;
    const conn = await mysql.createConnection(
      production ? dataBaseConfigProduction : dataBaseConfig
    );
    const { store: store_uid } = (await conn.query(sql1))[0][0];
    const sql2 = `SELECT users FROM stores WHERE uid = ${store_uid} `;
    const userlist = (await conn.query(sql2))[0][0]["users"].split(",");
    const sql3 = `SELECT name, avatar, email, cellphone FROM users WHERE uid = ?`;
    const response = [];
    for (let i = 0; i < userlist.length; i++) {
      const chuck = (await conn.query(sql3, userlist[i]))[0][0];
      if (!chuck) {
        break;
      }
      response.push({
        ...chuck,
        uid: userlist[i],
      });
    }
    res.send(response);
    await conn.end();
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Error! " + e });
  }
};

export const editStore = async (req, res) => {
  try {
    const { id } = req.user;
    const errors = validationResult(req);
    const { store_name, api_token, manager, avatar, uid } = req.body;
    const sql = `SELECT store FROM users WHERE id = ${id}`;
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Ошибка!", errors });
    }
    const conn = await mysql.createConnection(
      production ? dataBaseConfigProduction : dataBaseConfig
    );
    const storeUID = (await conn.query(sql))[0][0]["store"];
    // console.log(storeUIDForCheck, uid);
    if (!storeUID)
      return res
        .status(403)
        .json({ message: "Вам разрешено редактировать только Ваш магазин!" });
    const sql2 = `UPDATE stores SET ? WHERE uid = ${storeUID}`;
    await conn.query(sql2, { store_name, avatar, manager, api_token });
    res.status(200).json({ message: "Магазин успешно обновлен." });
  } catch (e) {
    res.status(500).json({ message: "Ошибка! " + e });
  }
};

export const activateStore = async (req, res) => {
  try {
    const { id } = req.user;
    const errors = validationResult(req);
    const { activate } = req.body;
    const sql = `SELECT store FROM users WHERE id = ${id}`;
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Ошибка!", errors });
    }
    const conn = await mysql.createConnection(
      production ? dataBaseConfigProduction : dataBaseConfig
    );
    const storeUID = (await conn.query(sql))[0][0]["store"];
    // console.log(storeUIDForCheck, uid);
    if (!storeUID)
      return res
        .status(403)
        .json({ message: "Вам разрешено редактировать только Ваш магазин!" });
    const sql2 = `UPDATE stores SET ? WHERE uid = ${storeUID}`;
    await conn.query(sql2, { activated: activate });
    res.status(200).json({ message: "Магазин успешно обновлен." });
  } catch (e) {
    res.status(500).json({ message: "Ошибка! " + e });
  }
};
