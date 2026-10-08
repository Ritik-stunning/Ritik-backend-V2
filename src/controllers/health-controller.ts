import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { redis } from "../config/redis";

async function isDbUp(): Promise<boolean> {
  try {
    await AppDataSource.query("SELECT 1");  
    return true;
  } catch {
    return false;
  }
}

async function isRedisUp(): Promise<boolean> {
  try {
    return (await redis.ping()) === "PONG";
  } catch {
    return false;
  }
}

export async function healthCheck(_req: Request, res: Response) {
  const [db, cache] = await Promise.all([isDbUp(), isRedisUp()]);
  const healthy = db && cache;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    db: db ? "ok" : "down",
    redis: cache ? "ok" : "down",
  });
}
