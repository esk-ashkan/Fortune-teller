export type AppLang = "fa" | "en";

export function getStoredLang(): AppLang {
  const v = localStorage.getItem("app_lang");
  return v === "en" ? "en" : "fa";
}

export function setStoredLang(lang: AppLang) {
  localStorage.setItem("app_lang", lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
}

export function detectTelegramLang(): AppLang {
  try {
    const code =
      (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.language_code ||
      "";
    return String(code).toLowerCase().startsWith("fa") ? "fa" : "en";
  } catch {
    return "fa";
  }
}