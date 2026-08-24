import { AppDataSource } from "../data-source";
import { Session } from "../entities/Session";

export const getSessionRepository = () => AppDataSource.getRepository(Session);
