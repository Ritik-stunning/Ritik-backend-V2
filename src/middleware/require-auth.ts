import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../utils/app-error";
import { verifyAccessToken } from "../utils/jwt";
import { getUserRepository } from "../repositories/user-repository";

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next(new UnauthorizedError("Missing authorization header"));
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : authHeader.trim();

    if (!token) {
      return next(new UnauthorizedError("Missing access token"));
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return next(new UnauthorizedError("Invalid or expired access token"));
    }

    const userRepository = getUserRepository();
    const user = await userRepository.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      return next(new UnauthorizedError("User not found or inactive"));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
