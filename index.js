import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import AuthRoutes from "./routes/AuthRoutes.js";
import StoreRoutes from "./routes/StoreRoutes.js";
import cors from "cors";
import { auth } from "./middleware/RouterSecurity.js";
import IAPRoutes from "./routes/IAPRoutes.js";
import conn from "./db.js";
import { google } from "googleapis";

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
app.use("/api/iap/", IAPRoutes);

const checkForPremium = async () => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "pc-api-7328700191590391894-370-3ab9d12ae106.json",
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });
    console.log(
      "\n" + new Date().toLocaleDateString(),
      new Date().toLocaleTimeString(),
      "checking premium started."
    );
    const sql = `SELECT * FROM users`;
    const sql2 = `SELECT premium FROM stores WHERE ?`;
    const sql3 = `UPDATE stores SET premium = "0" WHERE ?`;

    const users = (await conn.query(sql))[0];
    await Promise.all(
      users.map(async (user) => {
        try {
          if (
            (user.store === "",
            !user.store,
            user.purchasetoken === "" || !user.purchasetoken)
          ) {
            const { premium } = (
              await conn.query(sql2, { uid: user.store })
            )[0][0];
            if (premium === "1") {
              console.log(
                `Deactivating premium on user: ${user.uid}, Store UID: ${user.store}`
              );
              await conn.query(sql3, { uid: user.store });
            }
            return;
          }
          if (Date.now() > parseInt(user.adate)) {
            try {
              console.log("Premium on id:" + user.id + " has expired!");
              if (user.premiumtype === "trialversion") {
                const { premium } = (
                  await conn.query(sql2, { uid: user.store })
                )[0][0];
                if (premium === "1") {
                  console.log(
                    `Deactivating premium on user: ${user.uid}, Store UID: ${user.store}`
                  );
                  await conn.query(sql3, { uid: user.store });
                }
                return;
              }
              const response = await google
                .androidpublisher("v3")
                .purchases.subscriptionsv2.get({
                  packageName: "com.gassyrdaulet.codechecker",
                  token: user["purchasetoken"],
                  auth,
                });
              if (
                response.data.subscriptionState === "SUBSCRIPTION_STATE_EXPIRED"
              ) {
                const { premium } = (
                  await conn.query(sql2, { uid: user.store })
                )[0][0];
                if (premium === "1") {
                  console.log(
                    `Deactivating premium on user: ${user.uid}, Store UID: ${user.store}`
                  );
                  await conn.query(sql3, { uid: user.store });
                }
              }
            } catch (e) {
              console.log(user.id + ": " + e.message);
            }
          }
        } catch (e) {
          console.log(e.message);
        }
      })
    );
    console.log(
      new Date().toLocaleDateString(),
      new Date().toLocaleTimeString(),
      "checking premium ended.",
      `Next check after 300 seconds.\n`
    );
    setTimeout(() => {
      checkForPremium();
    }, 300 * 1000);
  } catch (e) {
    console.log(e);
  }
};
// checkForPremium();
// Checking Premium disabled. Free app for everyone!

app.listen(PORT, () => {
  console.log(
    `Server is LIVE. Go to http://[your-ip]:${PORT} so you can see the data.`
  );
});
