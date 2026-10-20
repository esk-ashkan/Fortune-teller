import { useState } from "react";
import Form from "react-bootstrap/Form";
import { Button } from "react-bootstrap";
import axios from "axios";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate, useLocation } from "react-router-dom";
import "./Coffee.css";

const API = "https://fortune-teller-nhy4.onrender.com";
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

async function checkAccess(model: string, tgid: string | number, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await axios.get(`${API}/check`, {
        params: { model, tgid },
        timeout: 60000,
      });
      if (res.data?.can_use) return { status: "allowed" as const };
      return { status: "denied" as const };
    } catch {
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  return {
    status: "error" as const,
    message: "سرور پاسخ نداد. لطفاً دوباره تلاش کنید.",
  };
}

export default function Coffee() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fortuneText, setFortuneText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isDenied, setIsDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusLine, setStatusLine] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const tgid =
    location.state?.tgid || localStorage.getItem("tgid") || null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (!ALLOWED.includes(file.type)) {
      alert("فقط فرمت‌های jpg، png یا webp مجاز است.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_BYTES) {
      alert("حجم تصویر باید کمتر از ۳ مگابایت باشد.");
      e.target.value = "";
      return;
    }

    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
    setFortuneText("");
    setErrorText("");
    setIsDenied(false);
    setStatusLine("");
  };

  const handleSendImage = async () => {
    if (!selectedImage) return;

    if (!tgid) {
      setIsDenied(false);
      setErrorText("شناسه کاربر یافت نشد. لطفاً از صفحه اصلی / ربات وارد شوید.");
      return;
    }

    const formData = new FormData();
    formData.append("images", selectedImage);
    formData.append("images_name", `coffee_${Date.now()}`);
    formData.append("tgid", String(tgid));

    setIsLoading(true);
    setErrorText("");
    setIsDenied(false);
    setFortuneText("");
    setStatusLine("در حال بررسی اعتبار...");

    try {
      const access = await checkAccess("coffee", tgid);

      if (access.status === "error") {
        setErrorText(access.message);
        setStatusLine("");
        return;
      }

      if (access.status === "denied") {
        setIsDenied(true);
        setErrorText("سهمیه یا اعتبار فال قهوه شما کافی نیست.");
        setStatusLine("");
        return;
      }

      setStatusLine("در حال بررسی تصویر و گرفتن فال...");

      const response = await axios.post(`${API}/coffee`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });

      setFortuneText(response.data.interpretation || "");
      setStatusLine("");
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        "خطا در ارتباط با سرور یا نامعتبر بودن تصویر";
      setIsDenied(false);
      setErrorText(msg);
      setStatusLine("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="persian-container">
      <div className="return-wrapper mb-2">
        <IoIosArrowRoundBack
          className="coffee-back-icon"
          onClick={() => navigate("/")}
        />
      </div>

      <div className="header-decoration">
        <div className="ornament">✦</div>
        <h1 className="persian-title">☕ فال قهوه</h1>
        <div className="ornament">✦</div>
      </div>

      <div className="divider">
        <span className="divider-text">✦ ✦ ✦</span>
      </div>

      <div className="fortune-card">
        <p className="persian-hint mb-3">
          لطفاً یک عکس واضح از <b>کف فنجان قهوه از بالا</b> بفرستید.
        </p>

        <Form.Group controlId="formFile" className="mb-4">
          <Form.Label className="persian-label">
            <span className="label-icon">🖼</span>
            یک تصویر انتخاب کنید
          </Form.Label>

          <div className="upload-zone">
            <Form.Control
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="persian-file-input"
              id="fileInput"
              disabled={isLoading}
            />
            <label htmlFor="fileInput" className="upload-label">
              <span className="upload-icon">📤</span>
              <span>برای انتخاب فایل کلیک کنید</span>
              <span className="upload-hint">(jpg, png, webp — حداکثر ۳MB)</span>
            </label>
          </div>

          {preview && (
            <div className="selected-files mt-3">
              <img
                src={preview}
                alt="preview"
                style={{
                  width: "100%",
                  maxHeight: 240,
                  objectFit: "cover",
                  borderRadius: 12,
                }}
              />
              <div className="file-name mt-2">{selectedImage?.name}</div>
            </div>
          )}
        </Form.Group>

        <Button
          variant="dark"
          onClick={handleSendImage}
          disabled={!selectedImage || isLoading}
          className="persian-submit-btn"
        >
          {isLoading ? (
            <span className="loading-spinner">
              <span className="spinner"></span>
              {statusLine || "در حال پردازش..."}
            </span>
          ) : (
            <span>🔮 دریافت فال</span>
          )}
        </Button>
      </div>

      {errorText && (
        <div className="fortune-result" style={{ borderColor: "#ef4444" }}>
          <p className="fortune-text">{errorText}</p>
          {isDenied && (
            <Button
              variant="warning"
              className="mt-2"
              onClick={() => navigate("/payments", { state: { tgid } })}
            >
              خرید پکیج
            </Button>
          )}
        </div>
      )}

      {fortuneText && (
        <div className="fortune-result">
          <div className="fortune-header">
            <span className="fortune-icon">☕</span>
            <h2 className="fortune-title">فال شما</h2>
          </div>
          <div className="fortune-content">
            <p className="fortune-text">{fortuneText}</p>
          </div>
        </div>
      )}
    </div>
  );
}