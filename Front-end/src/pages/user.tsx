import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Stack, Badge, Form, Button } from 'react-bootstrap';
import { FaMoon, FaStar, FaGlobe, FaIdBadge, FaCrown, FaEye, FaEyeSlash } from 'react-icons/fa';
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
    expense: {
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
    const [isVisible, setIsVisible] = useState(false);
    const [expense, setExpense] = useState(0);
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

    const { user } = data;

    return (
        <div className="cosmic-wrapper">
            <div className="cosmic-bg-layer cosmic-bg-stars"></div>
            <div className="cosmic-bg-layer cosmic-bg-nebula"></div>
            <div className="cosmic-bg-layer cosmic-bg-aurora"></div>
            <div className="cosmic-particles">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className={`cosmic-particle cosmic-particle-${i % 5}`} />
                ))}
            </div>

            <div className="user-back-wrapper" onClick={() => navigate(-1)}>
                <IoIosArrowRoundBack className="user-back-icon" />
            </div>

            <Container className="cosmic-content">
                <div className={`cosmic-header ${mounted ? 'cosmic-fade-in' : ''}`}>
                    <div className="cosmic-moon-wrapper">
                        <FaMoon className="cosmic-moon-icon" />
                        <div className="cosmic-moon-glow"></div>
                    </div>

                    <h1 className="cosmic-title">
                        <span className="cosmic-title-line">پروفایل</span>
                        <span className="cosmic-title-accent">کاربری</span>
                    </h1>

                    <div className="cosmic-divider">
                        <span className="cosmic-divider-line"></span>
                        <GiSparkles className="cosmic-divider-icon" />
                        <span className="cosmic-divider-line"></span>
                    </div>

                    <p className="cosmic-subtitle">
                        اطلاعات حساب کاربری شما
                    </p>
                </div>

                <Row className={`cosmic-cards-row user-cards-row ${mounted ? 'cosmic-slide-up' : ''}`}>
                    <Col xs={12}>
                        <div className="user-profile-card">
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
                            <h2 className="user-name">
                                {user.first_name} {user.last_name || ''}
                            </h2>

                            {user.username && (
                                <p className="user-username">@{user.username}</p>
                            )}
                            <div className="user-badges">
                                <div className="user-badge">
                                    <FaIdBadge className="user-badge-icon" />
                                    <span className="user-badge-value">
                                        {isVisible ? user.id : '*********'}
                                    </span>
                                    <button
                                        type="button"
                                        className="user-badge-toggle"
                                        onClick={() => setIsVisible(!isVisible)}
                                        aria-label={isVisible ? "مخفی کردن شناسه" : "نمایش شناسه"}
                                    >
                                        {isVisible ? <FaEye /> : <FaEyeSlash />}
                                    </button>
                                </div>
                                <div className="user-badge">
                                    <FaGlobe className="user-badge-icon" />
                                    <span>{user.language_code.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    </Col>
                    <Col xs={12}>
                        <Col xs={12}>
                            <div className="user-expense-card">
                                <div className="user-expense-header">
                                    <GiRingedPlanet className="user-expense-icon" />
                                    <h3>افزایش اعتبار</h3>
                                </div>

                                <div className="user-expense-content">
                                    <Stack
                                        direction="horizontal"
                                        gap={2}
                                        className="user-credit-badges"
                                    >
                                        {[
                                            { value: 1000000, label: '۱,۰۰۰,۰۰۰' },
                                            { value: 1500000, label: '۱,۵۰۰,۰۰۰' },
                                            { value: 2000000, label: '۲,۰۰۰,۰۰۰' },
                                            { value: 3000000, label: '۳,۰۰۰,۰۰۰' },
                                        ].map(({ value, label }) => (
                                            <Badge
                                                key={value}
                                                bg={expense === value ? 'warning' : 'secondary'}
                                                className="user-credit-badge"
                                                onClick={() => setExpense(value)}
                                            >
                                                {label}
                                            </Badge>
                                        ))}
                                    </Stack>

                                    <Form.Control
                                        type="text"
                                        inputMode="numeric"
                                        className="user-credit-input"
                                        placeholder="مبلغ به ریال"
                                        value={expense === 0 ? '' : expense}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/[^\d]/g, '');
                                            setExpense(raw ? Number(raw) : 0);
                                        }}
                                    />

                                    <Button
                                        variant="warning"
                                        className="user-credit-submit w-100"
                                        disabled={!expense || expense < 100000}
                                        onClick={() => {
                                            console.log('Charging:', expense);
                                        }}
                                    >
                                        {expense > 0
                                            ? `پرداخت ${expense.toLocaleString('fa-IR')} ریال`
                                            : 'پرداخت'}
                                    </Button>
                                </div>
                            </div>
                        </Col>
                    </Col>
                </Row>

                <div className={`cosmic-footer ${mounted ? 'cosmic-fade-in-delay' : ''}`}>
                    <p className="cosmic-footer-text">
                        اطلاعات این صفحه از حساب تلگرام شما دریافت شده است
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