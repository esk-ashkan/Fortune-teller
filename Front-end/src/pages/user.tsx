import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaMoon, FaStar, FaGlobe, FaIdBadge, FaCrown } from 'react-icons/fa';
import { GiSparkles, GiAstronautHelmet, GiRingedPlanet } from 'react-icons/gi';
import { IoIosArrowRoundBack } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import './user.css';

interface MiniAppData {
    user: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
        language_code: string;
        is_premium?: boolean;
        photo_url?: string;
    };
    chat: {
        id: number;
        type: string;
        title?: string;
    };
    auth_date: number;
    chat_type: string;
    chat_instance: string;
}

const TeleUserData: React.FC = () => {
    const [data, setData] = useState<MiniAppData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const tg = (window as any).Telegram?.WebApp;

        if (!tg) {
            setError("Telegram WebApp SDK not loaded.");
            return;
        }

        tg.ready();

        const user = tg.initDataUnsafe.user;
        const chat = tg.initDataUnsafe.chat;

        if (!user) {
            setError("No Telegram user.");
            return;
        }

        setData({
            user,
            chat,
            auth_date: tg.initDataUnsafe.auth_date,
            chat_type: tg.initDataUnsafe.chat_type,
            chat_instance: tg.initDataUnsafe.chat_instance
        });
        
        setMounted(true);
    }, []);

    if (error) {
        return (
            <div className="cosmic-wrapper">
                <div className="cosmic-bg-layer cosmic-bg-stars"></div>
                <div className="cosmic-bg-layer cosmic-bg-nebula"></div>
                <div className="cosmic-bg-layer cosmic-bg-aurora"></div>
                <Container className="cosmic-content">
                    <div className="user-error-card">
                        <GiRingedPlanet className="user-error-icon" />
                        <h2>خطا در دریافت اطلاعات</h2>
                        <p>{error}</p>
                    </div>
                </Container>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="cosmic-wrapper">
                <div className="cosmic-bg-layer cosmic-bg-stars"></div>
                <div className="cosmic-bg-layer cosmic-bg-nebula"></div>
                <div className="cosmic-bg-layer cosmic-bg-aurora"></div>
                <Container className="cosmic-content">
                    <div className="user-loading">
                        <GiAstronautHelmet className="user-loading-icon" />
                        <p>در حال دریافت اطلاعات...</p>
                    </div>
                </Container>
            </div>
        );
    }

    const { user, chat, chat_type } = data;

    return (
        <div className="cosmic-wrapper">
            {/* Background Layers */}
            <div className="cosmic-bg-layer cosmic-bg-stars"></div>
            <div className="cosmic-bg-layer cosmic-bg-nebula"></div>
            <div className="cosmic-bg-layer cosmic-bg-aurora"></div>
            <div className="cosmic-particles">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className={`cosmic-particle cosmic-particle-${i % 5}`} />
                ))}
            </div>

            {/* Back Button */}
            <div className="user-back-wrapper" onClick={() => navigate(-1)}>
                <IoIosArrowRoundBack className="user-back-icon" />
            </div>

            <Container className="cosmic-content">
                {/* Header */}
                <div className={`cosmic-header ${mounted ? 'cosmic-fade-in' : ''}`}>
                    <div className="cosmic-moon-wrapper">
                        <FaMoon className="cosmic-moon-icon" />
                        <div className="cosmic-moon-glow"></div>
                    </div>

                    <h1 className="cosmic-title">
                        <span className="cosmic-title-line">پروفایل</span>
                        <span className="cosmic-title-accent">کیهانی</span>
                    </h1>

                    <div className="cosmic-divider">
                        <span className="cosmic-divider-line"></span>
                        <GiSparkles className="cosmic-divider-icon" />
                        <span className="cosmic-divider-line"></span>
                    </div>

                    <p className="cosmic-subtitle">
                        سفری به درون هویت ستاره‌ای شما
                    </p>
                </div>

                {/* User Card */}
                <Row className={`cosmic-cards-row user-cards-row ${mounted ? 'cosmic-slide-up' : ''}`}>
                    <Col xs={12}>
                        <div className="user-profile-card">
                            {/* Avatar Section */}
                            <div className="user-avatar-section">
                                <div className="user-avatar-wrapper">
                                    {user.photo_url ? (
                                        <img
                                            src={user.photo_url}
                                            alt={`${user.first_name}'s avatar`}
                                            className="user-avatar"
                                        />
                                    ) : (
                                        <div className="user-avatar-placeholder">
                                            <FaStar />
                                        </div>
                                    )}
                                    <div className="user-avatar-glow"></div>
                                </div>

                                {user.is_premium && (
                                    <div className="user-premium-badge">
                                        <FaCrown /> Premium
                                    </div>
                                )}
                            </div>

                            {/* Name Section */}
                            <h2 className="user-name">
                                {user.first_name} {user.last_name || ''}
                            </h2>

                            {user.username && (
                                <p className="user-username">@{user.username}</p>
                            )}

                            {/* Info Badges */}
                            <div className="user-badges">
                                <div className="user-badge">
                                    <FaIdBadge className="user-badge-icon" />
                                    <span>{user.id}</span>
                                </div>
                                <div className="user-badge">
                                    <FaGlobe className="user-badge-icon" />
                                    <span>{user.language_code.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    </Col>

                    {/* Chat Info Card */}
                    <Col xs={12}>
                        <div className="user-chat-card">
                            <div className="user-chat-header">
                                <GiRingedPlanet className="user-chat-icon" />
                                <h3>اطلاعات چت</h3>
                            </div>

                            <div className="user-chat-content">
                                <div className="user-chat-row">
                                    <span className="user-chat-label">نوع</span>
                                    <span className="user-chat-value">{chat_type}</span>
                                </div>

                                {chat && (
                                    <>
                                        <div className="user-chat-row">
                                            <span className="user-chat-label">شناسه چت</span>
                                            <span className="user-chat-value">{chat.id}</span>
                                        </div>

                                        {chat.title && (
                                            <div className="user-chat-row">
                                                <span className="user-chat-label">عنوان</span>
                                                <span className="user-chat-value">{chat.title}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>

                {/* Footer */}
                <div className={`cosmic-footer ${mounted ? 'cosmic-fade-in-delay' : ''}`}>
                    <p className="cosmic-footer-text">
                        هویت شما، ستاره‌ای در کهکشان بی‌پایان
                    </p>
                    <div className="cosmic-footer-stars">
                        {[...Array(5)].map((_, i) => (
                            <span key={i} className="cosmic-footer-star">✦</span>
                        ))}
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default TeleUserData;