import axios from "axios";

const API = "https://fortune-teller-nhy4.onrender.com";

export async function payWithStars(packageId: string, tgid: string | number) {
  const tg = (window as any).Telegram?.WebApp;

  const { data } = await axios.post(`${API}/payments/stars/create`, {
    tgid: Number(tgid),
    package_id: packageId,
  });

  const link = data?.invoice_link;
  if (!link) throw new Error(data?.error || "No invoice_link");

  if (tg && typeof tg.openInvoice === "function") {
    return new Promise((resolve) => {
      tg.openInvoice(link, (status: string) => resolve(status));
    });
  }

  if (tg && typeof tg.openTelegramLink === "function") {
    tg.openTelegramLink(link);
    return "pending";
  }

  throw new Error(
    "WebApp API missing. Open from the bot button on mobile Telegram."
  );
}