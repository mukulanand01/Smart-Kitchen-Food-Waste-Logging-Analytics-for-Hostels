# Smart Kitchen Frontend

A web-based dashboard for tracking and analyzing food waste in the kitchen.

## 📁 Project Structure

```
frontend/
├── index.html           # Login page
├── dashboard.html       # Main dashboard view (after login)
├── logwaste.html        # Form to log new waste entries
├── records.html         # View all waste records
├── monthly.html         # Monthly waste reports
├── analytics.html       # Data visualization & analytics
├── test.html            # Testing/debug page
├── script.js            # Core JavaScript functions
├── style.css            # Styling for all pages
└── README.md            # This file
```

## 🔐 Authentication

- **Default Login**: Username: `admin` | Password: `1234`
- Authentication state stored in localStorage under `login` key
- Protected pages redirect to login if not authenticated

## 📄 Pages Overview

| Page | File | Purpose |
|------|------|---------|
| Login | `index.html` | User authentication |
| Dashboard | `dashboard.html` | Main hub with summary & quick actions |
| Log Waste | `logwaste.html` | Form to submit new waste records |
| Records | `records.html` | Complete list of all waste entries |
| Monthly | `monthly.html` | Monthly waste statistics & trends |
| Analytics | `analytics.html` | Visualizations & insights |
| Test | `test.html` | Testing & debugging utilities |

## ⚙️ Core Functions (script.js)

- **`handleLogin(e)`** - Validates credentials and sets auth state
- **`logout()`** - Clears auth and redirects to login
- **`checkAuth()`** - Protects pages by verifying login status
- **`toggleMode()`** - Switches between light/dark mode
- **`logWaste()`** - Submits waste record to API
- **`getWasteData()`** - Fetches waste data from backend
- **`loadWasteTable()`** - Populates table with waste records

## 🔌 API Connection

- **API Base URL**: `http://localhost:5000/api/waste`
- **Method**: POST (log waste), GET (retrieve data)
- **Data Format**: JSON with fields: `food`, `waste`, `date`

## 🎨 Styling

All pages use a unified design system defined in `style.css`:
- Responsive layout
- Light/dark mode support
- Clean, user-friendly interface

## 🚀 Getting Started

1. Ensure backend is running on `http://localhost:5000`
2. Open `index.html` in a web browser
3. Login with default credentials
4. Start logging and viewing waste data

## 📝 Notes

- All form inputs reference specific HTML element IDs (ensure they match across pages)
- Dark mode preference is applied to the entire page
- Authentication persists across page refreshes
