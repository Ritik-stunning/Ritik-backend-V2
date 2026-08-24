import { z } from "../utils/zod-openapi";
import { LeadChannel, LeadStage, LeadTreatment } from "../entities/Lead";

const dateString = z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
  message: "Invalid date/time",
});

const createBody = z
  .object({
    name: z.string().max(255).optional(),
    phone: z.string().min(3).max(32).optional(),
    altPhone: z.string().min(3).max(32).optional(),
    whatsappNumber: z.string().min(3).max(32).optional(),
    email: z.email().max(255).optional(),
    channel: z.nativeEnum(LeadChannel).optional(),
    source: z.string().max(120).optional(),
    campaign: z.string().max(160).optional(),
    adId: z.string().max(64).optional(),
    adName: z.string().max(160).optional(),
    treatment: z.nativeEnum(LeadTreatment).optional(),
    dentalProblem: z.string().optional(),
    message: z.string().optional(),
    budget: z.string().max(64).optional(),
    city: z.string().max(120).optional(),
    state: z.string().max(120).optional(),
    country: z.string().max(120).optional(),
    area: z.string().max(120).optional(),
    pincode: z.string().max(32).optional(),
    address: z.string().optional(),
    preferredDate: dateString.optional(),
    preferredTime: z.string().max(32).optional(),
    tags: z.array(z.string().max(60)).optional(),
  })
  .refine((b) => Boolean(b.phone || b.whatsappNumber || b.email), {
    message: "At least one of phone, whatsappNumber, or email is required",
  });

export const createLeadSchema = z.object({ body: createBody });

export const listLeadsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    stage: z.nativeEnum(LeadStage).optional(),
    channel: z.nativeEnum(LeadChannel).optional(),
    ownerUserId: z.coerce.number().int().positive().optional(),
    isInternational: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    q: z.string().max(160).optional(),
  }),
});

export const leadIdParamSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

export const updateLeadSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z
    .object({
      stage: z.nativeEnum(LeadStage).optional(),
      ownerUserId: z.coerce.number().int().positive().nullable().optional(),
      tags: z.array(z.string().max(60)).optional(),
      isCalled: z.boolean().optional(),
      isWhatsappCalled: z.boolean().optional(),
      isWhatsappMessaged: z.boolean().optional(),
      isEmailed: z.boolean().optional(),
      contactMade: z.boolean().optional(),
      doNotCall: z.boolean().optional(),
      doNotSms: z.boolean().optional(),
      doNotEmail: z.boolean().optional(),
      doNotWhatsapp: z.boolean().optional(),
      followUpDate: dateString.nullable().optional(),
    })
    .refine((b) => Object.keys(b).length > 0, {
      message: "At least one field is required to update",
    }),
});
