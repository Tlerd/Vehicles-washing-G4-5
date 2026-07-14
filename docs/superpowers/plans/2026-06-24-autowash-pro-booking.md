# AutoWash Pro Booking Wizard & Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Front-end web application structure for AutoWash Pro, including the customer Login/Registration portal and the 5-step Booking Wizard, based on VinaWash specifications.

**Architecture:** Single-Page Multi-step Wizard on a single route `/booking`. State is managed by a centralized `BookingContext` and individual steps are rendered conditionally.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide React (icons), Axios.

## Global Constraints
- **Language**: Single-language English UI.
- **Theme**: Dark/Light mode supported via CSS variables and Tailwind `dark:` modifier. Primary dark background is `#031427`.
- **Styling**: Modern minimal glassmorphism. Brand primary accent color is `#f97316` (orange).
- **Structure**: Follow the Front-end guidelines: pages under `src/pages`, components under `src/components`, API services under `src/services`, and keep files under 300 lines.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `Front-end/package.json`
- Create: `Front-end/vite.config.ts`
- Create: `Front-end/tsconfig.json`
- Create: `Front-end/postcss.config.js`
- Create: `Front-end/tailwind.config.js`
- Create: `Front-end/index.html`

**Interfaces:**
- Consumes: None
- Produces: The base React development environment structure.

- [ ] **Step 1: Create `package.json`**
  Write file [package.json](file:///d:/demoSWP/demo1/Front-end/package.json):
  ```json
  {
    "name": "autowash-pro-frontend",
    "private": true,
    "version": "1.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build",
      "preview": "vite preview"
    },
    "dependencies": {
      "axios": "^1.6.8",
      "lucide-react": "^0.378.0",
      "react": "^18.3.1",
      "react-dom": "^18.3.1"
    },
    "devDependencies": {
      "@types/react": "^18.3.3",
      "@types/react-dom": "^18.3.0",
      "@vitejs/plugin-react": "^4.3.0",
      "autoprefixer": "^10.4.19",
      "postcss": "^8.4.38",
      "tailwindcss": "^3.4.3",
      "typescript": "^5.2.2",
      "vite": "^5.2.11"
    }
  }
  ```

- [ ] **Step 2: Create `vite.config.ts`**
  Write file [vite.config.ts](file:///d:/demoSWP/demo1/Front-end/vite.config.ts):
  ```typescript
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';

  export default defineConfig({
    plugins: [react()],
    server: {
      port: 3000,
      host: true
    }
  });
  ```

- [ ] **Step 3: Create `tsconfig.json`**
  Write file [tsconfig.json](file:///d:/demoSWP/demo1/Front-end/tsconfig.json):
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "useDefineForClassFields": true,
      "lib": ["DOM", "DOM.Iterable", "ScriptHost", "ES2022"],
      "module": "ESNext",
      "skipLibCheck": true,
      "moduleResolution": "bundler",
      "allowImportingTsExtensions": true,
      "resolveJsonModule": true,
      "isolatedModules": true,
      "noEmit": true,
      "jsx": "react-jsx",
      "strict": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noFallthroughCasesInSwitch": true
    },
    "include": ["src"]
  }
  ```

- [ ] **Step 4: Create Tailwind configurations**
  Write file [postcss.config.js](file:///d:/demoSWP/demo1/Front-end/postcss.config.js):
  ```javascript
  export default {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  }
  ```
  Write file [tailwind.config.js](file:///d:/demoSWP/demo1/Front-end/tailwind.config.js):
  ```javascript
  /** @type {import('tailwindcss').Config} */
  export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          brand: {
            orange: '#f97316',
            lightOrange: '#ffedd5',
          },
          darkBg: '#031427',
          darkSurface: '#0f172a',
          darkBorder: '#1e293b'
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
        }
      },
    },
    plugins: [],
  }
  ```

- [ ] **Step 5: Create `index.html`**
  Write file [index.html](file:///d:/demoSWP/demo1/Front-end/index.html):
  ```html
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>AutoWash Pro</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body class="bg-slate-50 text-slate-800 dark:bg-darkBg dark:text-slate-100 min-h-screen font-sans antialiased transition-colors duration-200">
      <div id="root"></div>
      <script type="module" src="/src/main.tsx"></script>
    </body>
  </html>
  ```

- [ ] **Step 6: Commit**
  Since command runner may fail, commit after file creation or during execution.

---

### Task 2: Core Styling & Theme Context

**Files:**
- Create: `Front-end/src/main.tsx`
- Create: `Front-end/src/index.css`
- Create: `Front-end/src/context/ThemeContext.tsx`

**Interfaces:**
- Consumes: Scaffolding configuration.
- Produces: `ThemeContext` providing `theme` ('light'|'dark') and `toggleTheme()`.

- [ ] **Step 1: Create `src/index.css`**
  Write file [index.css](file:///d:/demoSWP/demo1/Front-end/src/index.css):
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  @layer components {
    .glass-card {
      @apply bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl;
    }
    .glass-input {
      @apply bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-orange dark:focus:ring-brand-orange transition-all;
    }
    .btn-primary {
      @apply bg-brand-orange hover:bg-orange-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-darkBg;
    }
    .btn-secondary {
      @apply bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium py-2.5 px-4 rounded-lg transition-colors focus:outline-none;
    }
  }
  ```

- [ ] **Step 2: Create `ThemeContext.tsx`**
  Write file [ThemeContext.tsx](file:///d:/demoSWP/demo1/Front-end/src/context/ThemeContext.tsx):
  ```typescript
  import React, { createContext, useContext, useEffect, useState } from 'react';

  type Theme = 'light' | 'dark';
  interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
  }

  const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

  export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    return (
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  };

  export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
  };
  ```

- [ ] **Step 3: Create `src/main.tsx`**
  Write file [main.tsx](file:///d:/demoSWP/demo1/Front-end/src/main.tsx):
  ```typescript
  import React from 'react';
  import ReactDOM from 'react-dom/client';
  import App from './App.tsx';
  import './index.css';
  import { ThemeProvider } from './context/ThemeContext.tsx';

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>,
  );
  ```

---

### Task 3: Customer Authentication UI

**Files:**
- Create: `Front-end/src/pages/auth/AuthPage.tsx`
- Create: `Front-end/src/App.tsx`

**Interfaces:**
- Consumes: `ThemeContext`
- Produces: Landing screen allowing Login, Registration, or Guest Checkout.

- [ ] **Step 1: Create `AuthPage.tsx`**
  Write file [AuthPage.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/auth/AuthPage.tsx):
  ```typescript
  import React, { useState } from 'react';
  import { useTheme } from '../../context/ThemeContext';
  import { Sun, Moon, Car, ShieldAlert, Sparkles, Trophy } from 'lucide-react';

  interface AuthPageProps {
    onStartBooking: (isGuest: boolean, customerData?: any) => void;
  }

  export const AuthPage: React.FC<AuthPageProps> = ({ onStartBooking }) => {
    const { theme, toggleTheme } = useTheme();
    const [isLogin, setIsLogin] = useState(true);
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [licensePlate, setLicensePlate] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');

    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      // Mock Authentication
      onStartBooking(false, { name: 'Demo Member', phone, licensePlate: '51F-12345', vehicleModel: 'Mazda 3', tier: 'Silver' });
    };

    const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      onStartBooking(false, { name, phone, licensePlate, vehicleModel, tier: 'Member' });
    };

    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-4 flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Car className="text-brand-orange w-8 h-8" />
            <span className="text-xl font-bold tracking-tight">AutoWash <span className="text-brand-orange">Pro</span></span>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-400" />}
          </button>
        </header>

        {/* Main Split Portal */}
        <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 flex flex-col md:flex-row gap-8 items-center justify-center">
          {/* Card 1: Member Section */}
          <div className="w-full md:w-1/2 glass-card p-8 min-h-[480px] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{isLogin ? 'Log In' : 'Sign Up'}</h2>
                <button onClick={() => setIsLogin(!isLogin)} className="text-sm font-semibold text-brand-orange hover:underline">
                  {isLogin ? 'Create an account' : 'Back to Login'}
                </button>
              </div>

              {isLogin ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Phone Number</label>
                    <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="glass-input" placeholder="e.g. +84901234567" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Password</label>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="glass-input" placeholder="••••••••" />
                  </div>
                  <button type="submit" className="w-full btn-primary mt-4">Sign In</button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Full Name</label>
                      <input type="text" required value={name} onChange={e => setName(e.target.value)} className="glass-input" placeholder="John Doe" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Phone</label>
                      <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="glass-input" placeholder="+84..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">License Plate</label>
                      <input type="text" required value={licensePlate} onChange={e => setLicensePlate(e.target.value)} className="glass-input" placeholder="e.g. 51F-12345" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Vehicle Model</label>
                      <input type="text" required value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} className="glass-input" placeholder="Toyota Camry" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Password</label>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="glass-input" placeholder="Minimum 6 characters" />
                  </div>
                  <button type="submit" className="w-full btn-primary mt-2">Sign Up & Start</button>
                </form>
              )}
            </div>

            {/* Loyalty tier highlights */}
            <div className="mt-8 border-t border-slate-200/50 dark:border-slate-800/50 pt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-slate-100/50 dark:bg-slate-800/30">
                <Sparkles className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                <span className="font-semibold block">Silver Tier</span>
                <span className="text-[10px] text-slate-400">10 days booking</span>
              </div>
              <div className="p-2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Trophy className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                <span className="font-semibold block">Gold Tier</span>
                <span className="text-[10px] text-amber-500">12 days booking</span>
              </div>
              <div className="p-2 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Trophy className="w-4 h-4 mx-auto mb-1 text-cyan-500" />
                <span className="font-semibold block">Platinum Tier</span>
                <span className="text-[10px] text-cyan-500">14 days booking</span>
              </div>
            </div>
          </div>

          {/* Card 2: Guest Section */}
          <div className="w-full md:w-1/2 glass-card p-8 min-h-[480px] flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Quick Booking</h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">Guest Checkout</span>
              <p className="mt-6 text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                Short on time? You can book your vehicle appointment in just 2 minutes without creating an account. 
              </p>
              <div className="mt-4 p-4 rounded-xl bg-orange-500/10 text-brand-orange border border-orange-500/20 text-xs flex gap-3">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>An account will be generated automatically for you using your Phone Number + License Plate to save your loyalty points.</span>
              </div>
            </div>
            <button onClick={() => onStartBooking(true)} className="w-full btn-secondary py-3 text-center border border-slate-300 dark:border-slate-700">
              Start Quick Booking
            </button>
          </div>
        </main>
      </div>
    );
  };
  ```

- [ ] **Step 2: Create `App.tsx`**
  Write file [App.tsx](file:///d:/demoSWP/demo1/Front-end/src/App.tsx):
  ```typescript
  import React, { useState } from 'react';
  import { AuthPage } from './pages/auth/AuthPage';

  export default function App() {
    const [view, setView] = useState<'auth' | 'booking'>('auth');
    const [user, setUser] = useState<any>(null);

    const handleStartBooking = (isGuest: boolean, customerData?: any) => {
      setUser(isGuest ? { isGuest: true, tier: 'Member' } : { ...customerData, isGuest: false });
      setView('booking');
    };

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-darkBg dark:text-slate-100 transition-colors duration-200">
        {view === 'auth' ? (
          <AuthPage onStartBooking={handleStartBooking} />
        ) : (
          <div className="p-8 text-center">
            <h1 className="text-3xl font-bold">Booking Wizard Coming Soon!</h1>
            <p className="mt-4">User: {JSON.stringify(user)}</p>
            <button onClick={() => setView('auth')} className="btn-primary mt-6">Go Back</button>
          </div>
        )}
      </div>
    );
  }
  ```

---

### Task 4: Booking Context & Progress Header

**Files:**
- Create: `Front-end/src/context/BookingContext.tsx`
- Create: `Front-end/src/pages/booking/BookingPage.tsx`
- Create: `Front-end/src/pages/booking/components/BookingHeader.tsx`

**Interfaces:**
- Consumes: `ThemeContext`
- Produces: Centralized `BookingContext` and step progressive header for `/booking`.

- [ ] **Step 1: Create `BookingContext.tsx`**
  Write file [BookingContext.tsx](file:///d:/demoSWP/demo1/Front-end/src/context/BookingContext.tsx):
  ```typescript
  import React, { createContext, useContext, useState } from 'react';

  export type VehicleSize = 'hatchback' | 'sedan' | 'suv' | 'pickup';

  export interface BookingData {
    currentStep: number;
    vehicleSize: VehicleSize;
    branchId: string | null;
    selectedDate: string | null;
    selectedTime: string | null;
    selectedServices: string[];
    customerInfo: {
      name: string;
      phone: string;
      email: string;
      licensePlate: string;
      vehicleModel: string;
      createAccount?: boolean;
      password?: string;
    };
  }

  interface BookingContextType {
    state: BookingData;
    updateState: (updates: Partial<BookingData> | ((prev: BookingData) => Partial<BookingData>)) => void;
    resetBooking: () => void;
    multiplier: number;
  }

  const BookingContext = createContext<BookingContextType | undefined>(undefined);

  const initialData: BookingData = {
    currentStep: 1,
    vehicleSize: 'sedan',
    branchId: null,
    selectedDate: null,
    selectedTime: null,
    selectedServices: [],
    customerInfo: { name: '', phone: '', email: '', licensePlate: '', vehicleModel: '' }
  };

  const multipliers: Record<VehicleSize, number> = {
    hatchback: 0.9,
    sedan: 1.0,
    suv: 1.2,
    pickup: 1.4
  };

  export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<BookingData>(initialData);

    const updateState = (updates: Partial<BookingData> | ((prev: BookingData) => Partial<BookingData>)) => {
      setState(prev => {
        const resolved = typeof updates === 'function' ? updates(prev) : updates;
        return { ...prev, ...resolved };
      });
    };

    const resetBooking = () => setState(initialData);
    const multiplier = multipliers[state.vehicleSize];

    return (
      <BookingContext.Provider value={{ state, updateState, resetBooking, multiplier }}>
        {children}
      </BookingContext.Provider>
    );
  };

  export const useBooking = () => {
    const context = useContext(BookingContext);
    if (!context) throw new Error('useBooking must be used within BookingProvider');
    return context;
  };
  ```

- [ ] **Step 2: Create `BookingHeader.tsx`**
  Write file [BookingHeader.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/BookingHeader.tsx):
  ```typescript
  import React from 'react';
  import { useBooking, VehicleSize } from '../../../context/BookingContext';
  import { Car, Check } from 'lucide-react';

  const steps = [
    { number: 1, name: 'Branch' },
    { number: 2, name: 'Services' },
    { number: 3, name: 'Date & Time' },
    { number: 4, name: 'Information' },
    { number: 5, name: 'Confirmation' }
  ];

  export const BookingHeader: React.FC = () => {
    const { state, updateState } = useBooking();

    return (
      <header className="px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md sticky top-0 z-50 bg-white/70 dark:bg-darkBg/70">
        <div className="flex items-center gap-2">
          <Car className="text-brand-orange w-8 h-8" />
          <span className="text-xl font-bold tracking-tight">AutoWash <span className="text-brand-orange">Pro</span></span>
        </div>

        {/* 5-Step Stepper */}
        <div className="flex items-center gap-2 md:gap-4 overflow-x-auto max-w-full pb-2 md:pb-0">
          {steps.map((s, index) => {
            const isCompleted = state.currentStep > s.number;
            const isActive = state.currentStep === s.number;

            return (
              <React.Fragment key={s.number}>
                <div className="flex items-center gap-1.5 md:gap-2 whitespace-nowrap">
                  <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                    isCompleted ? 'bg-green-500 border-green-500 text-white' :
                    isActive ? 'bg-brand-orange border-brand-orange text-white' :
                    'border-slate-300 dark:border-slate-700 text-slate-400'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : s.number}
                  </div>
                  <span className={`text-xs md:text-sm font-medium ${isActive ? 'text-brand-orange font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                    {s.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-4 md:w-8 h-0.5 ${state.currentStep > s.number ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Vehicle Size Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Car Size:</label>
          <select 
            value={state.vehicleSize} 
            onChange={(e) => updateState({ vehicleSize: e.target.value as VehicleSize })}
            className="glass-input py-1 text-sm font-semibold border-slate-300 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="hatchback">Hatchback (x0.9)</option>
            <option value="sedan">Sedan (x1.0)</option>
            <option value="suv">SUV / CUV (x1.2)</option>
            <option value="pickup">Pickup / Luxury (x1.4)</option>
          </select>
        </div>
      </header>
    );
  };
  ```

---

### Task 5: Wizard Step 1 & Step 2 (Branch & Schedule)

**Files:**
- Create: `Front-end/src/pages/booking/components/StepBranch.tsx`
- Create: `Front-end/src/pages/booking/components/StepSchedule.tsx`

**Interfaces:**
- Consumes: `BookingContext`
- Produces: Steps 1 & 2 selection cards.

- [ ] **Step 1: Create `StepBranch.tsx`**
  Write file [StepBranch.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepBranch.tsx):
  ```typescript
  import React from 'react';
  import { useBooking } from '../../../context/BookingContext';
  import { MapPin, Clock } from 'lucide-react';

  const branches = [
    { id: 'b1', name: 'VinaWash District 1', hours: '8:00 AM - 8:00 PM', address: '123 Nguyen Hue, Ben Nghe, D1' },
    { id: 'b2', name: 'VinaWash District 7', hours: '8:00 AM - 8:00 PM', address: '456 Nguyen Van Linh, Tan Phong, D7' }
  ];

  export const StepBranch: React.FC = () => {
    const { state, updateState } = useBooking();

    return (
      <div className="max-w-xl mx-auto py-8">
        <h2 className="text-2xl font-bold mb-2 text-center">Select Location Branch</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-8">Choose the wash branch closest to you.</p>

        <div className="space-y-4">
          {branches.map((b) => {
            const isSelected = state.branchId === b.id;
            return (
              <div 
                key={b.id}
                onClick={() => updateState({ branchId: b.id })}
                className={`glass-card p-6 cursor-pointer border-2 transition-all flex justify-between items-start ${
                  isSelected ? 'border-brand-orange ring-1 ring-brand-orange bg-orange-50/5 dark:bg-orange-500/5' : 'border-transparent'
                }`}
              >
                <div className="flex gap-4">
                  <MapPin className={`w-6 h-6 mt-1 ${isSelected ? 'text-brand-orange' : 'text-slate-400'}`} />
                  <div>
                    <h3 className="font-bold text-lg">{b.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{b.address}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mt-3">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{b.hours}</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full border border-green-500/20">
                  Available Slots
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end mt-8">
          <button 
            disabled={!state.branchId}
            onClick={() => updateState({ currentStep: 2 })}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Schedule
          </button>
        </div>
      </div>
    );
  };
  ```

- [ ] **Step 2: Create `StepSchedule.tsx`**
  Write file [StepSchedule.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepSchedule.tsx):
  ```typescript
  import React from 'react';
  import { useBooking } from '../../../context/BookingContext';
  import { Calendar, Clock, Info } from 'lucide-react';

  // Helper to generate next 7 days
  const getDates = () => {
    const dates = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        value: d.toISOString().split('T')[0],
        dayName: weekdays[d.getDay()],
        dateNum: d.getDate(),
        month: months[d.getMonth()]
      });
    }
    return dates;
  };

  // Helper to generate 30 minute time slots
  const getTimeSlots = () => {
    const slots = [];
    for (let h = 8; h < 20; h++) {
      const hStr = h.toString().padStart(2, '0');
      slots.push(`${hStr}:00`);
      slots.push(`${hStr}:30`);
    }
    return slots;
  };

  const datesList = getDates();
  const timeSlots = getTimeSlots();

  export const StepSchedule: React.FC = () => {
    const { state, updateState } = useBooking();

    return (
      <div className="max-w-3xl mx-auto py-8">
        <h2 className="text-2xl font-bold mb-2 text-center">Select Date & Time</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-6">Times are formatted in 30-minute intervals.</p>

        {/* Date Selector Slider */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> 1. Select Date</h3>
            <div className="text-xs text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded">
              <Info className="w-3.5 h-3.5 text-brand-orange" />
              <span>Gold/Platinum tiers unlock 12-14 days booking window.</span>
            </div>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
            {datesList.map((d) => {
              const isSelected = state.selectedDate === d.value;
              return (
                <div 
                  key={d.value}
                  onClick={() => updateState({ selectedDate: d.value })}
                  className={`glass-card p-3 text-center cursor-pointer border-2 transition-all flex flex-col justify-center ${
                    isSelected ? 'border-brand-orange bg-orange-50/5 dark:bg-orange-500/5' : 'border-transparent'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400">{d.dayName}</span>
                  <span className="text-lg font-bold my-1">{d.dateNum}</span>
                  <span className="text-[10px] text-slate-400">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Selector Grid */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-3"><Clock className="w-4 h-4" /> 2. Select Time</h3>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {timeSlots.map((ts) => {
              const isSelected = state.selectedTime === ts;
              // Mock fully booked slots (e.g. 10:00 and 10:30)
              const isBooked = ts === '10:00' || ts === '10:30';

              return (
                <button
                  key={ts}
                  disabled={isBooked}
                  onClick={() => updateState({ selectedTime: ts })}
                  className={`py-2 px-3 border rounded-lg text-sm font-semibold transition-all ${
                    isBooked ? 'bg-slate-100 text-slate-300 border-slate-200 dark:bg-slate-900/30 dark:text-slate-800 dark:border-slate-900/50 cursor-not-allowed opacity-55' :
                    isSelected ? 'border-brand-orange bg-brand-orange text-white' :
                    'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                  }`}
                >
                  {ts}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between mt-8 border-t border-slate-200/50 dark:border-slate-800/50 pt-6">
          <button onClick={() => updateState({ currentStep: 2 })} className="btn-secondary">Back</button>
          <button 
            disabled={!state.selectedDate || !state.selectedTime}
            onClick={() => updateState({ currentStep: 4 })}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Information
          </button>
        </div>
      </div>
    );
  };
  ```

---

### Task 6: Wizard Step 3 (Services Catalog & Accordions)

**Files:**
- Create: `Front-end/src/pages/booking/components/StepServices.tsx`

**Interfaces:**
- Consumes: `BookingContext`, VinaWash services data schema
- Produces: Service Accordions & Details toggles, Cart sticky column.

- [ ] **Step 1: Create `StepServices.tsx`**
  Write file [StepServices.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepServices.tsx):
  ```typescript
  import React, { useState } from 'react';
  import { useBooking } from '../../../context/BookingContext';
  import { ChevronDown, ChevronUp, Clock, Info, CheckCircle2 } from 'lucide-react';

  // Single Source of Truth VinaWash Menu
  const vinawashMenu = {
    rua_xe_and_combo: {
      title: "Rửa xe & combo",
      items: [
        { id: "vw_basic", name: "VW Basic Wash", price: 180000, duration: 20, categoryType: 'EXPRESS', group: 'rua_xe', detail: "Bao gồm rửa xe ngoài, rửa gầm, hút bụi và lau nội thất." },
        { id: "vw_detail", name: "VW Detail Wash", price: 280000, duration: 20, categoryType: 'EXPRESS', group: 'rua_xe', detail: "Detail Wash là gói rửa xe kỹ hơn Basic Wash, phù hợp cho xe cần làm sạch sâu hơn ở cả ngoại thất, gầm xe và khu vực nội thất cơ bản. Bao gồm: Rửa xe ngoài, Rửa gầm, Hút bụi nội thất, Lau nội thất cơ bản, Vệ sinh mặt sau lazang, Vệ sinh khe kẽ nội thất, Dưỡng nhựa nhám/đen ngoại thất và dưỡng ron cửa nội thất bằng dung dịch Boronax VRP cao cấp." },
        { id: "vw_ultimate", name: "VW Ultimate Wash", price: 640000, duration: 40, categoryType: 'DETAILING', group: 'rua_xe', detail: "Ultimate Wash là gói rửa và chăm sóc xe toàn diện hơn, kết hợp làm sạch ngoại thất, gầm, nội thất cơ bản, khử mùi và tăng độ bóng bề mặt sơn. Bao gồm toàn bộ quy trình Detail Wash kết hợp khử mùi bằng công nghệ C-AirFog và Wax sáp bóng Carnauba cao cấp." },
        { id: "rua_ngoai", name: "Rửa xe ngoài", price: 90000, duration: 20, categoryType: 'EXPRESS', group: 'rua_xe', detail: "Làm sạch ngoại thất cơ bản." },
        { id: "rua_gam", name: "Rửa gầm", price: 50000, duration: 20, categoryType: 'EXPRESS', group: 'rua_xe', detail: "Xịt áp lực cao vệ sinh bùn đất khung gầm." }
      ]
    },
    ve_sinh_trong: {
      title: "Vệ sinh trong",
      items: [
        { id: "interior_super", name: "Vệ sinh nội thất Super Clean", price: 1400000, duration: 120, categoryType: 'DETAILING', group: 've_sinh_trong', detail: "Gói dọn nội thất chuyên sâu cơ bản. Bao gồm: Giặt ghế da/nỉ, vệ sinh trần, vệ sinh mặt taplo, vệ sinh tapi cửa, vệ sinh khe kẽ nội thất/cửa, vệ sinh cửa gió máy lạnh, khử mùi bằng máy ozone, dưỡng ghế da và chi tiết nhựa." },
        { id: "interior_ultimate", name: "Vệ sinh nội thất Ultimate Clean", price: 1900000, duration: 180, categoryType: 'DETAILING', group: 've_sinh_trong', detail: "Gói dọn nội thất cao cấp. Thực hiện tháo toàn bộ ghế xe để làm sạch sâu, giặt trần sàn, vệ sinh taplo, khe kẽ, khe điều hòa, khử mùi máy ozone và dưỡng chi tiết nhựa/da." },
        { id: "interior_plus", name: "Vệ sinh nội thất Ultimate Clean Plus", price: 2300000, duration: 240, categoryType: 'DETAILING', group: 've_sinh_trong', detail: "Phiên bản nâng cấp tối đa. Tháo rời toàn bộ ghế và tháo toàn bộ thảm sàn xe để giặt sàn và khử mùi sàn chuyên biệt, xử lý triệt để xe bị ngập nước, ẩm mốc hoặc đổ thức ăn nước uống." },
        { id: "ghe_le", name: "Xử lý vị trí ngồi trên nội thất (1 vị trí)", price: 350000, duration: 30, categoryType: 'EXPRESS', group: 've_sinh_trong', detail: "Xử lý vết bẩn cục bộ trên từng vị trí ghế." },
        { id: "noi_soi_1", name: "Vệ sinh nội soi / dàn lạnh", price: 1200000, duration: 60, categoryType: 'DETAILING', group: 've_sinh_trong', detail: "Làm sạch dàn lạnh bằng công nghệ nội soi camera." }
      ]
    },
    ve_sinh_ngoai: {
      title: "Vệ sinh ngoài",
      items: [
        { id: "khoang_may", name: "Vệ sinh khoang máy", price: 800000, duration: 120, categoryType: 'DETAILING', group: 've_sinh_ngoai', detail: "Dọn dẹp bụi bẩn, dầu mỡ khoang động cơ bằng hơi nước nóng." },
        { id: "tay_nhua_duong", name: "Tẩy nhựa đường", price: 400000, duration: 60, categoryType: 'EXPRESS', group: 've_sinh_ngoai', detail: "Tẩy sạch các vết nhựa đường bám quanh sườn xe." }
      ]
    },
    xu_ly_be_mat: {
      title: "Xử lý bề mặt",
      items: [
        { id: "polish_basic", name: "Đánh bóng sơn xe Basic", price: 1500000, duration: 120, categoryType: 'DETAILING', group: 'xu_ly_be_mat', detail: "Đánh bóng hiệu năng 1 bước, clay bề mặt và tẩy keo nhựa đường. Xóa xước quầng xoáy nhẹ 60-70%." },
        { id: "polish_hieu_chinh", name: "Đánh bóng sơn xe hiệu chỉnh", price: 2200000, duration: 240, categoryType: 'DETAILING', group: 'xu_ly_be_mat', detail: "Hiệu chỉnh khuyết tật sơn chuyên sâu 3 bước tiêu chuẩn 3M. Xóa xước dăm và quầng xoáy nặng từ 90-98%." }
      ]
    },
    bao_ve: {
      title: "Bảo vệ",
      items: [
        { id: "ceramic_2", name: "Pro Coating (Ceramic 2 lớp)", price: 8500000, duration: 360, categoryType: 'DETAILING', group: 'bao_ve', detail: "Phủ ceramic bảo vệ sơn độ bền cao." },
        { id: "ppf_dopon", name: "PPF Dopon Save Protection 7.5 mil", price: 21000000, duration: 720, categoryType: 'DETAILING', group: 'bao_ve', detail: "Dán phim bảo vệ chống trầy xước đá văng." },
        { id: "film_3m", name: "Phim cách nhiệt 3M Crystalline", price: 15600000, duration: 240, categoryType: 'DETAILING', group: 'bao_ve', detail: "Dán phim cách nhiệt quang học cao cấp nhất của 3M." }
      ]
    }
  };

  export const StepServices: React.FC = () => {
    const { state, updateState, multiplier } = useBooking();
    const [activeTab, setActiveTab] = useState<'EXPRESS' | 'DETAILING'>('EXPRESS');
    const [openedCategories, setOpenedCategories] = useState<Record<string, boolean>>({ rua_xe_and_combo: true });
    const [openedDetails, setOpenedDetails] = useState<Record<string, boolean>>({});

    const toggleCategory = (catKey: string) => {
      setOpenedCategories(prev => ({ ...prev, [catKey]: !prev[catKey] }));
    };

    const toggleDetails = (itemId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenedDetails(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    const handleServiceToggle = (itemId: string) => {
      updateState(prev => {
        const isSelected = prev.selectedServices.includes(itemId);
        const selectedServices = isSelected
          ? prev.selectedServices.filter(id => id !== itemId)
          : [...prev.selectedServices, itemId];
        return { selectedServices };
      });
    };

    // Calculate details for Cart
    const allItems = Object.values(vinawashMenu).flatMap(cat => cat.items);
    const selectedItemsDetails = allItems.filter(item => state.selectedServices.includes(item.id));
    const totalTime = selectedItemsDetails.reduce((sum, item) => sum + item.duration, 0);
    const totalPrice = selectedItemsDetails.reduce((sum, item) => sum + (item.price * multiplier), 0);

    // Filter items based on active tab
    const getFilteredMenu = () => {
      const filtered: Record<string, { title: string; items: typeof allItems }> = {};
      Object.entries(vinawashMenu).forEach(([catKey, cat]) => {
        const tabItems = cat.items.filter(item => item.categoryType === activeTab);
        if (tabItems.length > 0) {
          filtered[catKey] = {
            title: cat.title,
            items: tabItems
          };
        }
      });
      return filtered;
    };

    const filteredMenu = getFilteredMenu();

    return (
      <div className="flex flex-col md:flex-row gap-8 py-4">
        {/* Left: Service Selection Accordions */}
        <div className="flex-1 space-y-4">
          <h2 className="text-2xl font-bold mb-2">Select Care Services</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Service prices are automatically multiplier-adjusted based on selected Car Size.</p>

          {/* Tab Switcher */}
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl max-w-md mb-6">
            <button
              onClick={() => setActiveTab('EXPRESS')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'EXPRESS'
                  ? 'bg-brand-orange text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              Express Wash & Add-ons
            </button>
            <button
              onClick={() => setActiveTab('DETAILING')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'DETAILING'
                  ? 'bg-brand-orange text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              Detailing & Premium Combos
            </button>
          </div>

          {Object.entries(filteredMenu).map(([catKey, cat]) => {
            const isCatOpen = !!openedCategories[catKey];
            return (
              <div key={catKey} className="glass-card overflow-hidden">
                {/* Accordion Header */}
                <div 
                  onClick={() => toggleCategory(catKey)}
                  className="flex justify-between items-center px-6 py-4 cursor-pointer bg-slate-100/30 dark:bg-slate-900/30 border-b border-slate-200/50 dark:border-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">{cat.title}</span>
                    <span className="text-xs bg-brand-orange/10 text-brand-orange border border-brand-orange/20 px-2 py-0.5 rounded-full font-semibold">
                      {cat.items.length} items
                    </span>
                  </div>
                  {isCatOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>

                {/* Accordion Body */}
                {isCatOpen && (
                  <div className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                    {cat.items.map((item) => {
                      const isSelected = state.selectedServices.includes(item.id);
                      const isDetailOpen = !!openedDetails[item.id];
                      const adjustedPrice = item.price * multiplier;

                      return (
                        <div key={item.id} className="p-4 transition-colors hover:bg-slate-50/20 dark:hover:bg-slate-900/10">
                          <div className="flex justify-between items-center gap-4">
                            {/* Checkbox + Details label */}
                            <div className="flex items-start gap-3 cursor-pointer flex-1" onClick={() => handleServiceToggle(item.id)}>
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-5 h-5 rounded text-brand-orange focus:ring-brand-orange border-slate-300 dark:border-slate-800 accent-orange-500 mt-1 cursor-pointer"
                              />
                              <div>
                                <span className={`font-semibold text-base ${isSelected ? 'text-brand-orange' : ''}`}>{item.name}</span>
                                <div className="text-xs text-slate-400 dark:text-slate-500 flex gap-2 items-center mt-1">
                                  <span>{item.duration} mins</span>
                                  <span>•</span>
                                  <span>{cat.title}</span>
                                </div>
                              </div>
                            </div>

                            {/* Price & Action */}
                            <div className="text-right flex items-center gap-3">
                              <span className="font-bold text-brand-orange">{adjustedPrice.toLocaleString('vi-VN')} VND</span>
                              <button 
                                onClick={(e) => toggleDetails(item.id, e)}
                                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-800 flex items-center gap-1"
                              >
                                {isDetailOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Details Panel */}
                          {isDetailOpen && (
                            <div className="mt-3 p-4 bg-amber-500/5 text-amber-900 dark:text-amber-100/90 text-sm border border-amber-500/10 rounded-xl leading-relaxed">
                              {item.detail}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Sticky Cart Sidebar */}
        <div className="w-full md:w-80 shrink-0">
          <div className="glass-card p-6 sticky top-24">
            <h3 className="font-bold text-lg border-b border-slate-200/50 dark:border-slate-800/50 pb-3 mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-brand-orange w-5 h-5" /> Booking Summary
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Size multiplier:</span>
                <span className="font-semibold uppercase text-brand-orange">{state.vehicleSize} (x{multiplier})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-semibold flex items-center gap-1"><Clock className="w-4 h-4 text-slate-400" /> {totalTime} mins</span>
              </div>
              <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Selected Packages</span>
                {selectedItemsDetails.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No services selected yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {selectedItemsDetails.map(item => (
                      <span key={item.id} className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 py-1 px-2.5 rounded-full block border border-slate-200 dark:border-slate-700">
                        {item.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-3 mt-4 flex justify-between items-end">
                <span className="font-bold text-slate-500">Total Price:</span>
                <span className="font-extrabold text-xl text-brand-orange">{totalPrice.toLocaleString('vi-VN')} VND</span>
              </div>
            </div>

            <button 
              disabled={selectedItemsDetails.length === 0}
              onClick={() => updateState({ currentStep: 4 })}
              className="w-full btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Details
            </button>
            <button onClick={() => updateState({ currentStep: 2 })} className="w-full btn-secondary mt-2 text-sm py-2">
              Back to Date & Time
            </button>
          </div>
        </div>
      </div>
    );
  };
  ```

---

### Task 7: Wizard Step 4 & Step 5 (Details, Payment & Success)

**Files:**
- Create: `Front-end/src/pages/booking/components/StepContact.tsx`
- Create: `Front-end/src/pages/booking/components/StepPayment.tsx`
- Modify: `Front-end/src/pages/booking/BookingPage.tsx`
- Modify: `Front-end/src/App.tsx`

**Interfaces:**
- Consumes: `BookingContext`
- Produces: Contact form and Bank Transfer Checkout layout.

- [ ] **Step 1: Create `StepContact.tsx`**
  Write file [StepContact.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepContact.tsx):
  ```typescript
  import React from 'react';
  import { useBooking } from '../../../context/BookingContext';
  import { User, Phone, Mail, Car, CreditCard } from 'lucide-react';

  export const StepContact: React.FC = () => {
    const { state, updateState } = useBooking();

    const handleInputChange = (field: string, value: any) => {
      updateState(prev => ({
        customerInfo: { ...prev.customerInfo, [field]: value }
      }));
    };

    const isFormValid = 
      state.customerInfo.name && 
      state.customerInfo.phone && 
      state.customerInfo.licensePlate && 
      state.customerInfo.vehicleModel &&
      (!state.customerInfo.createAccount || state.customerInfo.password);

    return (
      <div className="max-w-2xl mx-auto py-8">
        <h2 className="text-2xl font-bold mb-2 text-center">Contact Information</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-8">Please provide your details below. Asters (*) are required.</p>

        <div className="glass-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Full Name *
              </label>
              <input 
                type="text" 
                required 
                value={state.customerInfo.name} 
                onChange={e => handleInputChange('name', e.target.value)} 
                className="glass-input" 
                placeholder="John Doe" 
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Phone Number *
              </label>
              <input 
                type="tel" 
                required 
                value={state.customerInfo.phone} 
                onChange={e => handleInputChange('phone', e.target.value)} 
                className="glass-input" 
                placeholder="+84..." 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Car className="w-3.5 h-3.5" /> License Plate *
              </label>
              <input 
                type="text" 
                required 
                value={state.customerInfo.licensePlate} 
                onChange={e => handleInputChange('licensePlate', e.target.value)} 
                className="glass-input" 
                placeholder="e.g. 51F-12345" 
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Car className="w-3.5 h-3.5" /> Vehicle Model *
              </label>
              <input 
                type="text" 
                required 
                value={state.customerInfo.vehicleModel} 
                onChange={e => handleInputChange('vehicleModel', e.target.value)} 
                className="glass-input" 
                placeholder="Toyota Camry" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Email Address
            </label>
            <input 
              type="email" 
              value={state.customerInfo.email} 
              onChange={e => handleInputChange('email', e.target.value)} 
              className="glass-input" 
              placeholder="name@example.com" 
            />
          </div>

          {/* Create Account Checkbox */}
          <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4 mt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={!!state.customerInfo.createAccount}
                onChange={e => handleInputChange('createAccount', e.target.checked)}
                className="w-5 h-5 rounded text-brand-orange focus:ring-brand-orange accent-orange-500 cursor-pointer"
              />
              <span className="text-sm font-semibold">Create an account to track points & history</span>
            </label>

            {state.customerInfo.createAccount && (
              <div className="flex flex-col gap-1 mt-4 max-w-sm">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Account Password</label>
                <input 
                  type="password" 
                  required 
                  value={state.customerInfo.password || ''} 
                  onChange={e => handleInputChange('password', e.target.value)} 
                  className="glass-input" 
                  placeholder="Minimum 6 characters" 
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button onClick={() => updateState({ currentStep: 3 })} className="btn-secondary">Back</button>
          <button 
            disabled={!isFormValid}
            onClick={() => updateState({ currentStep: 5 })}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Payment
          </button>
        </div>
      </div>
    );
  };
  ```

- [ ] **Step 2: Create `StepPayment.tsx`**
  Write file [StepPayment.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepPayment.tsx):
  ```typescript
  import React, { useState } from 'react';
  import { useBooking } from '../../../context/BookingContext';
  import { CreditCard, CheckCircle2, QrCode } from 'lucide-react';

  // Single Source of Truth VinaWash Menu to recalculate price
  const vinawashMenu = {
    rua_xe_and_combo: { items: [{ id: "vw_basic", price: 180000 }, { id: "vw_detail", price: 280000 }, { id: "vw_ultimate", price: 640000 }, { id: "rua_ngoai", price: 90000 }, { id: "rua_gam", price: 50000 }] },
    ve_sinh_trong: { items: [{ id: "interior_super", price: 1400000 }, { id: "interior_ultimate", price: 1900000 }, { id: "interior_plus", price: 2300000 }, { id: "ghe_le", price: 350000 }, { id: "noi_soi_1", price: 1200000 }] },
    ve_sinh_ngoai: { items: [{ id: "khoang_may", price: 800000 }, { id: "tay_nhua_duong", price: 400000 }] },
    xu_ly_be_mat: { items: [{ id: "polish_basic", price: 1500000 }, { id: "polish_hieu_chinh", price: 2200000 }] },
    bao_ve: { items: [{ id: "ceramic_2", price: 8500000 }, { id: "ppf_dopon", price: 21000000 }, { id: "film_3m", price: 15600000 }] }
  };

  interface StepPaymentProps {
    onCompleteBooking: () => void;
  }

  export const StepPayment: React.FC<StepPaymentProps> = ({ onCompleteBooking }) => {
    const { state, multiplier } = useBooking();
    const [isConfirmed, setIsConfirmed] = useState(false);

    const allItems = Object.values(vinawashMenu).flatMap(cat => cat.items);
    const totalPrice = state.selectedServices.reduce((sum, serviceId) => {
      const item = allItems.find(i => i.id === serviceId);
      return sum + (item ? item.price * multiplier : 0);
    }, 0);

    const bookingRef = "AWP-381927"; // Mock Booking Reference ID

    if (isConfirmed) {
      return (
        <div className="max-w-md mx-auto py-12 text-center space-y-6">
          <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Booking Ref: <span className="font-bold text-brand-orange">{bookingRef}</span>
            </p>
          </div>
          <div className="glass-card p-6 text-sm text-left leading-relaxed">
            <p className="font-semibold mb-1">Status: Pending Verification</p>
            <p className="text-slate-500 dark:text-slate-400">
              Our staff is checking the manual bank transfer transaction. We will call or send an SMS confirmation to your number: <span className="font-bold">{state.customerInfo.phone}</span> shortly.
            </p>
          </div>
          <button onClick={onCompleteBooking} className="btn-primary w-full">Back to Home</button>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto py-8">
        <h2 className="text-2xl font-bold mb-2 text-center">Payment & Final Confirmation</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-8">Scan the VietQR code to make a 100% manual bank transfer.</p>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: QR code and Transfer details */}
          <div className="flex-1 glass-card p-6 space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
              <QrCode className="text-brand-orange w-5 h-5" /> Bank Transfer
            </h3>

            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Fake QR Image placeholder */}
              <div className="w-44 h-44 bg-white border-2 border-slate-200 dark:border-slate-700 rounded-xl p-2 flex flex-col justify-between items-center text-slate-800">
                <div className="w-full text-center font-bold text-blue-800 text-[10px]">VietQR</div>
                <div className="w-32 h-32 bg-slate-100 flex items-center justify-center border border-slate-200 border-dashed text-slate-400">
                  QR Placeholder
                </div>
                <div className="w-full text-center text-slate-400 text-[8px]">Scan with Banking App</div>
              </div>

              {/* Bank accounts description */}
              <div className="flex-1 space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 pb-1">
                  <span className="text-slate-400">Bank:</span>
                  <span className="font-semibold">Vietcombank (VCB)</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 pb-1">
                  <span className="text-slate-400">Account Name:</span>
                  <span className="font-semibold">VINAWASH CO. LTD</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 pb-1">
                  <span className="text-slate-400">Account Number:</span>
                  <span className="font-mono font-semibold text-brand-orange">1234567890</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 pb-1">
                  <span className="text-slate-400">Amount:</span>
                  <span className="font-bold text-brand-orange">{totalPrice.toLocaleString('vi-VN')} VND</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Description:</span>
                  <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 py-0.5 px-2 rounded">{bookingRef}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed pt-2">
              * Note: Please write the exact description reference above to ensure automatic mapping. After the transfer is completed, click the button below to submit.
            </p>
          </div>

          {/* Right: Booking Summary sticky card */}
          <div className="w-full md:w-80 shrink-0">
            <div className="glass-card p-6">
              <h3 className="font-bold text-lg border-b border-slate-200/50 dark:border-slate-800/50 pb-3 mb-4">
                Booking Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Branch:</span>
                  <span className="font-semibold">{state.branchId === 'b1' ? 'District 1' : 'District 7'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-semibold">{state.selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time:</span>
                  <span className="font-semibold">{state.selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle:</span>
                  <span className="font-semibold">{state.customerInfo.vehicleModel} ({state.vehicleSize})</span>
                </div>
                <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-3 flex justify-between items-end">
                  <span className="font-bold text-slate-500">Total:</span>
                  <span className="font-extrabold text-brand-orange text-lg">{totalPrice.toLocaleString('vi-VN')} VND</span>
                </div>
              </div>

              <button 
                onClick={() => setIsConfirmed(true)}
                className="btn-primary w-full mt-6"
              >
                Confirm & Submit Booking
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  ```

- [ ] **Step 3: Create `BookingPage.tsx`**
  Write file [BookingPage.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/BookingPage.tsx):
  ```typescript
  import React from 'react';
  import { useBooking } from '../../context/BookingContext';
  import { BookingHeader } from './components/BookingHeader';
  import { StepBranch } from './components/StepBranch';
  import { StepSchedule } from './components/StepSchedule';
  import { StepServices } from './components/StepServices';
  import { StepContact } from './components/StepContact';
  import { StepPayment } from './components/StepPayment';

  interface BookingPageProps {
    onComplete: () => void;
  }

  export const BookingPage: React.FC<BookingPageProps> = ({ onComplete }) => {
    const { state } = useBooking();

    return (
      <div className="min-h-screen flex flex-col pb-16">
        <BookingHeader />
        
        <main className="flex-1 max-w-6xl mx-auto w-full px-6 mt-6">
          {state.currentStep === 1 && <StepBranch />}
          {state.currentStep === 2 && <StepServices />}
          {state.currentStep === 3 && <StepSchedule />}
          {state.currentStep === 4 && <StepContact />}
          {state.currentStep === 5 && <StepPayment onCompleteBooking={onComplete} />}
        </main>
      </div>
    );
  };
  ```

- [ ] **Step 4: Modify `App.tsx`**
  Replace file [App.tsx](file:///d:/demoSWP/demo1/Front-end/src/App.tsx):
  ```typescript
  import React, { useState } from 'react';
  import { AuthPage } from './pages/auth/AuthPage';
  import { BookingPage } from './pages/booking/BookingPage';
  import { BookingProvider } from './context/BookingContext';

  export default function App() {
    const [view, setView] = useState<'auth' | 'booking'>('auth');
    const [user, setUser] = useState<any>(null);

    const handleStartBooking = (isGuest: boolean, customerData?: any) => {
      setUser(isGuest ? { isGuest: true, tier: 'Member' } : { ...customerData, isGuest: false });
      setView('booking');
    };

    const handleComplete = () => {
      setView('auth');
      setUser(null);
    };

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-darkBg dark:text-slate-100 transition-colors duration-200">
        {view === 'auth' ? (
          <AuthPage onStartBooking={handleStartBooking} />
        ) : (
          <BookingProvider>
            <BookingPage onComplete={handleComplete} />
          </BookingProvider>
        )}
      </div>
    );
  }
  ```

---

## Verification Plan

### Automated Tests
*   Since running terminal commands fails due to PowerShell redirection permissions in this workspace, no dev compilation commands are executed.

### Manual Verification
1.  Verify correct landing on `AuthPage` (split cards for login and guest booking).
2.  Select "Start Quick Booking" and verify redirection to `/booking` (Step 1: Branch).
3.  Choose branch and proceed to Step 2 (Schedule: Date & Time). Verify horizontal date slider is limited to 7 days for guest/member and 30-minute intervals are listed.
4.  Proceed to Step 3 (Services). Check Accordion collapse and details expand, and that price adjustments apply immediately when selecting different Car Sizes in the header.
5.  Check Cart Sidebar updates correctly.
6.  Proceed to Step 4 (Contact Info). Check required validation of name, phone, license plate, and password when clicking the "Create account" checkbox.
7.  Check Step 5 (Payment). Verify VietQR placeholder and transaction information matches the selected services and totals. Confirm and verify redirection back to portal.
