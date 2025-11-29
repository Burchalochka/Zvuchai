# ⚡ Быстрое решение: Настройка подписи в Xcode

## Проблема:
```
Signing for "Zvuchai_TEMP" requires a development team.
```

## Решение за 3 шага:

### 1️⃣ Добавьте Apple ID в Xcode
- **Xcode → Settings** (или **Preferences**)
- Вкладка **"Accounts"**
- Нажмите **"+"** → **"Apple ID"**
- Введите email и пароль → **"Sign In"**

### 2️⃣ Выберите Team в проекте
- В Xcode: выберите проект **"Zvuchai_TEMP"** (синяя иконка слева)
- Выберите target **"Zvuchai_TEMP"**
- Вкладка **"Signing & Capabilities"**
- Включите **"Automatically manage signing"**
- В поле **"Team"** выберите ваш Apple ID

### 3️⃣ Запустите на iPhone
- Выберите ваш iPhone в списке устройств (вверху Xcode)
- Нажмите **▶️ Play**

---

## ⚠️ О предупреждениях (11 warnings)

Предупреждения о deprecated API (`RCTModalHostView`, `RCTRootView` и т.д.) **не критичны** и не мешают работе приложения. Это просто уведомления о том, что API устарели.

**Можно игнорировать** - приложение будет работать нормально.

---

## ✅ После настройки:

1. Ошибка подписи исчезнет
2. Приложение установится на iPhone
3. На iPhone: **Настройки → Основные → Управление устройством → Доверять**

