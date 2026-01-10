# Project Context: App Barberia CR

## Overview
This is a booking management web application for a barbershop, built with **React (Vite)** and **Firebase**. It allows clients to sign up, book appointments, and view their history. It likely includes administrative features for managing shifts ("turnos") and bookings.

## Tech Stack
- **Frontend:** React 18, Vite.
- **Language:** JavaScript (ES Modules).
- **Backend / Database:** Firebase (Authentication, Firestore).
- **Hosting:** Firebase Hosting.
- **Routing:** React Router DOM v6.
- **Date Handling:** Moment.js.
- **UI Feedback:** Toastify-js.

## Architecture

### Directory Structure
- `src/pages`: Contains the main application views.
  - `Sign`: Authentication pages (Login/Signup).
  - `Client`: Main application logic, seemingly containing both client and admin views.
- `src/services`: Centralized service layer (`index.js`) handling all Firebase interactions (Auth, Firestore queries, updates).
- `src/components`: Shared UI components (e.g., `Loading`).
- `src/hooks`: Custom React hooks.

### Key Data Models (Firestore)
- **Collections:**
  - `clientes`: User profiles and reservation history.
    - Subcollection: `history`.
  - `turnos`: Slots available for booking. Structured by day of the week (e.g., `turnos/lunes/turnos/{turnoId}`).

### Authentication
- handled via `firebase/auth`.
- `App.jsx` listens to `onAuthStateChanged` to toggle between `SignPage` (public) and `ClientPage` (private).
- Admin status is determined by checking the user's email against `VITE_ADMIN_EMAIL`.

### Conventions & Patterns
- **Service Layer:** All database logic is encapsulated in `src/services/index.js` (e.g., `signIn`, `getTurnos`, `putReserve`). Components call these functions rather than using Firebase SDK directly.
- **Day Handling:** Days are mapped from dates to Spanish day names ("lunes", "martes", etc.) to access specific Firestore collections.
- **Environment Variables:** Configuration (like Admin Email and Firebase Config) is stored in `.env` and accessed via `import.meta.env`.
- **Deployment:** The `deploy` script copies the `dist` build to `firebase-public` before deploying to Firebase Hosting.

## Development
- **Run Dev Server:** `npm run dev`
- **Build:** `npm run build`
- **Deploy:** `npm run deploy`
