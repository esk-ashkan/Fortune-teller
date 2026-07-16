import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import { iranCities } from "../../iran_cities";
import { useState } from "react";
import axios from "axios";

export interface Cities {
  name: string;
  latitude: string;
  longitude: string;
  altitude: number;
}

export default function Stars() {
  const [cities, setCities] = useState<Cities[]>([]);
  const [selectedCity, setSelectedCity] = useState<Cities | null>(null);

  const handleSelectProvince = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceName = e.target.value;
    const province = iranCities.find((p) => p.name === provinceName);

    if (province) {
      setCities(province.cities);
      setSelectedCity(null);
    }
  };

  const handleSelectCity = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityName = e.target.value;
    const city = cities.find((c) => c.name === cityName);
    setSelectedCity(city || null);
  };
  const handleRecieveHoroscopy = async () => {
    type ApiError = {
      message: string;
      code: number;
    };

    try {
      const response = await axios.get("http://127.0.0.1:5000/stars", {
        params: {
          lat: selectedCity?.latitude,
          long: selectedCity?.longitude,
        },
      });
      console.log("Horoscope:", response.data);
    } catch (error) {
      if (axios.isAxiosError<ApiError>(error)) {
        console.error("API Error:", error.response?.data.message);
        console.error("Status:", error.response?.status);
      } else {
        console.error("Unexpected Error:", error);
        throw error;
      }
    }
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
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
          altitude: parseInt(String(position.coords.altitude ?? 0), 10),
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("دسترسی به موقعیت مکانی رد شد.");
            break;

          case error.POSITION_UNAVAILABLE:
            alert("امکان دریافت موقعیت وجود ندارد.");
            break;

          case error.TIMEOUT:
            alert("دریافت موقعیت بیش از حد طول کشید.");
            break;

          default:
            alert("خطای ناشناخته در دریافت موقعیت.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <>
      <Button onClick={handleCoordFinder} className="mb-3">
        یافتن خودکار مختصات جغرافیایی من
      </Button>

      <Form.Select onChange={handleSelectProvince}>
        <option>استان را انتخاب کنید</option>
        {iranCities.map((ic) => (
          <option value={ic.name} key={ic.name}>
            {ic.name}
          </option>
        ))}
      </Form.Select>

      {cities.length > 0 && (
        <Form.Select onChange={handleSelectCity} className="mt-3">
          <option>شهر را انتخاب کنید</option>
          {cities.map((ct) => (
            <option value={ct.name} key={ct.name}>
              {ct.name}
            </option>
          ))}
        </Form.Select>
      )}

      {selectedCity && (
        <Stack direction="horizontal" gap={3} className="mt-3">
          <Form.Control
            type="text"
            aria-label="latitude"
            value={selectedCity.latitude}
            disabled
            readOnly
          />
          <Form.Control
            type="text"
            aria-label="longitude"
            value={selectedCity.longitude}
            disabled
            readOnly
          />
        </Stack>
      )}
      <Button onClick={handleRecieveHoroscopy} className="mb-3">
        دریافت طالع من
      </Button>
    </>
  );
}
