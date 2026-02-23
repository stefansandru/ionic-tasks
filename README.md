# TaskFlow — Ionic React Task Manager

A full-stack cross-platform **task management application** built with **Ionic React** and a **Node.js (Koa)** backend. Features real-time synchronization, offline support, camera integration, geolocation with interactive maps, and JWT authentication.

---

## Features

### Core Functionality
- **Full CRUD Operations** — Create, read, update, and delete tasks with a clean, intuitive interface
- **Server-side Pagination** — Efficient data loading with offset/limit pagination and page navigation
- **Rich Task Properties** — Each task supports title, description, amount, date, completion status, photos, and location

### Authentication & Security
- **JWT Authentication** — Secure login and signup with JSON Web Tokens
- **Protected Routes** — Higher-Order Component (HOC) pattern for route-level authorization
- **Token Persistence** — Seamless session management via localStorage

### Real-Time & Offline
- **WebSocket Sync** — Instant real-time updates across all connected clients via WebSocket broadcasting
- **Offline Mode** — Full offline support with local caching and pending operation queue
- **Automatic Sync** — Queued operations (create/update/delete) are synced when connectivity is restored
- **Server Status Monitoring** — Live online/offline indicator with periodic health checks
- **Optimistic UI Updates** — Immediate local feedback before server confirmation

### Native Device Features (via Capacitor)
- **Photo Capture** — Take photos directly from the camera and attach them to tasks
- **Geolocation** — Capture current GPS position and assign it to tasks
- **Interactive Maps** — Leaflet/OpenStreetMap integration for viewing and selecting task locations

### UI/UX
- **Dark Mode** — Automatic system-preference-based dark/light theme
- **Smooth Animations** — Custom modal and list item animations using Ionic's Animation API
- **Responsive Design** — Optimized for mobile, tablet, and desktop viewports

---

## Architecture

```
┌─────────────────────────────────┐           ┌──────────────────────────────┐
│      Ionic / React Frontend     │   HTTP    │     Koa Node.js Backend      │
│                                 │◄─────────►│                              │
│  ┌───────────┐ ┌──────────────┐ │   REST    │  ┌────────────────────────┐  │
│  │AuthProvider│ │ TaskProvider │ │           │  │  /api/auth/login       │  │
│  │ (Context)  │ │(Context +   │ │           │  │  /api/auth/signup      │  │
│  │           │ │ useReducer)  │ │           │  │  /api/item (CRUD)      │  │
│  └───────────┘ └──────────────┘ │           │  └────────────────────────┘  │
│                                 │           │                              │
│  ┌───────────────────────────┐  │   WS      │  ┌────────────────────────┐  │
│  │  Offline Storage Layer    │  │◄─────────►│  │  WebSocket Server      │  │
│  │  (localStorage + Cache)   │  │           │  │  (per-user broadcast)  │  │
│  └───────────────────────────┘  │           │  └────────────────────────┘  │
│                                 │           │                              │
│  ┌───────────────────────────┐  │           │  ┌────────────────────────┐  │
│  │  Capacitor Plugins        │  │           │  │  NeDB (JSON file DB)   │  │
│  │  Camera | GPS | FS        │  │           │  │  items.json users.json │  │
│  └───────────────────────────┘  │           │  └────────────────────────┘  │
└─────────────────────────────────┘           └──────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 19 + TypeScript |
| **UI Framework** | Ionic Framework 8 |
| **Native Runtime** | Capacitor 7 |
| **Build Tool** | Vite 5 |
| **Routing** | React Router 5 |
| **HTTP Client** | Axios |
| **Maps** | Leaflet + react-leaflet |
| **Testing** | Cypress (E2E) + Vitest (Unit) |
| **Backend** | Node.js + Koa 2 |
| **Auth** | JWT (jsonwebtoken + koa-jwt) |
| **Database** | NeDB (embedded document store) |
| **Real-Time** | WebSocket (ws) |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Backend Setup

```bash
cd my-node-server-auth
npm install
node src/index.js
```

The API server starts on **http://localhost:3000**.

### Frontend Setup

```bash
cd myApp
npm install
npm run dev
```

The development server starts on **http://localhost:5173**.

### Running on a Mobile Device

```bash
cd myApp
npx ionic capacitor add android   # or ios
npx ionic capacitor sync
npx ionic capacitor open android  # opens in Android Studio / Xcode
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/login` | User login, returns JWT | No |
| `POST` | `/api/auth/signup` | User registration | No |
| `GET` | `/api/item` | Get paginated tasks | Yes |
| `GET` | `/api/item/:id` | Get a single task | Yes |
| `POST` | `/api/item` | Create a new task | Yes |
| `PUT` | `/api/item/:id` | Update a task | Yes |
| `DELETE` | `/api/item/:id` | Delete a task | Yes |

WebSocket connection available at `ws://localhost:3000` (authenticated via JWT token query parameter).

---

## Project Structure

```
├── my-node-server-auth/          # Backend
│   ├── src/
│   │   ├── index.js              # Server entry point
│   │   ├── auth.js               # Authentication routes & JWT logic
│   │   ├── item.js               # Task CRUD routes & data store
│   │   ├── wss.js                # WebSocket server & broadcasting
│   │   └── utils.js              # Utility functions
│   └── db/
│       ├── items.json            # Task data (NeDB)
│       └── users.json            # User data (NeDB)
│
├── myApp/                        # Frontend (Ionic React)
│   ├── src/
│   │   ├── App.tsx               # Root component & routing
│   │   ├── Login.tsx             # Login/Signup page
│   │   ├── auth/
│   │   │   ├── AuthContext.tsx   # Auth state management
│   │   │   └── withAuth.tsx      # Route protection HOC
│   │   ├── core/
│   │   │   ├── apiConfig.ts      # Axios configuration
│   │   │   └── useServerStatus.ts # Server health monitoring
│   │   ├── todo/
│   │   │   ├── TaskList.tsx      # Task list with pagination
│   │   │   ├── TaskEdit.tsx      # Task create/edit form
│   │   │   ├── Task.tsx          # Individual task component
│   │   │   ├── TaskProvider.tsx  # Central task state management
│   │   │   ├── TaskProps.ts      # TypeScript type definitions
│   │   │   ├── itemApi.tsx       # API communication layer
│   │   │   ├── offlineStorage.ts # Local caching & sync queue
│   │   │   └── usePhotoGallery.ts # Camera integration
│   │   └── theme/
│   │       ├── animations.ts     # Custom UI animations
│   │       └── variables.css     # Theme & styling variables
│   └── cypress/                  # E2E test suite
```

---

## Testing

### End-to-End Tests (Cypress)

```bash
cd myApp
npx cypress open
```

### Unit Tests (Vitest)

```bash
cd myApp
npm test
```

---

## Key Design Patterns

- **React Context + useReducer** — Centralized, predictable state management without external dependencies
- **Optimistic Updates** — Mutations apply locally first, with rollback on failure and offline queuing
- **Higher-Order Component (HOC)** — Route protection pattern via `withAuth` wrapper
- **Custom Hooks** — Encapsulated reusable logic (`useServerStatus`, `usePhotoGallery`)
- **WebSocket Event-Driven Sync** — Real-time consistency across multiple clients
- **Offline-First Architecture** — Local cache with pending operation queue and automatic sync

---

## License

This project is open source and available under the [MIT License](LICENSE).
