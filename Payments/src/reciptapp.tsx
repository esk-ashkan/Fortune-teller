import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, CloseButton } from "@heroui/react";
import BackButton from "./BackButton";
import "./receipt.css";

interface ReceiptData {
  serviceTitle?: string;
  serviceDescription?: string;
  price?: string;
  consultant?: string;
}

interface ReceiptProps {
  title?: string;
  receipt?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export function ReceiptApp({
  title = "تأیید پرداخت",
  receipt = "در صورت مغایرت اطلاعات، انصراف دهید",
  onConfirm,
  onCancel,
  onClose,
}: ReceiptProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const data = (location.state as { receipt?: ReceiptData } | null)?.receipt;

  const handleClose = () => {
    if (onClose) return onClose();
    navigate(-1);
  };

  const handleCancel = () => {
    if (onCancel) return onCancel();
    navigate("/");
  };

  const handleConfirm = () => {
    if (onConfirm) return onConfirm();
    console.log("Confirming payment for:", data);
  };

  return (
    <div className="receipt-wrapper">
      <BackButton to="/services" />

      <div className="receipt-glow" aria-hidden="true" />

      <Card className="receipt-card">
        <div className="receipt-top-line" aria-hidden="true" />

        <CloseButton aria-label="بستن" className="receipt-close" onPress={handleClose} />

        <div className="receipt-visual">
          <div className="receipt-icon-ring">
            <span className="receipt-icon">🧾</span>
          </div>
        </div>

        <Card.Header className="receipt-header">
          <Card.Title className="receipt-title">{title}</Card.Title>
          <Card.Description className="receipt-desc">{receipt}</Card.Description>
        </Card.Header>

        {data ? (
          <Card.Content className="receipt-details">
            <div className="receipt-row">
              <span className="receipt-label">خدمت</span>
              <span className="receipt-value">{data.serviceTitle ?? "—"}</span>
            </div>
            {data.serviceDescription && (
              <div className="receipt-row receipt-row--multiline">
                <span className="receipt-label">توضیحات</span>
                <span className="receipt-value">{data.serviceDescription}</span>
              </div>
            )}
            <div className="receipt-row">
              <span className="receipt-label">مشاور</span>
              <span className="receipt-value">{data.consultant ?? "—"}</span>
            </div>
            <div className="receipt-row receipt-row--total">
              <span className="receipt-label">مبلغ قابل پرداخت</span>
              <span className="receipt-value receipt-price">{data.price ?? "—"}</span>
            </div>
          </Card.Content>
        ) : (
          <Card.Content className="receipt-details">
            <p className="receipt-empty">اطلاعات سفارش یافت نشد.</p>
          </Card.Content>
        )}

        <Card.Footer className="receipt-footer">
          <Button
            className="receipt-btn receipt-btn--confirm"
            size="lg"
            onPress={handleConfirm}
            isDisabled={!data}
          >
            تأیید و پرداخت
          </Button>

          <Button
            className="receipt-btn receipt-btn--cancel"
            size="lg"
            variant="ghost"
            onPress={handleCancel}
          >
            انصراف
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}