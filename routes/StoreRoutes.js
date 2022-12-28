import { Router } from "express";
import { check } from "express-validator";
import {
  addStoreToUser,
  deleteStore,
  editStore,
  getAllMyStores,
  getInfoAboutMyStore,
  getUsersOfOneStore,
  activateStore,
} from "../controllers/StoreController.js";

const router = new Router();

router.post("/all", getAllMyStores);
router.patch("/delete", deleteStore);
router.patch("/add", addStoreToUser);
router.patch("/activate", activateStore);
router.get("/info", getInfoAboutMyStore);
router.get("/users", getUsersOfOneStore);
router.patch(
  "/edit",
  [
    check(
      "store_name",
      "Название не должно содержать больше 20 или меньше 1 символов!"
    ).isLength({ min: 1, max: 20 }),
    check(
      "manager",
      "Имя не должно содержать больше 20 и меньше 1 символов!"
    ).isLength({ min: 1, max: 20 }),
    check(
      "api_token",
      "Токен не должен быть больше 90  и меньше 1 сиволов!"
    ).isLength({
      min: 1,
      max: 90,
    }),
    check("avatar", "Неправильный формат URL!").isURL(),
    check("avatar", "Недопустимое количество символов!").isLength({
      min: 1,
      max: 999,
    }),
  ],
  editStore
);

export default router;
