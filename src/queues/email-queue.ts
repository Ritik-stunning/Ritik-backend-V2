import { Queue } from "bullmq";
import { bullConnection } from "../config/redis";

export interface EmailJob {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const emailQueue = new Queue<EmailJob>("email", {
  connection: bullConnection,
});

export async function enqueueEmail(data: EmailJob): Promise<void> {
  await emailQueue.add("send", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
    removeOnFail: 100,
  });
}
