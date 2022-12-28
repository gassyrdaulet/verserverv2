import * as dotenv from "dotenv";
dotenv.config();
import config from "config";
const { PRODUCTION } = process.env;
const { dbConfig: dataBaseConfig, dbConfigProd: dataBaseConfigProduction } =
  config.get("dbConfig");
const production = PRODUCTION === "0" ? false : true;
import express from "express";
import bodyParser from "body-parser";
import AuthRoutes from "./routes/AuthRoutes.js";
import StoreRoutes from "./routes/StoreRoutes.js";
import cors from "cors";
import { auth } from "./middleware/routerSecurity.js";
import mysql from "mysql2/promise";

const PORT = process.env.PORT ? process.env.PORT : 9898;
const app = express();
app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use("/api/auth/", AuthRoutes);
app.use("/api/stores/", auth, StoreRoutes);

const checkForPremium = async () => {
  try {
    console.log(
      "\n" + new Date().toLocaleDateString(),
      new Date().toLocaleTimeString(),
      "checking premium started."
    );
    const sql = `SELECT * FROM users`;
    const sql2 = `SELECT premium FROM stores WHERE ?`;
    const sql3 = `UPDATE stores SET premium = "0" WHERE ?`;
    const conn = await mysql.createConnection(
      production ? dataBaseConfigProduction : dataBaseConfig
    );
    const users = (await conn.query(sql))[0];
    await Promise.all(
      users.map(async (user) => {
        try {
          if (
            Date.now() - parseInt(user.adate) >=
            process.env.ACTIVATION_LT_IN_DAYS * 24 * 60 * 60 * 1000
          ) {
            const testing_prem = (
              await conn.query(sql2, { uid: user.store })
            )[0];
            const { premium: isPremium } = (
              await conn.query(sql2, { uid: user.store })
            )[0][0];

            if (isPremium === "1") {
              console.log("Deactivating premium on user: " + user.uid);
              await conn.query(sql3, { uid: user.store });
            }
          }
        } catch (e) {
          console.log(e.message);
        }
      })
    );
    conn.end();
    console.log(
      new Date().toLocaleDateString(),
      new Date().toLocaleTimeString(),
      "checking premium ended.",
      `Next check after ${process.env.CHECKING_HOURS} hours.\n`
    );
    setTimeout(() => {
      checkForPremium();
    }, process.env.CHECKING_HOURS * 60 * 60 * 1000);
  } catch (e) {
    console.log(e);
  }
};
checkForPremium();

app.listen(PORT, () => {
  console.log(
    `Server is LIVE. Go to http://[your-ip]:/${PORT} so you can see the data.`
  );
});
