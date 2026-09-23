import { Tabs } from "@heroui/react";
import { MdOutlineCalendarMonth } from "react-icons/md";
import { SiCoffeescript } from "react-icons/si";
import { TbPlayCardStar } from "react-icons/tb";
import { GiFeather } from "react-icons/gi";
import { PackageCard } from "./card";
import "./payments.css";

export function Payments() {
  return (
    <div className="payments-page">
      {/* Decorative background elements */}
      <div className="payments-bg-glow" aria-hidden="true" />
      <div className="payments-bg-orb payments-bg-orb--1" aria-hidden="true" />
      <div className="payments-bg-orb payments-bg-orb--2" aria-hidden="true" />

      <div className="payments-content">
        <header className="payments-header">
          <span className="payments-badge">✨ ویژه</span>
          <h1 className="payments-title">انتخاب پکیج</h1>
          <p className="payments-subtitle">
            بهترین تجربه فال را با پکیج‌های ویژه تجربه کنید
          </p>
        </header>

        <Tabs className="payments-tabs" align="center" defaultSelectedKey="intervallic">
          <Tabs.ListContainer className="payments-tabs-list-container">
            <Tabs.List aria-label="نوع پکیج" className="payments-tabs-list">
              <Tabs.Tab id="intervallic">
                پکیج دوره‌ای
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="aimful">
                پکیج خاص
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          <Tabs.Panel className="payments-panel" id="intervallic">
            <div className="payments-cards">
              <PackageCard
                icon={<MdOutlineCalendarMonth />}
                title="۱ ماهه"
                description="۴۹۹,۹۹۹ تومان"
                maindescription="روزانه ۱ فال حافظ و ۱ فال تاروت"
                link="/pay/1month"
                buttonText="پرداخت"
              />
              <PackageCard
                icon={<MdOutlineCalendarMonth />}
                title="۳ ماهه"
                description="۹۹۹,۰۰۰ تومان"
                maindescription="روزانه ۱ فال حافظ، ۱ فال تاروت و هفته‌ای ۱ فال قهوه"
                link="/pay/3month"
                buttonText="پرداخت"
              />
              <PackageCard
                icon={<MdOutlineCalendarMonth />}
                title="۱ ساله"
                description="۱,۷۹۹,۰۰۰ تومان"
                maindescription="روزانه ۱ فال حافظ، ۱ فال تاروت و ۱ فال قهوه"
                link="/pay/1year"
                buttonText="پرداخت"
              />
            </div>
          </Tabs.Panel>

          <Tabs.Panel className="payments-panel" id="aimful">
            <div className="payments-cards">
                <PackageCard
                    icon={<GiFeather />}
                    title="۲۰ درخواست حافظ"
                    description="۴۹۹,۰۰۰ تومان"
                    maindescription="پکیج ۲۰ تایی فال حافظ، فعال تا ۴۰ روز پس از فعال‌سازی"
                    link="/pay/hafez20"
                    buttonText="پرداخت"
                />
                <PackageCard
                    icon={<SiCoffeescript />}
                    title="۲۰ درخواست قهوه"
                    description="۱,۷۹۹,۰۰۰ تومان"
                    maindescription="پکیج ۲۰ تایی فال قهوه، فعال تا ۴۰ روز پس از فعال‌سازی"
                    link="/pay/coffee20"
                    buttonText="پرداخت"
                />
                <PackageCard
                    icon={<TbPlayCardStar />}
                    title="۲۰ درخواست تاروت"
                    description="۹۹۹,۰۰۰ تومان"
                    maindescription="پکیج ۲۰ تایی فال تاروت، فعال تا ۴۰ روز پس از فعال‌سازی"
                    link="/pay/tarot20"
                    buttonText="پرداخت"
                />
            </div>
        </Tabs.Panel>
        </Tabs>
      </div>
    </div>
  );
}