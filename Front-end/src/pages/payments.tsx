import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { IoIosArrowRoundBack } from "react-icons/io";

const API = "https://fortune-teller-nhy4.onrender.com";

type Package = {
  id: string;
  title: string;
  description: string;
  amount_rial: number;
  amount_toman: number;
  grant: Record<string, number>;
};

export default function PaymentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const tgid = location.state?.tgid || localStorage.getItem("tgid");

  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [lastInvoiceId, setLastInvoiceId] = useState<number | null>(null);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    axios
      .get(`${API}/payments/packages`)
      .then((res) => setPackages(res.data.packages || []))
      .catch(() => setError("خطا در دریافت لیست پکیج‌ها"));
  }, []);

  const buy = async (packageId: string) => {
    if (!tgid) {
      setError("ابتدا از طریق ربات وارد شوید.");
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
        // Telegram Mini App: open external payment page
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.openLink) {
          tg.openLink(link);
        } else {
          window.open(link, "_blank");
        }
        setStatusText(
          `فاکتور ساخته شد. مبلغ نهایی را دقیق واریز کنید. شماره فاکتور: ${invoiceId}`
        );
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.response?.data?.error || "خطا در ایجاد فاکتور");
    } finally {
      setLoadingId(null);
    }
  };

  const checkStatus = async () => {
    if (!lastInvoiceId) return;
    try {
      const res = await axios.get(`${API}/payments/status/${lastInvoiceId}`);
      if (res.data.status === "PAID") {
        setStatusText(
          `پرداخت موفق ✅ اعتبار: ${res.data.credit} | حافظ: ${res.data.remained_hafez} | تاروت: ${res.data.remained_tarot} | قهوه: ${res.data.remained_coffee}`
        );
      } else {
        setStatusText(`وضعیت فعلی: ${res.data.status}`);
      }
    } catch {
      setStatusText("خطا در بررسی وضعیت");
    }
  };

  return (
    <div className="p-3" style={{ maxWidth: 480, margin: "0 auto" }}>
      <IoIosArrowRoundBack
        size={28}
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/")}
      />
      <h2 className="mt-2">💳 خرید پکیج</h2>
      <p className="text-muted">پس از پرداخت، سهمیه به‌صورت خودکار اضافه می‌شود.</p>

      {error && <div className="alert alert-danger">{error}</div>}
      {statusText && <div className="alert alert-info">{statusText}</div>}

      {packages.map((p) => (
        <div key={p.id} className="border rounded p-3 mb-3">
          <h5 className="mb-1">{p.title}</h5>
          <p className="mb-2 text-muted">{p.description}</p>
          <div className="fw-bold mb-2">
            {p.amount_toman.toLocaleString("fa-IR")} تومان
          </div>
          <button
            className="btn btn-primary w-100"
            disabled={!!loadingId}
            onClick={() => buy(p.id)}
          >
            {loadingId === p.id ? "در حال ایجاد فاکتور..." : "پرداخت"}
          </button>
        </div>
      ))}

      {lastInvoiceId && (
        <button className="btn btn-outline-secondary w-100" onClick={checkStatus}>
          بررسی وضعیت پرداخت
        </button>
      )}
    </div>
  );
}