<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Подтверждение email</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #09090b;
            color: #fafafa;
            margin: 0;
            padding: 40px 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #18181b;
            border-radius: 12px;
            padding: 40px;
            border: 1px solid #27272a;
        }
        .logo {
            text-align: center;
            margin-bottom: 32px;
        }
        .logo h1 {
            color: #dc2626;
            font-size: 28px;
            margin: 0;
        }
        h2 {
            color: #fafafa;
            font-size: 24px;
            margin: 0 0 16px 0;
        }
        p {
            color: #a1a1aa;
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 24px 0;
        }
        .button {
            display: inline-block;
            background-color: #dc2626;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
        }
        .button:hover {
            background-color: #b91c1c;
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .footer {
            text-align: center;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #27272a;
        }
        .footer p {
            color: #71717a;
            font-size: 14px;
            margin: 0;
        }
        .link {
            color: #a1a1aa;
            word-break: break-all;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>⚔️ D&D Assistant</h1>
        </div>

        <h2>Подтвердите ваш email</h2>

        <p>
            Спасибо за регистрацию в D&D Assistant! Пожалуйста, подтвердите ваш email,
            нажав на кнопку ниже.
        </p>

        <div class="button-container">
            <a href="{{ $verificationUrl }}" class="button">
                Подтвердить email
            </a>
        </div>

        <p>
            После подтверждения email, администратор активирует ваш аккаунт,
            и вы сможете войти в систему.
        </p>

        <p>
            Если кнопка не работает, скопируйте ссылку ниже и вставьте её в адресную строку браузера:
        </p>

        <p class="link">{{ $verificationUrl }}</p>

        <p>
            Ссылка действительна в течение 60 минут.
        </p>

        <div class="footer">
            <p>
                Если вы не регистрировались в D&D Assistant, просто проигнорируйте это письмо.
            </p>
        </div>
    </div>
</body>
</html>
