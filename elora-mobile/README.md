# Elora Mobile App

React Native mobile application for Elora Crafting Arts that uses the same APIs as the web frontend.

## Features

### 🔐 Authentication
- Login/logout with JWT tokens
- Secure token storage with AsyncStorage
- Auto-logout on token expiry

### 📊 Dashboard
- Real-time analytics and KPIs
- Status breakdown charts
- Recent stores overview
- Quick action buttons
- Monthly trends visualization

### 🏪 Store Management
- Complete store listing with search
- Store details and status tracking
- Location and contact information
- Status-based filtering

### 👥 User Management
- User listing with roles
- Search and filter users
- Role-based permissions
- User status management

### 📋 Recce Tasks
- Recce assignment tracking
- Status-based filtering (Assigned, Submitted, Approved)
- Location and assignment details
- Photo upload capabilities

### 🔧 Installation Tasks
- Installation assignment management
- Progress tracking
- Proof of completion uploads
- Status monitoring

### 💬 Enquiries
- Customer enquiry management
- Status updates (New, Read, Contacted, Resolved)
- Remark system for follow-ups
- Contact information display

### 👤 User Profile
- Personal information display
- Theme toggle (Dark/Light mode)
- Role and permissions view
- Settings management

### 🎨 Theme Support
- Dark/Light mode toggle
- Consistent color scheme
- Adaptive UI components

### 📱 Mobile Optimized
- Responsive design for all screen sizes
- Touch-friendly interface
- Pull-to-refresh functionality
- Smooth navigation transitions

## API Endpoints Used

- `POST /auth/login` - User authentication
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user
- `GET /dashboard/stats` - Dashboard analytics
- `GET /stores` - Store management
- `GET /users` - User management
- `GET /roles` - Role management
- `GET /enquiries` - Enquiry management
- `PUT /enquiries/:id` - Update enquiry status
- Export endpoints for reports

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. Install dependencies:
```bash
cd elora-mobile
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on device/simulator:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

### API Configuration

The app automatically connects to:
- **Development**: `http://localhost:5000/api/v1`
- **Production**: `https://eloracraftingarts.vercel.app/api/v1`

### Project Structure

```
src/
├── components/          # Reusable UI components
├── context/            # React Context (Auth, Theme)
│   ├── AuthContext.js  # Authentication state
│   └── ThemeContext.js # Theme management
├── lib/               # API configuration
│   └── api.js         # Axios setup with interceptors
├── navigation/        # Navigation setup
│   ├── AuthNavigator.js    # Auth flow navigation
│   └── MainNavigator.js    # Main app navigation
└── screens/          # App screens
    ├── LoginScreen.js      # User authentication
    ├── DashboardScreen.js  # Analytics dashboard
    ├── StoresScreen.js     # Store management
    ├── UsersScreen.js      # User management
    ├── EnquiriesScreen.js  # Enquiry management
    ├── RecceScreen.js      # Recce task management
    ├── InstallationScreen.js # Installation tasks
    ├── RolesScreen.js      # Role management
    ├── ReportsScreen.js    # Data exports
    ├── ProfileScreen.js    # User profile
    └── LoadingScreen.js    # Loading states
```

### Screen Features

#### Dashboard
- KPI cards with real-time data
- Status breakdown visualization
- Quick navigation to all modules
- Recent activity feed

#### Stores
- Search and filter functionality
- Store status tracking
- Location information
- Contact details

#### Users
- User listing with search
- Role-based filtering
- Status management
- Profile information

#### Recce Tasks
- Assignment tracking
- Status-based filtering
- Photo upload capability
- Progress monitoring

#### Installation Tasks
- Task assignment view
- Completion tracking
- Proof upload system
- Status updates

#### Enquiries
- Customer message management
- Status workflow
- Remark system
- Contact information

### Building for Production

```bash
# Android
expo build:android

# iOS
expo build:ios
```

## Development Notes

- Uses React Navigation for navigation
- AsyncStorage for local data persistence
- Axios for API calls with interceptors
- Context API for state management
- Responsive design for different screen sizes
- Pull-to-refresh on all list screens
- Error handling and loading states
- Consistent theming system

## Features Matching Web App

✅ **Complete Feature Parity**
- All web app functionality available on mobile
- Same API endpoints and data structure
- Consistent user experience across platforms
- Role-based access control
- Real-time data synchronization