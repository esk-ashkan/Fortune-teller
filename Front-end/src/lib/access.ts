import axios from "axios";

export const API = "https://fortune-teller-nhy4.onrender.com";

export type AccessStatus = "idle" | "checking" | "allowed" | "denied" | "error";

export function getTgid(stateTgid?: unknown): string | null {
  if (stateTgid != null && stateTgid !== "") return String(stateTgid);
  return localStorage.getItem("tgid");
}

export async function checkAccess(
  model: "hafez" | "tarot" | "coffee" | "stars",
  tgid: string | number,
  tries = 3
): Promise<
  | { status: "allowed" | "denied"; credit?: number }
  | { status: "error"; message: string }
> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await axios.get(`${API}/check`, {
        params: { model, tgid },
        timeout: 60000,
      });
      if (res.data?.can_use) {
        return { status: "allowed", credit: res.data.credit };
      }
      return { status: "denied", credit: res.data.credit };
    } catch {
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }

  return {
    status: "error",
    message: "سرور پاسخ نداد. لطفاً دوباره تلاش کنید.",
  };
}