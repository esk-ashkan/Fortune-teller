import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import { iranCities } from "../../iran_cities";
import { useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { IoIosArrowRoundBack } from "react-icons/io";

const API = "https://fortune-teller-nhy4.onrender.com";

export interface Cities {
  name: string;
  latitude: string;
  longitude: string;
  altitude: number;
}

export default function Stars() {
  const navigate = useNavigate();
  const location = useLocation();
  const tgid = location.state?.tgid || localStorage.getItem("tgid");

  const [cities, setCities] = useState<Cities[]>([]);
  const [selectedCity, setSelectedCity] = useState<Cities | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    interpretation?: string;
    sky_facts?: Record<string, unknown>;
  } | null>(null);

  const canSubmit = useMemo(() => !!selectedCity && !loading, [selectedCity, loading]);

  const handleSelectProvince = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const province = iranCities.find((p) => p.name === e.target.value);
    setCities(province?.cities || []);
    setSelectedCity(null);
    setResult(null);
  };

  const handleSelectCity = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = cities.find((c) => c.name === e.target.value) || null;
    setSelectedCity(city);
    setResult(null);
  };

  const handleCoordFinder = () => {
    if (!navigator.geolocation) {
      alert("مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSelectedCity({
          name: "موقعیت فعلی من",
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
          altitude: Math.round(position.coords.altitude ?? 0),
        });
        setResult(null);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) alert("دسترسی به موقعیت مکانی رد شد.");
        else alert("دریافت موقعیت ممکن نشد.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleReceive = async () => {
    if (!selectedCity) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.get(`${API}/stars`, {
        params: {
          lat: selectedCity.latitude,
          long: selectedCity.longitude,
          city: selectedCity.name,
          tgid: tgid || undefined,
        },
        timeout: 60000,
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "خطا در دریافت طالع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3" style={{ maxWidth: 480, margin: "0 auto" }}>
      <IoIosArrowRoundBack size={28} onClick={() => navigate("/")} style={{ cursor: "pointer" }} />

      <h2 className="mt-2 mb-3">✨ آسمان همین حالا</h2>
      <p className="text-muted">موقعیتت را بده تا وضعیت آسمان و یک روایت کوتاه برایت ساخته شود.</p>

      <Button onClick={handleCoordFinder} className="mb-3 w-100">
        یافتن خودکار موقعیت من
      </Button>

      <Form.Select onChange={handleSelectProvince} className="mb-2">
        <option>استان را انتخاب کنید</option>
        {iranCities.map((ic) => (
          <option value={ic.name} key={ic.name}>{ic.name}</option>
        ))}
      </Form.Select>

      {cities.length > 0 && (
        <Form.Select onChange={handleSelectCity} className="mb-3">
          <option>شهر را انتخاب کنید</option>
          {cities.map((ct) => (
            <option value={ct.name} key={ct.name}>{ct.name}</option>
          ))}
        </Form.Select>
      )}

      {selectedCity && (
        <Stack direction="horizontal" gap={2} className="mb-3">
          <Form.Control value={selectedCity.latitude} disabled readOnly />
          <Form.Control value={selectedCity.longitude} disabled readOnly />
        </Stack>
      )}

      <Button onClick={handleReceive} disabled={!canSubmit} className="w-100 mb-3">
        {loading ? "در حال خواندن آسمان..." : "دریافت طالع من"}
      </Button>

      {error && <div className="alert alert-danger">{error}</div>}

      {result?.sky_facts && (
        <div className="mb-3 p-3 border rounded">
          <div><b>شهر:</b> {String(result.sky_facts.city ?? "")}</div>
          <div><b>طلوع خورشید:</b> {String(result.sky_facts.sunrise ?? "-")}</div>
          <div><b>غروب خورشید:</b> {String(result.sky_facts.sunset ?? "-")}</div>
          <div><b>فاز ماه:</b> {String(result.sky_facts.moon_phase ?? "-")}</div>
        </div>
      )}

      {result?.interpretation && (
        <div className="p-3 border rounded">
          <h5>روایت آسمان</h5>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{result.interpretation}</p>
        </div>
      )}
    </div>
  );
}