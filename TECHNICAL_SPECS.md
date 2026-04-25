# Technical Specifications & Architecture
## Elora Web - Business Management System

---

## 🏗 **System Architecture**

### **Frontend Architecture**
```
┌─────────────────────────────────────────┐
│                Browser                   │
├─────────────────────────────────────────┤
│           Next.js Application           │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   Pages     │  │   Components    │   │
│  │   Router    │  │   UI Library    │   │
│  └─────────────┘  └─────────────────┘   │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   Context   │  │   Hooks         │   │
│  │   State     │  │   Utils         │   │
│  └─────────────┘  └─────────────────┘   │
├─────────────────────────────────────────┤
│              API Layer                  │
│         (Axios + Interceptors)          │
├─────────────────────────────────────────┤
│            Backend API                  │
│      (RESTful + Authentication)         │
└─────────────────────────────────────────┘
```

### **Technology Stack**

#### **Core Framework**
```json
{
  "framework": "Next.js 16.2.3",
  "runtime": "React 19.2.5",
  "language": "TypeScript 6.x",
  "styling": "Tailwind CSS 4.2.2",
  "build": "Turbopack (Next.js)",
  "deployment": "Vercel/Netlify Ready"
}
```

#### **Dependencies**
```json
{
  "http_client": "axios ^1.15.0",
  "icons": "lucide-react ^1.8.0",
  "notifications": "react-hot-toast ^2.6.0",
  "utilities": "clsx ^2.1.1",
  "excel_export": "xlsx ^0.18.5",
  "styling_utils": "tailwind-merge ^3.5.0"
}
```

---

## 📁 **Project Structure**

```
elora-web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   │   └── login/         # Login page
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   ├── clients/       # Client management
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── elements/      # Element mapping
│   │   │   ├── enquiries/     # Enquiry management
│   │   │   ├── installation/  # Installation tracking
│   │   │   ├── recce/         # Site reconnaissance
│   │   │   ├── reports/       # Report generation
│   │   │   ├── rfq/           # RFQ management
│   │   │   ├── roles/         # Role management
│   │   │   ├── stores/        # Store operations
│   │   │   ├── users/         # User management
│   │   │   └── layout.tsx     # Dashboard layout
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # Reusable components
│   │   ├── layout/           # Layout components
│   │   │   ├── Header.tsx    # Navigation header
│   │   │   ├── Sidebar.tsx   # Navigation sidebar
│   │   │   └── Footer.tsx    # Footer with branding
│   │   ├── ui/               # UI components
│   │   │   ├── DatePicker.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Skeleton.tsx
│   │   └── LandingPage.tsx   # Landing page component
│   ├── context/              # React Context
│   │   ├── AuthContext.tsx   # Authentication state
│   │   └── ThemeContext.tsx  # Theme management
│   ├── hooks/                # Custom hooks
│   │   └── usePermissions.ts # Permission checking
│   ├── lib/                  # Utilities
│   │   └── api.ts           # API configuration
│   ├── types/               # TypeScript types
│   │   ├── auth.ts          # Authentication types
│   │   └── store.ts         # Store types
│   └── utils/               # Utility functions
│       └── excelExport.ts   # Excel export utility
├── public/                  # Static assets
│   ├── logo.svg            # Company logo
│   └── [other assets]
├── package.json            # Dependencies
├── tsconfig.json          # TypeScript config
├── tailwind.config.js     # Tailwind config
└── next.config.js         # Next.js config
```

---

## 🔐 **Authentication & Security**

### **Authentication Flow**
```typescript
// JWT Token-based Authentication
interface AuthFlow {
  login: {
    endpoint: "/auth/login",
    method: "POST",
    payload: { email: string, password: string },
    response: { user: User, accessToken: string }
  },
  refresh: {
    endpoint: "/auth/refresh",
    method: "POST",
    automatic: true,
    response: { accessToken: string }
  },
  logout: {
    endpoint: "/auth/logout",
    method: "POST",
    cleanup: ["localStorage", "sessionStorage"]
  }
}
```

### **Security Features**
```typescript
// Security Implementation
const securityFeatures = {
  authentication: {
    type: "JWT",
    storage: "localStorage + sessionStorage",
    expiry: "Auto-refresh on 401",
    captcha: "6-character alphanumeric"
  },
  authorization: {
    type: "Role-based Access Control (RBAC)",
    levels: ["SUPER_ADMIN", "ADMIN", "USER"],
    permissions: "Module-level granular control"
  },
  dataProtection: {
    transmission: "HTTPS only",
    storage: "Encrypted local storage",
    validation: "Input sanitization",
    headers: "Security headers implemented"
  }
}
```

---

## 🎨 **UI/UX Architecture**

### **Design System**
```typescript
// Theme Configuration
const themeSystem = {
  colors: {
    primary: "yellow-500",
    secondary: "purple-500",
    accent: "orange-500",
    neutral: "gray-500",
    success: "green-500",
    error: "red-500"
  },
  typography: {
    font: "Inter (Google Fonts)",
    sizes: "text-xs to text-7xl",
    weights: "font-normal to font-black"
  },
  spacing: {
    system: "Tailwind spacing scale",
    containers: "max-w-7xl centered",
    components: "p-4 to p-8 responsive"
  },
  responsive: {
    breakpoints: "sm:640px, md:768px, lg:1024px, xl:1280px",
    approach: "Mobile-first design"
  }
}
```

### **Component Architecture**
```typescript
// Component Hierarchy
interface ComponentStructure {
  layouts: {
    RootLayout: "Global app wrapper",
    DashboardLayout: "Protected route wrapper",
    AuthLayout: "Authentication pages"
  },
  pages: {
    LandingPage: "Public marketing page",
    LoginPage: "Authentication form",
    DashboardPage: "Analytics overview",
    ModulePages: "Feature-specific pages"
  },
  components: {
    Header: "Navigation + user menu",
    Sidebar: "Module navigation",
    Footer: "Branding + links",
    Modal: "Overlay dialogs",
    Forms: "Input components"
  }
}
```

---

## 📊 **State Management**

### **Context Architecture**
```typescript
// State Management Structure
interface StateManagement {
  AuthContext: {
    state: "user, isAuthenticated, isLoading",
    actions: "login, logout, checkAuth",
    persistence: "sessionStorage + localStorage"
  },
  ThemeContext: {
    state: "darkMode",
    actions: "toggleDarkMode",
    persistence: "localStorage"
  },
  ComponentState: {
    type: "useState hooks",
    scope: "Component-level only",
    patterns: "Controlled components"
  }
}
```

### **Data Flow**
```
User Action → Component → Context/Hook → API Call → Response → State Update → UI Re-render
```

---

## 🌐 **API Integration**

### **HTTP Client Configuration**
```typescript
// API Setup
const apiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json"
  },
  interceptors: {
    request: "Auto-attach JWT token",
    response: "Handle 401 with refresh token"
  }
}
```

### **API Endpoints Structure**
```typescript
// Endpoint Categories
interface APIEndpoints {
  auth: {
    login: "POST /auth/login",
    logout: "POST /auth/logout",
    refresh: "POST /auth/refresh",
    me: "GET /auth/me"
  },
  dashboard: {
    stats: "GET /dashboard/stats",
    notifications: "GET /notifications"
  },
  modules: {
    clients: "CRUD /clients",
    stores: "CRUD /stores",
    users: "CRUD /users",
    roles: "CRUD /roles",
    recce: "CRUD /recce",
    installation: "CRUD /installation",
    enquiries: "CRUD /enquiries",
    reports: "GET /reports"
  }
}
```

---

## 📱 **Responsive Design**

### **Breakpoint Strategy**
```css
/* Responsive Breakpoints */
.responsive-design {
  mobile: "320px - 639px (base styles)",
  tablet: "640px - 767px (sm:)",
  laptop: "768px - 1023px (md:)",
  desktop: "1024px - 1279px (lg:)",
  wide: "1280px+ (xl:)"
}
```

### **Mobile-First Approach**
```typescript
// Component Responsiveness
const responsivePatterns = {
  navigation: {
    mobile: "Hamburger menu + overlay",
    desktop: "Fixed sidebar + header"
  },
  layout: {
    mobile: "Single column stack",
    tablet: "2-column grid",
    desktop: "3+ column grid"
  },
  typography: {
    mobile: "text-sm to text-lg",
    desktop: "text-base to text-2xl"
  },
  spacing: {
    mobile: "p-4, gap-4",
    desktop: "p-6, gap-6"
  }
}
```

---

## ⚡ **Performance Optimization**

### **Next.js Optimizations**
```typescript
// Performance Features
const optimizations = {
  rendering: {
    type: "Server-Side Rendering (SSR)",
    hydration: "Selective hydration",
    streaming: "React 18 streaming"
  },
  bundling: {
    tool: "Turbopack",
    splitting: "Automatic code splitting",
    treeshaking: "Dead code elimination"
  },
  assets: {
    images: "Next.js Image optimization",
    fonts: "Google Fonts optimization",
    icons: "SVG icon optimization"
  },
  caching: {
    static: "Automatic static generation",
    api: "Response caching",
    browser: "Browser caching headers"
  }
}
```

### **Loading Strategies**
```typescript
// Loading Patterns
const loadingStrategies = {
  pages: "Skeleton loading screens",
  components: "Lazy loading with Suspense",
  images: "Progressive loading with blur",
  data: "Optimistic updates + error boundaries"
}
```

---

## 🔧 **Development Workflow**

### **Build Process**
```bash
# Development Commands
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint checking
npm run type-check   # TypeScript validation
```

### **Environment Configuration**
```typescript
// Environment Variables
interface EnvConfig {
  NEXT_PUBLIC_API_URL: "Backend API endpoint",
  NEXT_PUBLIC_APP_NAME: "Application name",
  NEXT_PUBLIC_COMPANY_URL: "Company website",
  NODE_ENV: "development | production"
}
```

---

## 🚀 **Deployment Architecture**

### **Deployment Options**
```typescript
// Deployment Platforms
const deploymentOptions = {
  vercel: {
    type: "Serverless",
    features: "Auto-scaling, CDN, Analytics",
    setup: "Zero-config deployment"
  },
  netlify: {
    type: "JAMstack",
    features: "Form handling, Functions",
    setup: "Git-based deployment"
  },
  docker: {
    type: "Containerized",
    features: "Portable, Scalable",
    setup: "Custom infrastructure"
  }
}
```

### **Production Checklist**
```typescript
// Pre-deployment Checklist
const productionChecklist = {
  environment: "✓ Environment variables configured",
  security: "✓ HTTPS enabled, Security headers",
  performance: "✓ Bundle analysis, Lighthouse score",
  monitoring: "✓ Error tracking, Analytics",
  backup: "✓ Database backup, Code repository"
}
```

---

## 🧪 **Testing Strategy**

### **Testing Levels**
```typescript
// Testing Implementation
const testingStrategy = {
  unit: {
    tool: "Jest + React Testing Library",
    coverage: "Components, Hooks, Utils",
    target: "90%+ code coverage"
  },
  integration: {
    tool: "Cypress/Playwright",
    coverage: "User workflows, API integration",
    target: "Critical path testing"
  },
  e2e: {
    tool: "Cypress",
    coverage: "Complete user journeys",
    target: "Business-critical flows"
  }
}
```

---

## 📈 **Monitoring & Analytics**

### **Performance Monitoring**
```typescript
// Monitoring Setup
const monitoring = {
  performance: {
    tool: "Vercel Analytics / Google Analytics",
    metrics: "Core Web Vitals, User engagement",
    alerts: "Performance degradation"
  },
  errors: {
    tool: "Sentry / LogRocket",
    tracking: "Runtime errors, User sessions",
    alerts: "Error rate thresholds"
  },
  business: {
    tool: "Custom dashboard",
    metrics: "User activity, Feature usage",
    reports: "Weekly/Monthly analytics"
  }
}
```

---

## 🔄 **Maintenance & Updates**

### **Update Strategy**
```typescript
// Maintenance Plan
const maintenanceStrategy = {
  dependencies: {
    schedule: "Monthly security updates",
    process: "Automated dependency scanning",
    testing: "Regression testing required"
  },
  features: {
    schedule: "Quarterly feature releases",
    process: "Feature flags + gradual rollout",
    feedback: "User feedback integration"
  },
  security: {
    schedule: "Immediate critical patches",
    process: "Security audit + penetration testing",
    compliance: "Regular security reviews"
  }
}
```

---

## 📞 **Technical Support**

### **Support Levels**
```typescript
// Support Structure
const technicalSupport = {
  documentation: {
    type: "Comprehensive technical docs",
    includes: "API docs, Component library, Deployment guides"
  },
  training: {
    type: "Developer onboarding",
    includes: "Architecture overview, Code walkthrough, Best practices"
  },
  support: {
    type: "Ongoing technical assistance",
    includes: "Bug fixes, Feature requests, Performance optimization"
  }
}
```

---

*This technical specification provides a complete overview of the system architecture, implementation details, and deployment strategies for the Elora Web business management system.*