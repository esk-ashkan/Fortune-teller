import axios from "axios";

const API = "https://fortune-teller-nhy4.onrender.com";

export async function payWithStars(packageId: string, tgid: string | number) {
  const { data } = await axios.post(`${API}/payments/stars/create`, {
    tgid: Number(tgid),
    package_id: packageId,
  });
  if (!data?.invoice_link) {
    throw new Error(data?.error || "No invoice_link");
  }
  const tg = (window as any).Telegram?.WebApp;
  if (!tg?.openInvoice) {
    throw new Error("openInvoice only works inside Telegram");
  }
  return new Promise<"paid" | "cancelled" | "failed" | "pending">((resolve) => {
    tg.openInvoice(data.invoice_link, (status: string) => {
      resolve(status as "paid" | "cancelled" | "failed" | "pending");
    });
  });
}