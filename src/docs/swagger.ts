import { Express } from "express";
import swaggerUi from "swagger-ui-express";

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Stunning Dentistry CRM API",
    version: "1.0.0",
    description:
      "Backend API for Stunning Dentistry CRM - Lead capture, nurture, and appointments",
  },
  servers: [
    {
      url: "/",
      description: "Current environment",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" },
          details: { type: "object" },
        },
        required: ["error", "message"],
      },
      CreateOtpRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
        },
        required: ["email"],
      },
      VerifyOtpRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          otp: { type: "string", minLength: 6, maxLength: 6 },
        },
        required: ["email", "otp"],
      },
      AuthTokensResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
        },
        required: ["accessToken", "refreshToken"],
      },
      LogoutRequest: {
        type: "object",
        properties: {
          refreshToken: { type: "string" },
        },
      },
      CreateLeadRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          altPhone: { type: "string" },
          whatsappNumber: { type: "string" },
          email: { type: "string", format: "email" },
          channel: {
            type: "string",
            enum: [
              "google_ads",
              "meta_ads",
              "website",
              "practo",
              "walk_in",
              "referral",
              "manual",
              "other",
            ],
          },
          source: { type: "string" },
          campaign: { type: "string" },
          adId: { type: "string" },
          adName: { type: "string" },
          treatment: {
            type: "string",
            enum: [
              "aligners",
              "implants",
              "smile_design",
              "veneers",
              "whitening",
              "root_canal",
              "general",
              "other",
            ],
          },
          dentalProblem: { type: "string" },
          message: { type: "string" },
          budget: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          country: { type: "string" },
          area: { type: "string" },
          pincode: { type: "string" },
          address: { type: "string" },
          preferredDate: { type: "string", format: "date" },
          preferredTime: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
      },
      UpdateLeadRequest: {
        type: "object",
        properties: {
          stage: {
            type: "string",
            enum: [
              "new",
              "contacted",
              "qualified",
              "consultation_scheduled",
              "consultation_completed",
              "treatment_proposed",
              "won",
              "lost",
              "junk",
            ],
          },
          ownerUserId: { type: "integer", nullable: true },
          tags: { type: "array", items: { type: "string" } },
          isCalled: { type: "boolean" },
          isWhatsappCalled: { type: "boolean" },
          isWhatsappMessaged: { type: "boolean" },
          isEmailed: { type: "boolean" },
          contactMade: { type: "boolean" },
          doNotCall: { type: "boolean" },
          doNotSms: { type: "boolean" },
          doNotEmail: { type: "boolean" },
          doNotWhatsapp: { type: "boolean" },
          followUpDate: { type: "string", nullable: true },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: { description: "Service healthy" },
          503: { description: "Service degraded" },
        },
      },
    },
    "/api/v1/otp/create": {
      post: {
        tags: ["OTP"],
        summary: "Request staff login OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateOtpRequest" },
            },
          },
        },
        responses: {
          200: { description: "OTP sent or logged" },
          400: { description: "Validation error" },
        },
      },
    },
    "/api/v1/otp/verify": {
      post: {
        tags: ["OTP"],
        summary: "Verify OTP and obtain JWT tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyOtpRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Tokens issued",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthTokensResponse" },
              },
            },
          },
          400: { description: "Validation error" },
          401: { description: "Invalid or expired OTP" },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout user session",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LogoutRequest" },
            },
          },
        },
        responses: {
          200: { description: "Logged out" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/leads": {
      post: {
        tags: ["Leads"],
        summary: "Capture new lead or re-enquiry",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateLeadRequest" },
            },
          },
        },
        responses: {
          201: { description: "Lead created" },
          200: { description: "Lead re-enquiry recorded" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
        },
      },
      get: {
        tags: ["Leads"],
        summary: "List leads with pagination and filters",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "pageSize",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
          { name: "stage", in: "query", schema: { type: "string" } },
          { name: "channel", in: "query", schema: { type: "string" } },
          { name: "ownerUserId", in: "query", schema: { type: "integer" } },
          {
            name: "isInternational",
            in: "query",
            schema: { type: "boolean" },
          },
          { name: "q", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "List of leads" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/leads/{id}": {
      get: {
        tags: ["Leads"],
        summary: "Get lead by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Lead details" },
          401: { description: "Unauthorized" },
          404: { description: "Lead not found" },
        },
      },
      patch: {
        tags: ["Leads"],
        summary: "Update lead status, ownership, or flags",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateLeadRequest" },
            },
          },
        },
        responses: {
          200: { description: "Lead updated" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Lead not found" },
        },
      },
    },
  },
};

export function setupSwagger(app: Express): void {
  app.get("/docs.json", (_req, res) => {
    res.json(swaggerDocument);
  });
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
