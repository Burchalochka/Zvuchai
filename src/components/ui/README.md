# UI Components

## Описание / Description

Коллекция адаптированных UI компонентов для React Native с поддержкой украинского и английского языков.

A collection of adapted UI components for React Native with Ukrainian and English language support.

## Компоненты / Components

### HoverGlowButton

Кнопка с эффектом свечения при нажатии.

Button with glow effect on press.

**Использование / Usage:**

```tsx
import { HoverGlowButton } from '@/components/ui/HoverGlowButton';
import { getTranslation } from '@/utils/translations';
import { useLanguage } from '@/context/LanguageContext';

const MyComponent = () => {
  const { language } = useLanguage();
  
  return (
    <HoverGlowButton
      glowColor="#00ffc3"
      backgroundColor="#000"
      textColor="#ffffff"
      hoverTextColor="#67e8f9"
      onPress={() => console.log('Pressed')}
    >
      {getTranslation('hoverMe', language)}
    </HoverGlowButton>
  );
};
```

**Props:**
- `children`: React.ReactNode - содержимое кнопки
- `onPress?: () => void` - обработчик нажатия
- `style?: ViewStyle` - дополнительные стили
- `textStyle?: TextStyle` - стили текста
- `disabled?: boolean` - отключена ли кнопка
- `glowColor?: string` - цвет свечения (по умолчанию '#00ffc3')
- `backgroundColor?: string` - цвет фона (по умолчанию '#111827')
- `textColor?: string` - цвет текста (по умолчанию '#ffffff')
- `hoverTextColor?: string` - цвет текста при нажатии (по умолчанию '#67e8f9')

### RippleButton

Кнопка с эффектом волны (ripple) при нажатии. Поддерживает несколько вариантов.

Button with ripple wave effect on press. Supports multiple variants.

**Использование / Usage:**

```tsx
import { RippleButton } from '@/components/ui/RippleButton';
import { getTranslation } from '@/utils/translations';
import { useLanguage } from '@/context/LanguageContext';

const MyComponent = () => {
  const { language } = useLanguage();
  
  return (
    <>
      {/* Default variant */}
      <RippleButton
        variant="default"
        onPress={() => console.log('Pressed')}
      >
        {getTranslation('clickMe', language)}
      </RippleButton>

      {/* Ghost variant */}
      <RippleButton
        variant="ghost"
        rippleColor="rgba(0, 0, 0, 0.1)"
        onPress={() => console.log('Pressed')}
      >
        {getTranslation('pressMe', language)}
      </RippleButton>

      {/* Hover variant */}
      <RippleButton
        variant="hover"
        hoverBaseColor="#6996e2"
        onPress={() => console.log('Pressed')}
      >
        {getTranslation('submit', language)}
      </RippleButton>

      {/* Hover border variant */}
      <RippleButton
        variant="hoverborder"
        hoverBorderEffectColor="#6996e277"
        hoverBorderEffectThickness={3}
        onPress={() => console.log('Pressed')}
      >
        {getTranslation('confirm', language)}
      </RippleButton>
    </>
  );
};
```

**Props:**
- `children`: React.ReactNode - содержимое кнопки
- `onPress?: (event: GestureResponderEvent) => void` - обработчик нажатия
- `style?: ViewStyle` - дополнительные стили
- `textStyle?: TextStyle` - стили текста
- `disabled?: boolean` - отключена ли кнопка
- `variant?: 'default' | 'hover' | 'ghost' | 'hoverborder'` - вариант кнопки
- `rippleColor?: string` - цвет волны
- `rippleDuration?: number` - длительность анимации волны (мс)
- `hoverBaseColor?: string` - базовый цвет для hover варианта
- `hoverRippleColor?: string` - цвет волны для hover варианта
- `hoverBorderEffectColor?: string` - цвет эффекта границы
- `hoverBorderEffectThickness?: number` - толщина эффекта границы

## Переводы / Translations

Все компоненты поддерживают переводы через систему переводов приложения.

All components support translations through the app's translation system.

**Доступные ключи переводов / Available translation keys:**

- `hoverMe` - "Наведіть на мене!" / "Hover Me!"
- `clickMe` - "Натисніть мене" / "Click Me"
- `pressMe` - "Натисніть" / "Press Me"
- `submit` - "Відправити" / "Submit"
- `confirm` - "Підтвердити" / "Confirm"
- `continue` - "Продовжити" / "Continue"
- `back` - "Назад" / "Back"
- `next` - "Далі" / "Next"
- `close` - "Закрити" / "Close"
- `open` - "Відкрити" / "Open"
- `loading` - "Завантаження..." / "Loading..."
- `processing` - "Обробка..." / "Processing..."
- `success` - "Успіх" / "Success"
- `error` - "Помилка" / "Error"
- `retry` - "Спробувати ще раз" / "Retry"

## Демо / Demo

Для просмотра всех компонентов используйте `ButtonDemo`:

To view all components, use `ButtonDemo`:

```tsx
import { ButtonDemo } from '@/components/ui/ButtonDemo';

// В вашем экране / In your screen
<ButtonDemo />
```

## Важные замечания / Important Notes

1. **React Native**: Эти компоненты адаптированы для React Native и используют `TouchableOpacity` вместо HTML `<button>`.

2. **Анимации**: Используются `Animated` API из React Native для плавных анимаций.

3. **Стили**: Используется `StyleSheet` вместо Tailwind CSS, так как это React Native проект.

4. **События**: Используются `onPress`, `onPressIn`, `onPressOut` вместо `onClick`, `onMouseMove`, `onMouseEnter`, `onMouseLeave`.

5. **Переводы**: Все текстовые элементы должны использовать `getTranslation` для поддержки многоязычности.

## Установка зависимостей / Dependencies

Все необходимые зависимости уже установлены в проекте:
- react
- react-native
- @react-native/typescript-config

All required dependencies are already installed in the project.

