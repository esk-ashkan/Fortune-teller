import { useMemo, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useTranslation } from "react-i18next";
import { getStoredLang } from "../lib/lang";
import { iranCities } from "../../iran_cities";


const API = "https://fortune-teller-nhy4.onrender.com";

export interface Cities {
  name: string;
  latitude: string;
  longitude: string;
  altitude?: number;
}

type City = {
  name: string;
  latitude: string | number;
  longitude: string | number;
  province?: string;
  state?: string;
  altitude?: number;
};

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
  return { status: "error" as const };
}

export default function Stars() {
  const { t } = useTranslation();
  const dir = getStoredLang() === "fa" ? "rtl" : "ltr";
  const navigate = useNavigate();
  const location = useLocation();
  const tgid = location.state?.tgid || localStorage.getItem("tgid") || null;

  const [province, setProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);
  const [result, setResult] = useState<{
    interpretation?: string;
    sky_facts?: Record<string, unknown>;
    sun_sign?: string;
    sun_sign_fa?: string;
  } | null>(null);

  const [birthDate, setBirthDate] = useState("");
  const [sunSignFa, setSunSignFa] = useState<string | null>(null);
  const [birthMsg, setBirthMsg] = useState("");

  const provinces = useMemo(
    () => iranCities.map((p) => p.name).sort((a, b) => a.localeCompare(b, "fa")),
    []
  );

const cities = useMemo(() => {
  if (!province) return [] as City[];
  const found = iranCities.find((p) => p.name === province);
  return found?.cities ?? [];
}, [province]);

  const canSubmit = !!selectedCity && !loading;

  const saveBirth = async () => {
    if (!tgid) {
      setBirthMsg(t("stars.birthNeedLogin"));
      return;
    }
    if (!birthDate) {
      setBirthMsg(t("stars.birthNeedDate"));
      return;
    }
    try {
      const res = await axios.post(`${API}/profile/birth`, {
        tgid: Number(tgid),
        birth_date: birthDate,
      });
      setSunSignFa(res.data.sun_sign_fa || res.data.sun_sign || null);
      setBirthMsg(t("stars.birthSaved"));
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || t("stars.birthError");
      setBirthMsg(msg);
    }
  };

  const handleReceive = async () => {
    if (!selectedCity) return;

    setLoading(true);
    setError("");
    setDenied(false);
    setResult(null);

    if (!tgid) {
      setError(t("stars.noTgid"));
      setLoading(false);
      return;
    }

    const access = await checkAccess("stars", tgid);
    if (access.status === "error") {
      setError(t("common.serverError"));
      setLoading(false);
      return;
    }
    if (access.status === "denied") {
      setDenied(true);
      setError(t("stars.denied"));
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/stars`, {
        params: {
          lat: selectedCity.latitude,
          long: selectedCity.longitude,
          city: selectedCity.name,
          tgid,
          lang: getStoredLang(),
        },
        timeout: 60000,
      });
      setResult(response.data);
      if (response.data.sun_sign_fa) {
        setSunSignFa(response.data.sun_sign_fa);
      } else if (response.data.sun_sign) {
        setSunSignFa(response.data.sun_sign);
      }
    } catch (err: unknown) {
      console.error(err);
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || t("stars.fetchError");
      if (status === 403) {
        setDenied(true);
        setError(t("stars.denied"));
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stars-page" dir={dir} style={{ padding: "1rem" }}>
      <div className="mb-2" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
        <IoIosArrowRoundBack size={28} />
      </div>

      <h1 className="mb-2">{t("stars.title")}</h1>
      <p className="text-muted mb-3">{t("stars.subtitle")}</p>

      <div className="mb-3 p-3 border rounded">
        <label className="form-label">{t("stars.birthLabel")}</label>
        <input
          type="date"
          className="form-control mb-2"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
        <Button
          type="button"
          variant="outline-primary"
          className="w-100"
          onClick={saveBirth}
        >
          {t("stars.saveBirth")}
        </Button>
        {sunSignFa && (
          <p className="mt-2 mb-0">
            {t("stars.yourSign")}: <b>{sunSignFa}</b>
          </p>
        )}
        {birthMsg && <p className="mt-2 mb-0 text-muted">{birthMsg}</p>}
      </div>

      <Form.Group className="mb-3">
        <Form.Label>{t("stars.selectProvince")}</Form.Label>
        <Form.Select
          value={province}
          onChange={(e) => {
            setProvince(e.target.value);
            setSelectedCity(null);
          }}
        >
          <option value="">{t("stars.selectProvince")}</option>
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>{t("stars.selectCity")}</Form.Label>
        <Form.Select
          value={selectedCity?.name || ""}
          disabled={!province}
          onChange={(e) => {
            const city = cities.find((c) => c.name === e.target.value) || null;
            setSelectedCity(city);
          }}
        >
          <option value="">{t("stars.selectCity")}</option>
          {cities.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Button
        className="w-100 mb-3"
        onClick={handleReceive}
        disabled={!canSubmit}
      >
        {loading ? t("stars.loading") : t("stars.submit")}
      </Button>

      {error && (
        <div className="alert alert-danger">
          {error}
          {denied && (
            <div className="mt-2">
              <Button
                size="sm"
                variant="warning"
                onClick={() => navigate("/payments", { state: { tgid } })}
              >
                {t("common.buyPackage")}
              </Button>
            </div>
          )}
        </div>
      )}

      {result?.sky_facts && (
        <div className="mb-3 p-3 border rounded">
          <div>
            <b>{t("stars.city")}:</b> {String(result.sky_facts.city ?? "")}
          </div>
          <div>
            <b>{t("stars.sunrise")}:</b>{" "}
            {String(result.sky_facts.sunrise ?? "-")}
          </div>
          <div>
            <b>{t("stars.sunset")}:</b>{" "}
            {String(result.sky_facts.sunset ?? "-")}
          </div>
          <div>
            <b>{t("stars.moonPhase")}:</b>{" "}
            {String(result.sky_facts.moon_phase ?? "-")}
          </div>
          {(sunSignFa || result.sun_sign_fa) && (
            <div>
              <b>{t("stars.yourSign")}:</b>{" "}
              {sunSignFa || result.sun_sign_fa}
            </div>
          )}
        </div>
      )}

      {result?.interpretation && (
        <div className="p-3 border rounded">
          <h5>{t("stars.narrative")}</h5>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
            {result.interpretation}
          </p>
        </div>
      )}
    </div>
  );
}