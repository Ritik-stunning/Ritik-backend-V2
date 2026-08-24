import { AppDataSource } from "../data-source";
import { Lead } from "../entities/Lead";

export const getLeadRepository = () => AppDataSource.getRepository(Lead);
