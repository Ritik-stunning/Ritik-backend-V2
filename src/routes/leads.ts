import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/require-auth";
import * as leadController from "../controllers/lead-controller";
import {
  createLeadSchema,
  leadIdParamSchema,
  listLeadsSchema,
  updateLeadSchema,
} from "../validations/lead-validation";

const router = Router();

router.use(requireAuth);

router.post("/", validate(createLeadSchema), leadController.createLead);
router.get("/", validate(listLeadsSchema), leadController.listLeads);
router.get("/:id", validate(leadIdParamSchema), leadController.getLeadById);
router.patch("/:id", validate(updateLeadSchema), leadController.updateLead);

export default router;
