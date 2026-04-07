# Zvuchno Project Knowledge Base

## Project Overview

**Zvuchno** (also referenced as Zvuchai) is a smart daily planner application built with React Native. The app provides intelligent task management, habit tracking, goal setting, and voice-based task creation. It serves as a comprehensive productivity tool that helps users organize their daily activities with features like time-block scheduling, AI-powered task suggestions, and voice recognition.

**Core Value Proposition**: A visually appealing, intuitive planner that combines traditional task management with modern AI assistance and voice interaction, specifically designed for Ukrainian/Russian-speaking users with bilingual support.

## Tech Stack & Libraries

### Core Framework
- **React Native 0.82.1** with React 19.1.1
- **TypeScript** for type safety
- **JavaScript/JSX** for component development

### Navigation & UI
- **@react-navigation/native** (v7.1.21) - Main navigation library
- **@react-navigation/bottom-tabs** (v7.8.6) - Tab-based navigation
- **@react-navigation/native-stack** (v7.14.5) - Stack navigation
- **react-native-safe-area-context** (v5.7.0) - Safe area handling
- **react-native-screens** (v4.18.0) - Native screen optimization
- **react-native-svg** (v15.15.0) - SVG rendering
- **react-native-vector-icons** (v10.3.0) - Icon library

### State Management & Storage
- **React Context API** - Primary state management (TasksContext, LanguageContext, ModalContext, SelectedDateContext)
- **react-native-mmkv** (v3.3.3) - High-performance local storage
- Custom storage service with memory fallback

### Animation & Gestures
- **react-native-reanimated** (v4.3.0) - Performance animations
- **react-native-gesture-handler** (v2.30.0) - Gesture recognition
- **react-native-draggable-flatlist** (v4.0.3) - Drag-and-drop reordering
- **lottie-react-native** (v7.3.6) - Lottie animations

### Voice & Audio Features
- **@react-native-voice/voice** (v3.2.4) - Speech recognition
- **react-native-audio-recorder-player** (v4.5.0) - Audio recording/playback
- **react-native-nitro-sound** (v0.2.10) - Audio processing

### Development & Testing
- **Jest** - Testing framework
- **ESLint** with @react-native config
- **Prettier** - Code formatting
- **TypeScript** - Type checking

## App Architecture & Folder Structure

```
zvuchai/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── calendar/        # Calendar components
│   │   ├── common/          # Shared components (Header, Footer, etc.)
│   │   ├── modals/          # Modal components
│   │   ├── tasks/           # Task-related components
│   │   ├── ui/              # UI primitives (buttons, etc.)
│   │   └── week/            # Week view components
│   ├── screens/             # Main application screens
│   │   ├── DailySummaryScreen.jsx
│   │   ├── HomeScreen.jsx
│   │   ├── InboxScreen.jsx
│   │   ├── MicrophoneScreen.jsx
│   │   └── [Other screens]
│   ├── context/             # React Context providers
│   │   ├── TasksContext.jsx
│   │   ├── LanguageContext.jsx
│   │   ├── ModalContext.jsx
│   │   └── SelectedDateContext.jsx
│   ├── services/            # Business logic services
│   │   ├── StorageService.ts
│   │   ├── TaskCreationService.ts
│   │   ├── DaySummaryService.ts
│   │   └── DataLayerService.js
│   ├── styles/              # Design system
│   │   └── theme.js         # Colors, fonts, spacing
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   ├── constants/           # App constants
│   ├── navigation/          # Navigation configuration
│   ├── storage/             # Storage abstraction
│   ├── utils/               # Utility functions
│   └── assets/              # Images, icons, fonts
├── seed/                    # Seed data for development
├── docs/                    # Documentation
├── __tests__/               # Test files
└── [Root config files]
```

### Architecture Patterns
1. **Component-Based Architecture**: Functional components with hooks
2. **Context-Based State Management**: Multiple contexts for different concerns
3. **Service Layer**: Business logic separated from UI components
4. **Repository Pattern**: Storage services abstract data persistence

## Core Data Models

### BaseItem Interface (Shared by all item types)
```typescript
interface BaseItem {
  id: string;
  type: ItemType; // 'task' | 'habit' | 'goal'
  title: string;
  description: string;
  date: string | null;           // 'YYYY-MM-DD'
  startTime: string | null;      // 'HH:MM'
  endTime: string | null;        // 'HH:MM'
  status: ItemStatus;            // 'pending' | 'completed' | 'skipped' | 'requires_review'
  themeColor: string;
  priority: Priority;            // 'low' | 'medium' | 'high'
  difficulty: Difficulty;        // 'easy' | 'medium' | 'hard'
  estimatedDuration: number | null;
  dueDate: string | null;        // 'YYYY-MM-DD'
  deadline: string | null;       // 'YYYY-MM-DD HH:MM'
  isInbox: boolean;              // true if task has no specific time
  tags: string[];
  reminder: Reminder;
  linkedGoalId: string | null;
  voiceNote: string | null;
  completedAt: string | null;
  archived: boolean;
  deletedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  sortIndex?: number | null;
  autoDoneOverride?: 'pending' | 'completed' | null;
}
```

### Task Interface
```typescript
interface Task extends BaseItem {
  type: 'task';
}
```

### Habit Interface
```typescript
interface Habit extends BaseItem {
  type: 'habit';
  recurrence: Recurrence;        // { type: 'daily' | 'weekly' | 'custom', days: number[] }
  streak: number;
  bestStreak: number;
  completionDates: string[];
}
```

### Goal Interface
```typescript
interface Goal extends BaseItem {
  type: 'goal';
  target: GoalTarget;            // { value: number, unit: string, progress: number, milestones: Milestone[] }
}
```

### Reminder Interface
```typescript
interface Reminder {
  mode: 'before_start' | 'at_time';
  minutesBefore: number;
  time: string | null;
  recurrent: boolean;
  enabled: boolean;
}
```

## Key Features & UI Components

### Main Screens
1. **HomeScreen** (`src/screens/HomeScreen.jsx`)
   - Daily timeline view with draggable tasks
   - Calendar integration for date selection
   - Task completion toggles
   - Daily summary statistics

2. **InboxScreen** (`src/screens/InboxScreen.jsx`)
   - Task triage system for unprocessed items
   - AI confidence scoring for voice-generated tasks
   - Tab-based organization (No Deadline, AI Unsure)
   - Date assignment interface

3. **DailySummaryScreen** (`src/screens/DailySummaryScreen.jsx`)
   - Modal view showing daily accomplishments
   - Statistics (completed tasks, time worked)
   - Swipeable task items for quick actions

4. **MicrophoneScreen** (`src/screens/MicrophoneScreen.jsx`)
   - Voice recording interface
   - Real-time speech-to-text
   - AI task generation from voice input

5. **Other Screens**: GoalsScreen, AnalyticsScreen, WeekScheduleScreen, LanguageSelectionScreen, etc.

### Complex Components
1. **SwipeableTaskItem** (`src/components/tasks/SwipeableTaskItem.jsx`)
   - Horizontal swipe gestures for delete/reschedule
   - Animated transitions using PanResponder and Animated API
   - Visual feedback with opacity interpolation
   - Threshold-based auto-actions

2. **Calendar** (`src/components/calendar/Calendar.jsx`)
   - Custom calendar component with day selection
   - Task count indicators per date
   - Week/month view toggles

3. **DayTimeline** (`src/components/day/DayTimeline.jsx`)
   - Visual timeline representation of scheduled tasks
   - Time blocking with color-coded themes
   - Drag-and-drop rescheduling

4. **Modals System**
   - **DeleteTaskModal**: Confirmation for task deletion
   - **RescheduleTaskModal**: Date picker for rescheduling
   - **EditTaskModal**: Full task editing interface
   - **AddItemModal**: Unified task/habit creation

### Gesture & Interaction Patterns
- **Swipe Actions**: Left swipe for reschedule, right swipe for delete
- **Drag & Drop**: Task reordering within daily timeline
- **Tap Interactions**: Task completion toggles, date selection
- **Modal Flows**: Contextual modals triggered by user actions

## State Management

### Context Providers
1. **TasksContext** (`src/context/TasksContext.jsx`)
   - Centralized state for tasks, habits, and goals
   - CRUD operations with automatic persistence
   - Real-time synchronization with MMKV storage
   - Methods: `addTask`, `toggleTaskComplete`, `deleteTask`, `rescheduleTask`, etc.

2. **LanguageContext** (`src/context/LanguageContext.jsx`)
   - Bilingual support (Ukrainian/English)
   - Language preference persistence
   - Translation utilities

3. **ModalContext** (`src/context/ModalContext.jsx`)
   - Global modal state management
   - Controls visibility of AddItemModal
   - Prevents modal conflicts

4. **SelectedDateContext** (`src/context/SelectedDateContext.jsx`)
   - Current date selection across the app
   - Calendar synchronization
   - Date formatting utilities

### Data Flow
```
User Action → Component → Context Method → State Update → Storage Sync → UI Re-render
```

### Storage Strategy
- **Primary Storage**: MMKV (high-performance key-value store)
- **Fallback**: In-memory storage for development/testing
- **Data Structure**: JSON serialization of arrays
- **Keys**: `tasks`, `habits`, `goals`, `user_preferences`

## Coding Standards & UI/UX Guidelines

### Design System (`src/styles/theme.js`)

#### Color Palette
```javascript
export const COLORS = {
  primary: '#E8E0D5',        // Light beige
  primaryDark: '#514134',    // Dark brown
  primaryStrong: '#C4B5A0',  // Medium beige
  secondary: '#8B7355',      // Warm brown
  background: '#FAF9F9',     // Off-white background
  text: '#321E00',           // Dark brown text
  textSecondary: '#6B5B4F',  // Medium brown text
  panel: '#F1ECDB',          // Panel background
  panelLight: '#F8F5E9',     // Light panel
  accentBrown: '#5A4C3D',    // Accent brown
  base: '#F8F5E9',           // Base color
  // Additional colors for states
  success: '#9A8B6E',
  error: '#EF4444',
  warning: '#F59E0B',
  border: '#D4C4B0',
};
```

#### Typography
- **Font Family**: Montserrat (Regular, Medium, Bold, SemiBold)
- **Font Sizes**: xs(12), sm(14), md(16), lg(18), xl(20), xxl(24), xxxl(32)
- **Font Weights**: Regular (400), Medium (500), Bold (700)

#### Spacing & Layout
- **Spacing Scale**: xs(4), sm(8), md(16), lg(24), xl(32), xxl(48)
- **Border Radius**: sm(8), md(12), lg(16), xl(24), round(999)
- **Shadows**: Small and medium elevation shadows for depth

### Component Patterns

#### Functional Components with Hooks
```javascript
const ComponentName = ({ prop1, prop2 }) => {
  const { state } = useContext(SomeContext);
  const [localState, setLocalState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  return (
    <View style={styles.container}>
      {/* JSX content */}
    </View>
  );
};
```

#### Styling Convention
- Use StyleSheet.create for performance
- Import theme values from `src/styles/theme.js`
- Follow BEM-like naming for complex components
- Use responsive design principles

#### Naming Conventions
- **Components**: PascalCase (e.g., `SwipeableTaskItem`)
- **Files**: PascalCase for components, camelCase for utilities
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Context Hooks**: `use[ContextName]` (e.g., `useTasks`)

#### Code Quality Standards
- **ESLint**: React Native community configuration
- **Prettier**: Single quotes, trailing commas, arrow parens avoidance
- **TypeScript**: Strict typing for services and data models
- **Testing**: Jest for unit tests, especially services

### UI/UX Principles
1. **Consistent Spacing**: Use theme spacing constants
2. **Accessible Contrast**: Text colors meet WCAG guidelines
3. **Touch Targets**: Minimum 44x44px for interactive elements
4. **Feedback**: Visual feedback for all interactions
5. **Progressive Disclosure**: Complex features revealed gradually
6. **Error Prevention**: Confirmations for destructive actions

## Development Workflow

### Seed Data System
- Development seed data in `/seed` directory
- Configurable via `DEV_CONFIG.SEED_ENABLED`
- Automatic seeding on first launch or when storage is empty
- Timezone-aware date generation (Europe/Kyiv)

### Testing Strategy
- Unit tests for services (`__tests__/services/`)
- Component testing with React Native Testing Library
- Mock storage for isolated testing

### Build & Deployment
- Android: Gradle-based build with React Native CLI
- iOS: CocoaPods dependencies
- Environment-specific configurations

---

## AI Assistant Protocol

**IMPORTANT DIRECTIVE FOR FUTURE AI SESSIONS**

Before proposing or implementing any changes to the Zvuchno codebase, you MUST:

1. **Silently read this `PROJECT_KNOWLEDGE.md` file** to understand the current architecture, data models, and design patterns.

2. **Align with existing patterns**:
   - Use the established color palette from `src/styles/theme.js`
   - Follow the component structure and naming conventions
   - Respect the state management approach (Context API)
   - Maintain consistency with existing UI/UX patterns

3. **Consider data model compatibility**:
   - All new features must work with existing `Task`, `Habit`, and `Goal` interfaces
   - Extend types in `src/types/index.ts` when adding new properties
   - Ensure backward compatibility with stored data

4. **Follow the development workflow**:
   - Check for existing seed data patterns when adding sample content
   - Consider testing requirements for new functionality
   - Review related documentation in `/docs` directory

5. **Architectural constraints**:
   - Never bypass the Context providers for state management
   - Always use the StorageService for data persistence
   - Maintain the separation between UI components and business logic services

**Failure to follow this protocol may result in inconsistent code, broken functionality, or design mismatches that require significant refactoring.**

---
*Document last updated: 2026-04-07*
*Project Status: Sprint 5 - Final integration phase*
*Completed Screens: Onboarding, Inbox, Voice Recording, Daily Summary*