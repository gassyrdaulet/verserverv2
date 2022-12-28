import { Router } from "express";
import { check } from "express-validator";
import {
  changePassword,
  confirmAccount,
  deleteAccount,
  editAccount,
  getOtherInfo,
  getUserInfo,
  login,
  registration,
  sendCodeToRestoreTheAccount,
} from "../controllers/AuthController.js";
import { auth } from "../middleware/routerSecurity.js";

const router = new Router();

router.post(
  "/registration",
  [
    check("email", "Некорректный E-mail!").isEmail(),
    check("cellphone")
      .isNumeric()
      .withMessage("В номере телефона могут быть только цифры!")
      .isLength({ min: 5, max: 20 })
      .withMessage("Неправильный формат номера телефона."),
    check("password", "Пароль должен быть длиннее 9 и короче 20!")
      .isLength({
        min: 9,
        max: 20,
      })
      .isStrongPassword({ minLength: 0, minSymbols: 0 })
      .withMessage(
        "Пароль должен иметь как минимум одно число, одну заглавную и одну прописную букву."
      ),
    check("name", "Имя должно быть длиннее 1 и короче 20!").isLength({
      min: 1,
      max: 20,
    }),
  ],
  registration
);
router.post(
  "/login",
  [
    check("email", "Некорректный E-mail!").isEmail(),
    check("password", "Пароль должен быть длиннее 9 и короче 20!").isLength({
      min: 9,
      max: 20,
    }),
  ],
  login
);
router.patch(
  "/edit",
  [
    auth,
    check("name", "Имя должно содержать от 1 до 19 символов!").isLength({
      min: 1,
      max: 19,
    }),
    check("cellphone")
      .isNumeric()
      .withMessage("В номере телефона могут быть только цифры!")
      .isLength({ min: 5, max: 20 })
      .withMessage("Неправильный формат номера телефона."),
    check("newpassword", "Новый Пароль должен быть длиннее 9 и короче 20!")
      .isLength({
        min: 9,
        max: 20,
      })
      .isStrongPassword({ minLength: 0, minSymbols: 0 })
      .withMessage(
        "Пароль должен иметь как минимум одно число, одну заглавную и одну прописную букву."
      ),
    check(
      "password",
      "Ваш старый Пароль не мог быть длиннее 3 и короче 20!"
    ).isLength({
      min: 3,
      max: 20,
    }),
    check("avatar", "Неправильный формат URL!").isURL(),
    check("avatar", "Недопустимое количество символов!").isLength({
      min: 1,
      max: 999,
    }),
  ],
  editAccount
);
router.delete("/delete", auth, deleteAccount);
router.get("/getinfo", auth, getUserInfo);
router.get("/getContactsAndOther", getOtherInfo);
router.post(
  "/restore",
  [check("email", "Неверный формат E-mail!").isEmail()],
  sendCodeToRestoreTheAccount
);
router.post(
  "/confirm",
  [
    check("email", "Неверный формат E-mail!").isEmail(),
    check("code", "Код не должен быть короче 1 и длиннее 8!").isLength({
      min: 1,
      max: 8,
    }),
  ],
  confirmAccount
);
router.post(
  "/change",
  [
    check("email", "Неверный формат E-mail!").isEmail(),
    check("password", "Пароль не должен быть длиннее 9 и короче 20!")
      .isLength({
        min: 9,
        max: 20,
      })
      .isStrongPassword({ minLength: 0, minSymbols: 0 })
      .withMessage(
        "Пароль должен иметь как минимум одно число, одну заглавную и одну прописную букву."
      ),
    check("code", "Код не должен быть короче 1 и длиннее 8!").isLength({
      min: 1,
      max: 8,
    }),
  ],
  changePassword
);
export default router;
