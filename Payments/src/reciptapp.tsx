import { Button, Card, CloseButton } from "@heroui/react";
import "./receipt.css";

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
  return (
    <div className="receipt-wrapper">
      <div className="receipt-glow" aria-hidden="true" />

      <Card className="receipt-card">
        <div className="receipt-top-line" aria-hidden="true" />

        <CloseButton
          aria-label="بستن"
          className="receipt-close"
          onPress={onClose}
        />

        <div className="receipt-visual">
          <div className="receipt-icon-ring">
            <span className="receipt-icon">🧾</span>
          </div>
        </div>

        <Card.Header className="receipt-header">
          <Card.Title className="receipt-title">
            {title}
          </Card.Title>
          <Card.Description className="receipt-desc">
            {receipt}
          </Card.Description>
        </Card.Header>

        <Card.Footer className="receipt-footer">
          <Button
            className="receipt-btn receipt-btn--confirm"
            size="lg"
            onPress={onConfirm}
          >
            تأیید و پرداخت
          </Button>

          <Button
            className="receipt-btn receipt-btn--cancel"
            size="lg"
            variant="ghost"
            onPress={onCancel}
          >
            انصراف
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}