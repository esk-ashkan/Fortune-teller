import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { Tab, Tabs } from "react-bootstrap";
import BackButton from "./BackButton";
import { useTranslation } from "react-i18next";
import "./payments.css";

const API = "https://fortune-teller-nhy4.onrender.com";

const BLUPAL_ENABLED = false;

type Package = {
  id: string;
  title: string;
  description: string;
  amount_rial: number;
  amount_toman: number;
  amount_stars?: number;
  grant: Record<string, number>;
  tab: "single" | "pack" | "period" | "credit" | string;
};

async function payWithStars(packageId: string, tgid: string | number) {
  const tg = (window as any).Telegram?.WebApp;

  const { data } = await axios.post(`${API}/payments/stars/create`, {
    tgid: Number(tgid),
    package_id: packageId,
  });

  const link = data?.invoice_link;
  if (!link) {
    throw new Error(data?.error || data?.message || "No invoice_link");
  }

  if (tg && typeof tg.openInvoice === "function") {
    return new Promise<"paid" | "cancelled" | "failed" | "pending">((resolve) => {
      tg.openInvoice(link, (status: string) => {
        resolve((status as any) || "failed");
      });
    });
  }

  if (tg && typeof tg.openTelegramLink === "function") {
    tg.openTelegramLink(link);
    return "pending" as const;
  }

  throw new Error("WebApp API missing. Open from the bot button inside Telegram.");
}

export default function PaymentsPage() {
  const location = useLocation();
  const tgid = location.state?.tgid || localStorage.getItem("tgid");
  const preselectId: string | undefined = location.state?.package_id;
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [lastInvoiceId, setLastInvoiceId] = useState<number | null>(null);
  const [statusText, setStatusText] = useState("");
  const [activeTab, setActiveTab] = useState("single");
  const { t, i18n } = useTranslation();

  const TAB_META = [
    { key: "single", title: t("payments.tabSingle") },
    { key: "pack", title: t("payments.tabPack") },
    { key: "period", title: t("payments.tabPeriod") },
    { key: "credit", title: t("payments.tabCredit") },
  ];

  useEffect(() => {
    document.documentElement.dir = i18n.language === "fa" ? "rtl" : "ltr";
  }, [i18n.language]);

  useEffect(() => {
    axios
      .get(`${API}/payments/packages`)
      .then((res) => {
        const list: Package[] = res.data.packages || [];
        setPackages(list);
        if (preselectId) {
          const found = list.find((p) => p.id === preselectId);
          if (found?.tab) setActiveTab(found.tab);
        }
      })
      .catch(() => setError(t("payments.listError")));
  }, [preselectId]);

  const byTab = useMemo(() => {
    const map: Record<string, Package[]> = {};
    for (const p of packages) {
      const t = p.tab || "pack";
      if (!map[t]) map[t] = [];
      map[t].push(p);
    }
    return map;
  }, [packages]);

  const buy = async (packageId: string) => {
    if (!BLUPAL_ENABLED) {
      setError(t("payments.rialDisabled"));
      return;
    }
    if (!tgid) {
      setError(t("payments.needLogin"));
      return;
    }
    setLoadingId(packageId);
    setError("");
    setStatusText("");
    try {
      const res = await axios.post(`${API}/payments/create`, {
        tgid: Number(tgid),
        package_id: packageId,
      });
      const link = res.data.payment_link;
      const invoiceId = res.data.invoice_id;
      setLastInvoiceId(invoiceId);
      if (link) {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.openLink) tg.openLink(link);
        else window.open(link, "_blank");
        setStatusText(
          `فاکتور ${invoiceId} ساخته شد. مبلغ نهایی را دقیق واریز کنید.`
        );
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "خطا در ایجاد فاکتور"
      );
    } finally {
      setLoadingId(null);
    }
  };

  const buyStars = async (packageId: string) => {
    if (!tgid) {
      setError(t("payments.needLogin"));
      return;
    }
    setLoadingId(packageId);
    setError("");
    setStatusText("");
    try {
      const status = await payWithStars(packageId, tgid);
      if (status === "paid") {
        sessionStorage.removeItem("profile_cache");
        setStatusText(t("payments.starsOk"));
      } else {
        setStatusText(t("payments.starsStatus", { status }));
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          t("payments.starsError")
      );
    } finally {
      setLoadingId(null);
    }
  };

  const checkStatus = async () => {
    if (!lastInvoiceId) return;
    try {
      const res = await axios.get(`${API}/payments/status/${lastInvoiceId}`);
      if (res.data.status === "PAID") {
        sessionStorage.removeItem("profile_cache");
        setStatusText(
          `پرداخت موفق ✅ | حافظ: ${res.data.remained_hafez} | تاروت: ${res.data.remained_tarot} | قهوه: ${res.data.remained_coffee}`
        );
      } else {
        setStatusText(`وضعیت: ${res.data.status}`);
      }
    } catch {
      setStatusText("خطا در بررسی وضعیت");
    }
  };

  const renderList = (list: Package[] = []) => {
    if (list.length === 0) {
      return <p className="pkg-empty">{t("payments.empty")}</p>
    }

    return list.map((p) => (
      <div
        key={p.id}
        className={`pay-pkg-card ${
          preselectId === p.id ? "pay-pkg-card--selected" : ""
        }`}
      >
        <h5 className="pay-pkg-title">{p.title}</h5>
        <p className="pay-pkg-desc">{p.description}</p>

        {typeof p.amount_stars === "number" && (
          <div className="pay-pkg-price">
            {p.amount_stars.toLocaleString("fa-IR")} <span>{t("payments.stars")} ⭐</span>
          </div>
        )}

        {BLUPAL_ENABLED && (
          <div className="pay-pkg-price">
            {p.amount_toman.toLocaleString("fa-IR")} <span>{t("payments.toman")}</span>
          </div>
        )}

        <div
          className="pay-pkg-actions"
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          {BLUPAL_ENABLED && (
            <button
              className="pay-btn"
              disabled={!!loadingId}
              onClick={() => buy(p.id)}
            >
              {loadingId === p.id ? t("payments.loading") : t("payments.payRial")}
            </button>
          )}

          <button
            className="pay-btn"
            disabled={!!loadingId}
            onClick={() => buyStars(p.id)}
          >
            {loadingId === p.id ? t("payments.loading") : t("payments.payStars")}
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className="payments-page">
      <BackButton to="/" />

      <div className="payments-content">
        <header className="payments-header">
          <h2 className="payments-title">{t("payments.title")}</h2>
          <p className="payments-subtitle">
            {BLUPAL_ENABLED ? t("payments.subtitleFull") : t("payments.subtitleStarsOnly")}
          </p>
        </header>

        {error && <div className="pay-alert pay-alert--error">{error}</div>}
        {statusText && (
          <div className="pay-alert pay-alert--info">{statusText}</div>
        )}

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => k && setActiveTab(k)}
          className="payments-tabs mb-4"
          justify
        >
          {TAB_META.map((t) => (
            <Tab eventKey={t.key} title={t.title} key={t.key}>
              <div className="payments-grid pt-3">{renderList(byTab[t.key])}</div>
            </Tab>
          ))}
        </Tabs>

        {BLUPAL_ENABLED && lastInvoiceId && (
          <button
            className="pay-btn pay-btn--outline mt-3"
            onClick={checkStatus}
          >
            بررسی وضعیت پرداخت
          </button>
        )}
      </div>
    </div>
  );
}