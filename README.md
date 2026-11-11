# Hotel Management Admin Panel

This is the standalone admin frontend. It uses the existing
`hotel-management-backend` API; it does not contain a second backend.

## Run locally

1. Start the backend from `hotel-management-backend`.
2. Install this app's dependencies from this folder with `npm install`.
3. Start the admin app with `npm run dev`.
4. Open `http://localhost:5174` and sign in with an `ADMIN` or `SUPER_ADMIN`
   account.

The API defaults to `http://localhost:5000/api`. To use another API URL, set
`VITE_API_URL` in a local `.env` file.

## Structure

```text
hotel-management-admin/
  src/
    components/admin/       # Admin sidebar and dashboard widgets
    pages/admin/            # Admin dashboard page
    pages/                  # Admin sign-in page
    services/               # Authentication and dashboard API requests
    styles/                 # Admin panel styles
    App.jsx
    index.css
    main.jsx
```
