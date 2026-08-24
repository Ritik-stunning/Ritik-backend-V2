import { AppDataSource } from "../data-source";
import { User } from "../entities/User";

export const getUserRepository = () => AppDataSource.getRepository(User);
