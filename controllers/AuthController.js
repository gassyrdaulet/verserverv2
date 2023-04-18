import * as dotenv from "dotenv";
import config from "config";
dotenv.config();
const {
  PRODUCTION,
  AVATAR_URL: avatar,
  VER_CODE_LT: verificationCodeLT,
  USER_AVATAR_URL: user_avatar,
  SECRET_EDITING_KEY,
} = process.env;
const { dbConfig: dataBaseConfig, dbConfigProd: dataBaseConfigProduction } =
  config.get("dbConfig");
const production = PRODUCTION === "0" ? false : true;
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import mysql from "mysql2/promise";
import { customAlphabet } from "nanoid";
import { sendConfirmationEmail } from "../service/AuthService.js";
import conn from "../db.js";

const generateAccesToken = (id, role, uid, store) => {
  const payload = {
    id,
    role,
    uid,
    store,
  };
  return jwt.sign(payload, process.env.SECRET_KEY, {
    expiresIn: process.env.LOGIN_TOKEN_LT,
  });
};

export const login = async (req, res) => {
  try {
    const conn = await mysql.createConnection(
      production ? dataBaseConfigProduction : dataBaseConfig
    );
    const { email, password } = req.body;
    // console.log(email);
    const errors = validationResult(req);
    const sql = `SELECT * FROM users WHERE email = '${email}'`;
    const user = (await conn.query(sql))[0][0];
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Ошибка!", errors });
    }
    if (!user) {
      return res
        .status(400)
        .json({ message: "Пользователь с таким E-mail не найден." });
    }

    const isPassValid = bcrypt.compareSync(password, user.password);
    if (!isPassValid) {
      return res.status(400).json({ message: "Неверный пароль." });
    }
    // if (user.type === "inactive") {
    //   return res
    //     .status(200)
    //     .json({ message: "Пожалуйста, подтвердите ваш E-mail!", email });
    // }
    const token = generateAccesToken(user.id, user.role, user.uid, user.store);
    return res.json({
      token,
      user: {
        id: user.id + "",
        uid: user.uid + "",
        email: user.email + "",
        name: user.name + "",
        avatar: user.avatar + "",
        store: user.store + "",
      },
    });
  } catch (e) {
    res.send({ message: "Ошибка сервера: " + e });
  }
};

export const registration = async (req, res) => {
  try {
    const conn = await mysql.createConnection(
      production ? dataBaseConfigProduction : dataBaseConfig
    );
    const errors = validationResult(req);
    const { email, name, password, cellphone } = req.body;
    const sql2 = `INSERT INTO users SET ?`;
    const sql3 = `INSERT INTO stores SET ?`;
    const sql = `SELECT * FROM users WHERE email = '${email}'`;
    const candidate = (await conn.query(sql))[0][0];
    if (!errors.isEmpty()) {
      await conn.end();
      return res.status(400).json({ message: "Ошибка!", errors });
    }
    if (candidate) {
      await conn.end();

      return res
        .status(400)
        .json({ message: "Пользователь с таким e-mail уже существует." });
    } else {
      const checkForUniqueId = async () => {
        const nanoid = customAlphabet("1234567890", 8);
        const store_id = nanoid();
        const sql4 = `SELECT * FROM stores WHERE uid = '${store_id}'`;
        const store_candidate = (await conn.query(sql4))[0][0];
        if (store_candidate) {
          return await checkForUniqueId();
        } else {
          return store_id;
        }
      };

      const store_id = await checkForUniqueId();

      const checkForUniqueUserId = async () => {
        const nanoid = customAlphabet("1234567890", 8);
        const user_id = nanoid();
        const sql4 = `SELECT * FROM users WHERE uid = '${user_id}'`;
        const user_candidate = (await conn.query(sql4))[0][0];
        if (user_candidate) {
          return await checkForUniqueUserId();
        } else {
          return user_id;
        }
      };

      const uid = await checkForUniqueUserId();

      const hashPassword = await bcrypt.hash(password, 5);

      await conn.query(sql3, {
        uid: store_id,
        store_name: "Название Магазина",
        api_token: "API - токен магазина",
        manager: name,
        owner: uid,
        users: uid,
        premium: "1", //Premium is gived for everyone!
        avatar,
      });

      const nanoidForConfirmationCode = customAlphabet(
        "1234567890abcdefghijklmnopqrstuvwxyz",
        7
      );
      const confirmationcCode = nanoidForConfirmationCode();
      sendConfirmationEmail(name, email, confirmationcCode);

      await conn.query(sql2, {
        email: email.toLowerCase(),
        name,
        storelist: store_id,
        type: "inactive",
        uid,
        cellphone,
        adate: (Date.now() - 23 * 24 * 60 * 60 * 1000).toString(),
        cdate: Date.now().toString(),
        confirm: confirmationcCode,
        store: store_id,
        password: hashPassword,
        avatar: user_avatar,
      });
      await conn.end();

      return res
        .json({
          message: "Пользователь успешно зарегистрирован!",
        })
        .status(200);
    }
  } catch (e) {
    console.log(e);
    res.send({ message: "Server error: " + e });
  }
};

export const editAccount = async (req, res) => {
  try {
    const { id } = req.user;
    const errors = validationResult(req);
    const { name, password, newpassword, avatar, cellphone } = req.body;
    const sql = `SELECT * FROM users WHERE id = ${id}`;
    const sql2 = `UPDATE users SET ? WHERE id = ${id}`;
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Ошибка!", errors });
    }
    const conn = await mysql.createConnection(
      production ? dataBaseConfigProduction : dataBaseConfig
    );
    if (password === SECRET_EDITING_KEY && newpassword === SECRET_EDITING_KEY) {
      await conn.query(sql2, { name, avatar, cellphone });
      return res.status(200).json({ message: "Аккаунт успешно обновлен." });
    }
    const user = (await conn.query(sql))[0][0];
    const isPassValid = bcrypt.compareSync(password, user.password);
    if (!isPassValid) {
      return res.status(400).json({ message: "Неверный пароль." });
    }
    const hashPassword = await bcrypt.hash(newpassword, 5);
    await conn.query(sql, { avatar, name, cellphone, password: hashPassword });
    res.status(200).json({ message: "Аккаунт успешно обновлен." });
    conn.end();
  } catch (e) {
    res.status(500).json({ message: "Ошибка! " + e });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.user;
    const sql = `SELECT * FROM users WHERE id = ${id}`;
    const sql2 = `DELETE FROM users WHERE id = ${id}`;
    const conn = await mysql.createConnection(
      production ? dataBaseConfigProduction : dataBaseConfig
    );
    const user = (await conn.query(sql))[0][0];
    const sql3 = `UPDATE stores SET ? WHERE uid = ${user.store}`;
    await conn.query(sql2);
    await conn.query(sql3, { premium: 0 });
    res.status(200).json({ message: "Аккаунт успешно удален!" });
    conn.end();
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Ошибка! " + e });
  }
};

export const sendCodeToRestoreTheAccount = async (req, res) => {
  try {
    const { email } = req.body;
    const cdate = Date.now().toString();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Ошибка!", errors });
    }
    const nanoidForConfirmationCode = customAlphabet(
      "1234567890abcdefghijklmnopqrstuvwxyz",
      7
    );
    const confirmationCode = nanoidForConfirmationCode();
    const sql = `SELECT * FROM users WHERE ?`;
    const sql2 = `UPDATE users SET ? WHERE email = "${email}"`;
    const conn = await mysql.createConnection(
      production ? dataBaseConfigProduction : dataBaseConfig
    );
    const candidate = (await conn.query(sql, { email }))[0][0];
    if (!candidate) {
      await conn.end();
      return res
        .status(400)
        .json({ message: "Пользователь с таким e-mail не существует!" });
    }
    if (Date.now() - parseInt(candidate.cdate) < verificationCodeLT) {
      await conn.end();
      const nextCodeTime =
        verificationCodeLT - (Date.now() - parseInt(candidate.cdate));
      const minutes = Math.floor(nextCodeTime / 60000);
      const seconds = Math.floor((nextCodeTime - minutes * 60000) / 1000);
      return res.status(400).json({
        message: `Новый код можно будет отправить только через ${
          minutes !== 0 ? minutes + " минуты и " : ""
        }${seconds} секунд.`,
      });
    }
    sendConfirmationEmail(candidate.name, email, confirmationCode);
    await conn.query(sql2, { confirm: confirmationCode, cdate });
    res.status(200).json({ message: "Код успешно отправлен на ваш E-mail!" });
    conn.end();
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Ошибка! " + e });
  }
};

export const confirmAccount = async (req, res) => {
  try {
    const { code, email } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Ошибка!", errors });
    }
    const sql = `SELECT * FROM users WHERE email = "${email}"`;
    const conn = await mysql.createConnection(
      production ? dataBaseConfigProduction : dataBaseConfig
    );
    const candidate = (await conn.query(sql))[0][0];
    if (!candidate) {
      await conn.end();
      return res
        .status(400)
        .json({ message: "Пользователь с таким e-mail не существует!" });
    }
    if (candidate.type !== "inactive") {
      await conn.end();
      return res
        .status(400)
        .json({ message: "Аккаунт с таким E-mail уже активирован!" });
    }
    if (candidate.confirm !== code) {
      conn.end();
      return res.status(400).json({ message: "Неверный код!" });
    }
    const sql2 = `UPDATE users SET ? WHERE id = ${candidate.id}`;
    await conn.query(sql2, { type: "active" });
    res.status(200).json({ message: "Аккаунт успешно подтвержден!" });
    conn.end();
  } catch (e) {
    res.status(500).json({ message: "Ошибка! " + e });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { code, email, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Ошибка!", errors });
    }
    const sql = `SELECT * FROM users WHERE email = "${email}"`;
    const conn = await mysql.createConnection(
      production ? dataBaseConfigProduction : dataBaseConfig
    );
    const candidate = (await conn.query(sql))[0][0];
    const hashPassword = await bcrypt.hash(password, 5);
    const nanoidForConfirmationCode = customAlphabet(
      "1234567890abcdefghijklmnopqrstuvwxyz",
      7
    );
    const confirmationCode = nanoidForConfirmationCode();
    if (!candidate) {
      await conn.end();
      return res
        .status(400)
        .json({ message: "Пользователь с таким e-mail не существует!" });
    }
    if (candidate.confirm !== code) {
      conn.end();
      return res.status(400).json({ message: "Неверный код!" });
    }
    const sql2 = `UPDATE users SET ? WHERE id = ${candidate.id}`;
    await conn.query(sql2, {
      password: hashPassword,
      confirm: confirmationCode,
    });
    res.status(200).json({ message: "Пароль успешно сменился!" });
    conn.end();
  } catch (e) {
    res.status(500).json({ message: "Ошибка! " + e });
  }
};

export const getUserInfo = async (req, res) => {
  try {
    const { id } = req.user;
    const sql = `SELECT * FROM users WHERE id = ${id}`;
    const conn = await mysql.createConnection(
      production ? dataBaseConfigProduction : dataBaseConfig
    );
    const user = (await conn.query(sql))[0][0];
    res.status(200).json({
      user: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        cellphone: user.cellphone,
      },
    });
    conn.end();
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Ошибка! " + e });
  }
};

export const getOtherInfo = async (req, res) => {
  try {
    const sql = `SELECT * FROM other`;
    const conn = await mysql.createConnection(
      production ? dataBaseConfigProduction : dataBaseConfig
    );
    const otherInfo = (await conn.query(sql))[0][0];
    res.status(200).json({
      ...otherInfo,
    });
    conn.end();
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Ошибка! " + e });
  }
};

export const giveSubscription = async (req, res) => {
  try {
    const { id } = req.user;
    if (id !== parseInt(process.env.ADMIN_ID)) {
      return res.status(403).json({ message: "Отказано в доступе!" });
    }
    const { userUID, days } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Ошибка!", errors });
    }
    const date = Date.now() + days * 24 * 60 * 60 * 1000;
    await conn.query(
      `UPDATE users SET purchasetoken = "demo",premiumtype = "trialversion", adate = "${date}", stringadate = "${new Date(
        date
      ).toLocaleDateString()}${new Date(
        date
      ).toLocaleTimeString()}" WHERE uid = ${userUID}`
    );
    const sql1 = `SELECT * FROM users WHERE UID = ${userUID}`;
    const user = (await conn.query(sql1))[0][0];
    const sql2 = `UPDATE stores SET premium = "1" WHERE ?`;
    await conn.query(sql2, { uid: user.store });
    res.status(200).json({ message: "Подписка была успешно предоставлена!" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Ошибка в сервере! " + e });
  }
};
