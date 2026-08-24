import { Request, Response } from "express";
import * as otpService from "../services/otp-service";

export async function createOtp(req: Request, res: Response) {
  const { email } = req.body as { email: string };
  const result = await otpService.createOtp(email);
  res.status(200).json(result);
}

export async function verifyOtp(req: Request, res: Response) {
  const { email, otp } = req.body as { email: string; otp: string };
  const result = await otpService.verifyOtp(email, otp);
  res.status(200).json(result);
}
