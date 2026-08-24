import { authed } from "../utils/authed";
import * as tokenService from "../services/token-service";

export const logout = authed(async (user, req, res) => {
  const { refreshToken }: { refreshToken?: string } = req.body;
  if (refreshToken) {
    await tokenService.revokeSession(user.id, refreshToken);
  } else {
    await tokenService.revokeAllSessions(user.id);
  }
  res.json({ message: "Logged out" });
});
