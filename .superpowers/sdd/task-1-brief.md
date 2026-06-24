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
