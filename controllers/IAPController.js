import { google } from "googleapis";
import conn from "../db.js";
import axios from "axios";

export const validate = async (req, res) => {
  try {
    const { platform } = req.body;
    const { store, id } = req.user;
    if (platform === "android") {
      const auth = new google.auth.GoogleAuth({
        keyFile: "pc-api-7328700191590391894-370-3ab9d12ae106.json",
        scopes: ["https://www.googleapis.com/auth/androidpublisher"],
      });
      const response = await google
        .androidpublisher("v3")
        .purchases.subscriptionsv2.get({
          packageName: "com.gassyrdaulet.codechecker",
          token: req.body["purchaseToken"],
          auth,
        });
      if (response.status !== 200) {
        res.status(500).json({ error: -1 });
        return;
      }
      if (response.data.subscriptionState === "SUBSCRIPTION_STATE_ACTIVE") {
        await conn.query(
          `UPDATE users SET premiumtype="googlepay",purchasetoken = "${
            req.body["purchaseToken"]
          }", adate = "${Date.parse(
            response.data?.lineItems[0].expiryTime
          )}", stringadate = "${
            response.data?.lineItems[0].expiryTime
          }" WHERE id = ${id}`
        );
        const sql = `UPDATE stores SET premium = "1" WHERE ?`;
        await conn.query(sql, { uid: store });
        res.status(200).json({
          isActiveSubscription: true,
        });
        return;
      }
      res.status(200).json({
        isActiveSubscription: false,
      });
    } else if (platform === "ios") {
      const response = await google
        .androidpublisher("v3")
        .purchases.subscriptionsv2.get({
          packageName: "com.gassyrdaulet.codechecker",
          token: req.body["purchaseToken"],
          auth,
        });
      if (response.status !== 200) {
        res.status(500).json({ error: -1 });
        return;
      }
      if (response.data.subscriptionState === "SUBSCRIPTION_STATE_ACTIVE") {
        await conn.query(
          `UPDATE users SET premiumtype="googlepay",purchasetoken = "${
            req.body["purchaseToken"]
          }", adate = "${Date.parse(
            response.data?.lineItems[0].expiryTime
          )}", stringadate = "${
            response.data?.lineItems[0].expiryTime
          }" WHERE id = ${id}`
        );
        const sql = `UPDATE stores SET premium = "1" WHERE ?`;
        await conn.query(sql, { uid: store });
        res.status(200).json({
          isActiveSubscription: true,
        });
        return;
      }
      res.status(200).json({
        isActiveSubscription: false,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: -1 });
    return;
  }
};
