import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import ReactMarkdown from "react-markdown";
import "./fortune.css";

interface RevealFortuneInterface {
  initiatedShow: boolean;
  text: string;
  handleClose_: () => void;
}

function RevealFortune({ initiatedShow, text, handleClose_ }: RevealFortuneInterface) {
  return (
    <Modal
      show={initiatedShow}
      onHide={handleClose_}
      backdrop="static"
      keyboard={false}
      centered
      dialogClassName="fortune-modal"
    >
      <div className="fortune-frame">
        <Modal.Header closeButton className="fortune-header">
          <Modal.Title className="fortune-title">تفسیر فال شما</Modal.Title>
        </Modal.Header>

        <Modal.Body className="fortune-body">
          <div className="fortune-ornament" aria-hidden="true">
            <span className="fortune-ornament-diamond"></span>
          </div>
          <div className="fortune-text">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        </Modal.Body>

        <Modal.Footer className="fortune-footer">
          <Button className="fortune-close-btn" onClick={handleClose_}>
            بستن
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  );
}

export default RevealFortune;