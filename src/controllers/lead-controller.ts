import * as leadService from "../services/lead-service";
import { toLeadDto } from "../dtos/lead-dto";
import { authed } from "../utils/authed";
import type {
  CaptureLeadInput,
  ListLeadsParams,
  UpdateLeadInput,
} from "../types/lead";

export const createLead = authed(async (user, req, res) => {
  const input: CaptureLeadInput = req.body;
  const result = await leadService.captureLead(input, user);
  res
    .status(result.isNew ? 201 : 200)
    .json({ isNew: result.isNew, lead: toLeadDto(result.lead) });
});

export const listLeads = authed(async (user, _req, res) => {
  const params: ListLeadsParams = res.locals.validated.query;
  const { items, total, page, pageSize } = await leadService.listLeads(
    user,
    params,
  );
  res.json({ items: items.map(toLeadDto), total, page, pageSize });
});

export const getLeadById = authed(async (user, _req, res) => {
  const { id }: { id: number } = res.locals.validated.params;
  const lead = await leadService.getLeadById(id, user);
  res.json({ lead: toLeadDto(lead) });
});

export const updateLead = authed(async (user, req, res) => {
  const { id }: { id: number } = res.locals.validated.params;
  const input: UpdateLeadInput = req.body;
  const lead = await leadService.updateLead(id, user, input);
  res.json({ lead: toLeadDto(lead) });
});
