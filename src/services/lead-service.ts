import { ILike } from "typeorm";
import { getLeadRepository } from "../repositories/lead-repository";
import { getActivityRepository } from "../repositories/activity-repository";
import {
  Lead,
  LeadChannel,
  LeadStage,
  LeadReEnquiryStatus,
} from "../entities/Lead";
import { ActivityType } from "../entities/Activity";
import { User, UserRole } from "../entities/User";
import {
  computeBlindIndex,
  currentEncryptionKeyVersion,
  encryptPersonalData,
} from "../utils/encryption";
import {
  normalizeEmail,
  normalizePhone,
  normalizePhoneOrThrow,
} from "../utils/normalize";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/app-error";
import { parseOptionalDate } from "../utils/date";
import { isUniqueConstraintViolation } from "../utils/typeorm-helpers";
import {
  CaptureLeadInput,
  ListLeadsParams,
  UpdateLeadInput,
} from "../types/lead";

const leadRepository = getLeadRepository;
const activityRepository = getActivityRepository;

const MANAGER_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.HOD];
const hasManagerRole = (user: User) => MANAGER_ROLES.includes(user.role);

interface LeadActivityDetails {
  subject?: string | null;
  statusFrom?: string | null;
  statusTo?: string | null;
}

async function recordLeadActivity(
  leadId: number,
  userId: number,
  type: ActivityType,
  details: LeadActivityDetails = {},
): Promise<void> {
  const saveActivity = activityRepository();
  await saveActivity.save(
    saveActivity.create({
      leadId,
      userId,
      type,
      subject: details.subject,
      statusFrom: details.statusFrom,
      statusTo: details.statusTo,
    }),
  );
}

async function findExistingLeadByContactHash(
  phoneHash: Buffer | null | undefined,
  emailHash: Buffer | null | undefined,
): Promise<Lead | null> {
  const searchConditions: Array<Record<string, Buffer>> = [];
  if (phoneHash) searchConditions.push({ phoneHash });
  if (emailHash) searchConditions.push({ emailHash });
  if (!searchConditions.length) return null;
  return leadRepository().findOne({ where: searchConditions });
}

async function processReturningLeadEnquiry(
  existingLead: Lead,
  currentUser: User,
  input: CaptureLeadInput,
): Promise<Lead> {
  existingLead.reEnquiryCount += 1;
  existingLead.reEnquiryStatus = LeadReEnquiryStatus.RE_ENQUIRED;
  existingLead.lastActivityAt = new Date();
  if (!existingLead.ownerUserId) {
    existingLead.ownerUserId = currentUser.id;
    existingLead.assignedAt = new Date();
  }
  existingLead.updatedByUserId = currentUser.id;
  const savedLead = await leadRepository().save(existingLead);
  await recordLeadActivity(
    savedLead.id,
    currentUser.id,
    ActivityType.RE_ENQUIRY,
    { subject: `Re-enquiry via ${input.channel ?? savedLead.channel}` },
  );
  return savedLead;
}

export async function captureLead(
  input: CaptureLeadInput,
  currentUser: User,
): Promise<{ lead: Lead; isNew: boolean }> {
  let normalizedPhone: string | null = null;
  let isInternational = false;
  if (input.phone) {
    const phoneResult = normalizePhone(input.phone);
    if (!phoneResult) throw new BadRequestError("Invalid phone number");
    normalizedPhone = phoneResult.e164;
    isInternational = phoneResult.isInternational;
  }

  const normalizedWhatsapp = input.whatsappNumber
    ? normalizePhoneOrThrow(input.whatsappNumber, "WhatsApp number").e164
    : null;
  const normalizedAltPhone = input.altPhone
    ? normalizePhoneOrThrow(input.altPhone, "alternate phone number").e164
    : null;

  const normalizedEmail = input.email ? normalizeEmail(input.email) : null;

  const phoneBlindIndex = normalizedPhone
    ? computeBlindIndex(normalizedPhone)
    : null;
  const emailBlindIndex = normalizedEmail
    ? computeBlindIndex(normalizedEmail)
    : null;

  const existingLead = await findExistingLeadByContactHash(
    phoneBlindIndex,
    emailBlindIndex,
  );
  if (existingLead) {
    return {
      lead: await processReturningLeadEnquiry(existingLead, currentUser, input),
      isNew: false,
    };
  }

  const now = new Date();
  const newLead = leadRepository().create({
    name: input.name,
    phoneEnc: encryptPersonalData(normalizedPhone),
    phoneHash: computeBlindIndex(normalizedPhone),
    altPhoneEnc: encryptPersonalData(normalizedAltPhone),
    altPhoneHash: computeBlindIndex(normalizedAltPhone),
    whatsappNumberEnc: encryptPersonalData(normalizedWhatsapp),
    whatsappHash: computeBlindIndex(normalizedWhatsapp),
    emailEnc: encryptPersonalData(normalizedEmail),
    emailHash: computeBlindIndex(normalizedEmail),
    city: input.city,
    state: input.state,
    country: input.country ?? "India",
    area: input.area,
    pincode: input.pincode,
    addressEnc: encryptPersonalData(input.address),
    treatment: input.treatment,
    dentalProblemEnc: encryptPersonalData(input.dentalProblem),
    messageEnc: encryptPersonalData(input.message),
    budget: input.budget,
    preferredDate: input.preferredDate,
    preferredTime: input.preferredTime,
    channel: input.channel ?? LeadChannel.MANUAL,
    source: input.source,
    campaign: input.campaign,
    adId: input.adId,
    adName: input.adName,
    tags: input.tags,
    isInternational: normalizedPhone
      ? isInternational
      : Boolean(normalizedEmail),
    stage: LeadStage.NEW,
    ownerUserId: currentUser.id,
    assignedAt: now,
    encKeyVersion: currentEncryptionKeyVersion,
    firstActivityAt: now,
    lastActivityAt: now,
    createdByUserId: currentUser.id,
    updatedByUserId: currentUser.id,
  });

  try {
    const savedLead = await leadRepository().save(newLead);
    await recordLeadActivity(
      savedLead.id,
      currentUser.id,
      ActivityType.LEAD_CREATED,
      { subject: `Lead created via ${savedLead.channel}` },
    );
    return { lead: savedLead, isNew: true };
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      const racedLead = await findExistingLeadByContactHash(
        phoneBlindIndex,
        emailBlindIndex,
      );
      if (racedLead) {
        return {
          lead: await processReturningLeadEnquiry(
            racedLead,
            currentUser,
            input,
          ),
          isNew: false,
        };
      }
    }
    throw error;
  }
}

export async function listLeads(
  currentUser: User,
  listParams: ListLeadsParams,
): Promise<{ items: Lead[]; total: number; page: number; pageSize: number }> {
  const filterConditions: Record<string, unknown> = {};
  if (listParams.stage) filterConditions.stage = listParams.stage;
  if (listParams.channel) filterConditions.channel = listParams.channel;
  if (typeof listParams.isInternational === "boolean") {
    filterConditions.isInternational = listParams.isInternational;
  }
  if (listParams.q) filterConditions.name = ILike(`%${listParams.q}%`);

  if (hasManagerRole(currentUser)) {
    if (listParams.ownerUserId)
      filterConditions.ownerUserId = listParams.ownerUserId;
  } else {
    filterConditions.ownerUserId = currentUser.id;
  }

  const paginationOffset = (listParams.page - 1) * listParams.pageSize;
  const [items, total] = await leadRepository().findAndCount({
    where: filterConditions,
    order: { createdAt: "DESC" },
    skip: paginationOffset,
    take: listParams.pageSize,
  });
  return {
    items,
    total,
    page: listParams.page,
    pageSize: listParams.pageSize,
  };
}

export async function getLeadById(
  leadId: number,
  currentUser: User,
): Promise<Lead> {
  const lead = await leadRepository().findOne({ where: { id: leadId } });
  if (
    !lead ||
    (!hasManagerRole(currentUser) && lead.ownerUserId !== currentUser.id)
  ) {
    throw new NotFoundError("Lead not found");
  }
  return lead;
}

export async function updateLead(
  leadId: number,
  currentUser: User,
  updateInput: UpdateLeadInput,
): Promise<Lead> {
  const lead = await getLeadById(leadId, currentUser);
  const pendingActivities: Array<{
    type: ActivityType;
    details: LeadActivityDetails;
  }> = [];

  if (updateInput.stage && updateInput.stage !== lead.stage) {
    pendingActivities.push({
      type: ActivityType.STATUS_CHANGE,
      details: { statusFrom: lead.stage, statusTo: updateInput.stage },
    });
    lead.stage = updateInput.stage;
  }

  if (
    updateInput.ownerUserId !== undefined &&
    updateInput.ownerUserId !== lead.ownerUserId
  ) {
    if (!hasManagerRole(currentUser) && lead.ownerUserId !== currentUser.id) {
      throw new ForbiddenError("You cannot reassign this lead");
    }
    const previousOwnerId = lead.ownerUserId;
    lead.ownerUserId = updateInput.ownerUserId;
    lead.assignedAt = updateInput.ownerUserId ? new Date() : null;
    pendingActivities.push({
      type: ActivityType.ASSIGNMENT,
      details: {
        subject: `Owner changed from ${previousOwnerId ?? "unassigned"} to ${updateInput.ownerUserId ?? "unassigned"}`,
      },
    });
  }

  if (updateInput.tags !== undefined) lead.tags = updateInput.tags;
  if (updateInput.isCalled !== undefined) lead.isCalled = updateInput.isCalled;
  if (updateInput.isWhatsappCalled !== undefined)
    lead.isWhatsappCalled = updateInput.isWhatsappCalled;
  if (updateInput.isWhatsappMessaged !== undefined)
    lead.isWhatsappMessaged = updateInput.isWhatsappMessaged;
  if (updateInput.isEmailed !== undefined)
    lead.isEmailed = updateInput.isEmailed;
  if (updateInput.contactMade !== undefined)
    lead.contactMade = updateInput.contactMade;
  if (updateInput.doNotCall !== undefined)
    lead.doNotCall = updateInput.doNotCall;
  if (updateInput.doNotSms !== undefined) lead.doNotSms = updateInput.doNotSms;
  if (updateInput.doNotEmail !== undefined)
    lead.doNotEmail = updateInput.doNotEmail;
  if (updateInput.doNotWhatsapp !== undefined)
    lead.doNotWhatsapp = updateInput.doNotWhatsapp;
  if (updateInput.followUpDate !== undefined) {
    lead.followUpDate = parseOptionalDate(
      updateInput.followUpDate,
      "followUpDate",
    );
  }

  lead.updatedByUserId = currentUser.id;
  lead.lastActivityAt = new Date();
  const savedLead = await leadRepository().save(lead);

  for (const activity of pendingActivities) {
    await recordLeadActivity(
      savedLead.id,
      currentUser.id,
      activity.type,
      activity.details,
    );
  }
  return savedLead;
}
