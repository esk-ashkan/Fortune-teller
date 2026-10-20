import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  to?: string;
  label?: string;
}

const BackButton = ({ to, label = "بازگشت" }: BackButtonProps) => {
  const navigate = useNavigate();
  const handleClick = () => (to ? navigate(to) : navigate(-1));

  return (
    <button
      type="button"
      className="back-btn"
      onClick={handleClick}
      aria-label={label}
    >
      <IoIosArrowRoundBack className="back-btn-icon" />
    </button>
  );
};

export default BackButton;