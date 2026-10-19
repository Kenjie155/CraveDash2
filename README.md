# CraveDash

Food delivery: `customer-app/` (Expo + TypeScript), `admin-dashboard/` (Vite + React + TypeScript), `database/` (Supabase SQL), `supabase/` (Edge Function).

## Quick start (Windows)
Requires Node.js 22.13 or newer (nodejs.org, LTS). The customer app targets **Expo SDK 57** (React Native 0.86), which matches Expo Go 57.x. Do not run `expo@latest`; it may jump to a newer SDK that your Expo Go cannot open.

1. Set up Supabase first: follow `database/README.md` (run the SQL, copy the URL and publishable key, make yourself admin).
2. Customer app. Open a terminal:
```
cd customer-app
copy .env.example .env
npm install
npx expo install expo@^57.0.0 --fix
npx expo start
```
Edit `.env` with your Supabase URL and publishable key, then press `r` or restart with `npx expo start -c`. Scan the QR code with Expo Go (phone and PC on the same Wi-Fi).

3. Admin dashboard. Open a second terminal:
```
cd admin-dashboard
copy .env.example .env
npm install
npm run dev -- --host 0.0.0.0
```
Open http://localhost:5173 (Expo uses 8081).

From the repo root you can also run `npm run install:all`, then `npm run customer` and `npm run admin` in two terminals.

## Keys
| Key | Where |
|---|---|
| Supabase URL + publishable key | `customer-app/.env`, `admin-dashboard/.env` |
| Google Directions key | Supabase secret `GOOGLE_MAPS_API_KEY` (never in the apps) |

## Maps and Expo Go
`react-native-maps` works in Expo Go (Apple Maps on iOS, Google Maps on Android). Google Maps on iOS, or custom map keys, need an Expo development build (`npx expo run:android` / EAS).

## Map area
Sample restaurants are placed in San Carlos City, Negros Occidental (about 10.48°N, 123.41°E). Map imagery loads live from Apple/Google Maps, so it is always current. Edit restaurant coordinates in the admin dashboard to match real locations.

## Dark mode
Customer app: tap the 🌙/☀️ button in the top-right of any tab, or use the Dark mode switch in Profile. Admin dashboard: Dark mode button in the sidebar. Both remember your choice and start from your device setting the first time.

## Currency
All prices and delivery fees are in Philippine pesos (₱). Sample menu prices and rider fees use typical San Carlos–area levels; adjust them in the admin dashboard.

## What works
Sign-up/login/logout with persistent sessions, forgot-password email, browse and search, categories, favorites, cart, checkout with Cash on Delivery and rider selection, map location picker, order history and status tracker, route preview map (no live tracking), full admin dashboard (orders, status, rider assignment, COD payment, restaurants, menu, categories, riders, customers).

## Known limitations
- Nothing here has been installed, type-checked, built, or run against a live Supabase project. Expect to fix small errors on first run.
- In-app password reset screen is not included. The reset email is sent, but you finish the reset with Supabase's hosted flow.
- Admin cannot upload image files from the UI; paste image URLs.
- Rider assigned-user login is supported in the database (`riders.user_id`, read access to their orders) but there is no rider app.
- Riders (including phone) are readable by any signed-in user so customers can choose one.
- Dashboard revenue/orders totals read up to the API's default row limit; use a SQL view or RPC for large volumes.
