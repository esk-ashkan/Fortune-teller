export {};

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready(): void;
        expand(): void;

        initData: string;

        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code: string;
            is_premium?: boolean;
            photo_url?: string;
          };

          chat?: {
            id: number;
            type: string;
            title?: string;
          };

          auth_date: number;
          chat_type: string;
          chat_instance: string;
        };
      };
    };
  }
}