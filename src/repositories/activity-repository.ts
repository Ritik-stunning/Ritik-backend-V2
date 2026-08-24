import { AppDataSource } from "../data-source";
import { Activity } from "../entities/Activity";

export const getActivityRepository = () =>
  AppDataSource.getRepository(Activity);
