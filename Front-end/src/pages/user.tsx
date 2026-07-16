import React, { useState, useEffect } from 'react';

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

    useEffect(() => {
        useEffect(() => {
            const tg = window.Telegram?.WebApp;

            if (!tg) {
                setError("Telegram WebApp SDK not found");
                return;
            }

            tg.ready();

            if (!tg.initDataUnsafe.user) {
                setError("No Telegram user found");
                return;
            }

            setData({
                user: tg.initDataUnsafe.user,
                chat: tg.initDataUnsafe.chat ?? null,
                auth_date: tg.initDataUnsafe.auth_date ?? 0,
                chat_type: tg.initDataUnsafe.chat_type ?? "private",
                chat_instance: tg.initDataUnsafe.chat_instance ?? "",
            });
        }, []);
    }, []);

    const verifyUserOnServer = async (initData: MiniAppData) => {
        try {
            const response = await fetch('/api/verify-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    initData: window.location.hash.substring(1),
                    userData: initData
                })
            });
            
            const result = await response.json();
            if (result.verified) {
                console.log('User verified successfully');
            }
        } catch (error) {
            console.error('Verification failed:', error);
            setError('User verification failed');
        }
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!data) {
        return <div>Loading...</div>;
    }

    const { user, chat, chat_type } = data;

    return (
        <div className="app">
            <div className="user-card">
                {user.photo_url && (
                    <img 
                        src={user.photo_url} 
                        alt={`${user.first_name}'s avatar`}
                        className="avatar"
                    />
                )}
                
                <h1>{user.first_name} {user.last_name || ''}</h1>
                
                {user.username && (
                    <p className="username">@{user.username}</p>
                )}
                
                <div className="badges">
                    {user.is_premium && (
                        <span className="badge premium">⭐ Premium</span>
                    )}
                    <span className="badge">ID: {user.id}</span>
                    <span className="badge">🌐 {user.language_code}</span>
                </div>
            </div>

            <div className="chat-info">
                <h3>Chat Information</h3>
                <p>Type: {chat_type}</p>
                {chat && (
                    <>
                        <p>Chat ID: {chat.id}</p>
                        {chat.title && <p>Title: {chat.title}</p>}
                    </>
                )}
            </div>
        </div>
    );
};

export default TeleUserData;