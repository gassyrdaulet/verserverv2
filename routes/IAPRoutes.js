import { Router } from "express";
import { auth } from "../middleware/RouterSecurity.js";
import { validate } from "../controllers/IAPController.js";

const router = new Router();

router.post("/validate", auth, validate);
export default router;
