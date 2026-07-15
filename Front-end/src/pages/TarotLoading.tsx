import { useState, useEffect } from "react";
import "./tarot-loading.css";

interface TarotLoadingProps {
  isVisible: boolean;
  onComplete?: () => void;
}

const TarotLoading = ({ isVisible, onComplete }: TarotLoadingProps) => {
  const [phase, setPhase] = useState(0);
  const [shuffling, setShuffling] = useState(false);

    const fortuneMessages = [
        "🔄 در حال پردازش کارت‌های انتخاب شده...",
        "📊 تحلیل نمادین کارت‌ها...",
        "🧮 محاسبه ارتباطات بین کارت‌ها...",
        "📑 استخراج معانی کلیدی...",
        "🔗 اتصال مفاهیم به یکدیگر...",
        "📝 نگارش تفسیر...",
        "✅ آماده‌سازی نتیجه نهایی..."
    ];

  const tarotSymbols = ["🃏", "🔮", "🌟", "🌙", "☀️", "⭐", "🌌", "🔯"];

  useEffect(() => {
    if (!isVisible) {
      setPhase(0);
      return;
    }

    // Phase 1: Shuffling
    setShuffling(true);
    const shuffleInterval = setInterval(() => {
    }, 300);

    // Phase 2: Reading after 2 seconds
    const phaseTimer = setTimeout(() => {
      setShuffling(false);
      setPhase(1);
      
      // Phase 3: Revealing after another 2 seconds
      const revealTimer = setTimeout(() => {
        setPhase(2);
        if (onComplete) setTimeout(onComplete, 1000);
      }, 2000);

      return () => clearTimeout(revealTimer);
    }, 2000);

    // Update fortune message every 1.5 seconds
    const messageInterval = setInterval(() => {
      setPhase((prev) => {
        if (prev < fortuneMessages.length - 1) return prev + 1;
        return prev;
      });
    }, 1500);

    return () => {
      clearInterval(shuffleInterval);
      clearTimeout(phaseTimer);
      clearInterval(messageInterval);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="tarot-loading-overlay">
      <div className="tarot-loading-container">
        {/* Animated background */}
        <div className="tarot-loading-stars">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="star"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
                width: `${1 + Math.random() * 3}px`,
                height: `${1 + Math.random() * 3}px`,
              }}
            />
          ))}
        </div>

        <div className="tarot-loading-content">
          {/* Main card animation */}
          <div className={`tarot-loading-card ${shuffling ? 'shuffling' : ''} ${phase >= 2 ? 'revealed' : ''}`}>
            <div className="card-front">
              <div className="card-symbol">
                {shuffling ? '🎴' : phase >= 2 ? '🔮' : tarotSymbols[Math.floor((Date.now() / 500) % tarotSymbols.length)]}
              </div>
              {phase >= 2 && (
                <div className="card-reveal-effect">
                  <span>✨</span>
                  <span>⭐</span>
                  <span>✨</span>
                </div>
              )}
            </div>
            <div className="card-back">
              <div className="card-pattern"></div>
            </div>
          </div>

          {/* Multiple floating cards */}
          {shuffling && (
            <div className="floating-cards">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="floating-card"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    transform: `rotate(${i * 60}deg) translateY(${Math.sin(i) * 20}px)`,
                  }}
                >
                  🃏
                </div>
              ))}
            </div>
          )}

          {/* Phase 1: Shuffling text */}
          {shuffling && (
            <div className="loading-status shuffling-status">
              <span className="shuffle-icon">🔄</span>
              <span>کارت‌ها در حال بر هم زدن...</span>
              <span className="shuffle-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </div>
          )}

          {/* Phase 2: Reading message */}
          {!shuffling && phase >= 1 && (
            <div className="loading-status reading-status">
              <div className="fortune-message">
                <span className="message-icon">🔮</span>
                <span className="message-text">
                  {fortuneMessages[Math.min(phase, fortuneMessages.length - 1)]}
                </span>
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="loading-progress">
            <div 
              className="loading-progress-bar"
              style={{
                width: `${Math.min((phase / 10) * 100, 100)}%`,
                transition: 'width 0.5s ease-in-out'
              }}
            />
          </div>

          {/* Decorative elements */}
          <div className="loading-ornaments">
            <span>✦</span>
            <span>✧</span>
            <span>✦</span>
            <span>✧</span>
            <span>✦</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TarotLoading;