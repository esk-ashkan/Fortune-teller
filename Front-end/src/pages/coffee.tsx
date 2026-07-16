import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import './Coffee.css';

export default function Coffee() {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [fortuneText, setFortuneText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const filesArray = Array.from(files);
    
    if (selectedImages.length + filesArray.length > 2) {
      alert('حداکثر تا ۲ عکس میتوانید انتخاب کنید.');
      e.target.value = '';
      return;
    }
    
    setSelectedImages(prev => [...prev, ...filesArray]);
  };

  const handleSendImages = async () => {
    const formData = new FormData();

    selectedImages.forEach((img) => {
      formData.append("images", img);
      formData.append("images_name", `${img.name}_${img.size}`);
    });

    setIsLoading(true);
    try {
      const response = await axios.post(
        "https://fortune-teller-nhy4.onrender.com/coffee",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      setFortuneText(response.data.interpretation);
    } catch (err) {
      console.error(err);
      setFortuneText("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="persian-container">
      <div className="header-decoration">
        <div className="ornament">✦</div>
        <h1 className="persian-title">☕ فال قهوه</h1>
        <div className="ornament">✦</div>
      </div>
      
      <div className="divider">
        <span className="divider-text">✦ ✦ ✦</span>
      </div>
      <div className="fortune-card">
        <Form.Group controlId="formFileMultiple" className="mb-4">
          <Form.Label className="persian-label">
            <span className="label-icon">🖼</span>
            حداکثر تا ۲ عکس را انتخاب کنید
          </Form.Label>
          
          <div className="upload-zone">
            <Form.Control 
              type="file"
              multiple
              onChange={handleFileChange}
              className="persian-file-input"
              id="fileInput"
            />
            <label htmlFor="fileInput" className="upload-label">
              <span className="upload-icon">📤</span>
              <span>برای انتخاب فایل کلیک کنید</span>
              <span className="upload-hint">(jpg, png, webp)</span>
            </label>
          </div>
          {selectedImages.length > 0 && (
            <div className="selected-files">
              <div className="files-header">
                <span>📎 تصاویر انتخاب شده</span>
                <span className="file-count">{selectedImages.length} / ۲</span>
              </div>
              <ul className="file-list">
                {selectedImages.map((img, index) => (
                  <li key={index} className="file-item">
                    <span className="file-icon">🖼</span>
                    <span className="file-name">{img.name}</span>
                    <span className="file-size">
                      {Math.round(img.size / 1024)} KB
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Form.Text className="persian-hint">
            {selectedImages.length === 0 ? (
              <span>✨ لطفاً تصاویر خود را انتخاب کنید</span>
            ) : (
              <span>✅ {selectedImages.length} تصویر انتخاب شده است</span>
            )}
          </Form.Text>
        </Form.Group>

        <Button
          variant="dark"
          onClick={handleSendImages}
          disabled={selectedImages.length === 0 || isLoading}
          className="persian-submit-btn"
        >
          {isLoading ? (
            <span className="loading-spinner">
              <span className="spinner"></span>
              در حال بررسی...
            </span>
          ) : (
            <span>🔮 دریافت فال</span>
          )}
        </Button>
      </div>
      {fortuneText && (
        <div className="fortune-result">
          <div className="fortune-header">
            <span className="fortune-icon">☕</span>
            <h2 className="fortune-title">فال شما</h2>
          </div>
          <div className="fortune-content">
            <p className="fortune-text">{fortuneText}</p>
          </div>
          <div className="fortune-footer">
            <span className="fortune-ornament">✦</span>
            <span className="fortune-ornament">✧</span>
            <span className="fortune-ornament">✦</span>
          </div>
        </div>
      )}
    </div>
  );
}