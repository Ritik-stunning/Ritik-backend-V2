import { Router } from "express";
import otp from "./otp";
import auth from "./auth";
import leads from "./leads";

const router = Router();

router.use("/otp", otp);
router.use("/auth", auth);
router.use("/leads", leads);

export default router;
