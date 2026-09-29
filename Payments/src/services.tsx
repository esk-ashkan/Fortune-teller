import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { PackageCard } from "./card";
import logarithmImg from "./assets/logarithm.png";
import trendImg from "./assets/trend.png";
import "./services.css";
import BackButton from "./BackButton";

interface Service {
  icon: ReactNode;
  title: string;
  description: string;
  person: string;
  price: string;
}

const statisticServices: Service[] = [
  {
    icon: <img src={logarithmImg} alt="Mathematics" className="rc-icon-img" />,
    title: "ریسک‌سنجی سبد سهام شما",
    description:
      "کل پورتفولیوی شما را می‌سنجیم؛ ترکیب دارایی‌ها، همبستگی بین سهم‌ها و میزان نوسان‌پذیری آن را تحلیل می‌کنیم و مسیر بهینه‌سازی سبد را پیش پای شما می‌گذاریم.",
    person: "دکتر شاه‌پرویزی",
    price: "14,999,000ریال",
  },
  {
    icon: <img src={logarithmImg} alt="Mathematics" className="rc-icon-img" />,
    title: "ریسک‌سنجی چند سهم",
    description:
      "چند سهم مشخص را که در نظر دارید، از منظر ریسک و بازده انتظاری با هم مقایسه می‌کنیم تا بدانید کدام ترکیب، تعادل بهتری به سبد شما می‌دهد.",
    person: "دکتر شاه‌پرویزی",
    price: "9,999,000ریال",
  },
  {
    icon: <img src={logarithmImg} alt="Mathematics" className="rc-icon-img" />,
    title: "ریسک‌سنجی تک سهم",
    description:
      "تمرکز روی یک سهم؛ ریسک اختصاصی، حساسیت آن به بازار و بازده انتظاری‌اش را با مدل‌های آماری برآورد می‌کنیم تا با دید باز تصمیم بگیرید.",
    person: "دکتر شاه‌پرویزی",
    price: "4,999,000ریال",
  },
];

const technicalServices: Service[] = [
  {
    icon: <img src={trendImg} alt="Finance" className="rc-icon-img" />,
    title: "تحلیل تکنیکال پورتفولیوی شما",
    description:
      "تک‌تک دارایی‌های سبد شما را روی نمودار بررسی می‌کنیم؛ نقاط ورود و خروج، سطوح کلیدی و روند هر سهم را کنار هم می‌گذاریم تا تصویر کاملی از وضعیت فعلی پورتفولیو داشته باشید.",
    person: "مهندس اسکندری",
    price: "14,999,000ریال",
  },
  {
    icon: <img src={trendImg} alt="Finance" className="rc-icon-img" />,
    title: "تحلیل تکنیکال بازار",
    description:
      "نگاهی از بالا به بازار؛ روند شاخص‌های اصلی و صندوق‌های منتخب را تحلیل می‌کنیم تا بدانید کلیت بازار در چه وضعیتی است و در چه نواحی احتمال برگشت یا ادامه روند وجود دارد.",
    person: "مهندس اسکندری",
    price: "9,999,000ریال",
  },
  {
    icon: <img src={trendImg} alt="Finance" className="rc-icon-img" />,
    title: "تحلیل تکنیکال سهام",
    description:
      "تمرکز روی یک سهم مشخص؛ ساختار نمودار، الگوهای قیمتی و سطوح حمایت و مقاومت آن را دقیق بررسی می‌کنیم تا برای خرید، فروش یا نگهداری، با دید روشن‌تری تصمیم بگیرید.",
    person: "مهندس اسکندری",
    price: "4,999,000ریال",
  },
];

const ALL_SERVICES: Service[] = [...statisticServices, ...technicalServices];

function Services() {
  const location = useLocation();
  const consultant = (location.state as any)?.consultant;
  const selectedName: string | undefined = consultant?.name;

  const services = selectedName
    ? ALL_SERVICES.filter((s) => s.person === selectedName)
    : ALL_SERVICES;

  return (
    <div className="services-page">
        <BackButton />
      <h1 className="services-title">
        {selectedName ? `خدمات ${selectedName}` : "خدمات مشاوره"}
      </h1>

      <div className="services-grid">
        {services.map((service, i) => (
            <PackageCard
                key={i}
                icon={service.icon}
                title={service.title}
                description={service.price}
                maindescription={service.description}
                link="/receipt"
                buttonText="انتخاب و پرداخت"
                state={{
                receipt: {
                    serviceTitle: service.title,
                    serviceDescription: service.description,
                    price: service.price,
                    consultant: service.person,
                },
                }}
            />
        ))}
      </div>
    </div>
  );
}

export default Services;