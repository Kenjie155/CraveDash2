# CraveDash database setup

## 1. Run the schema
1. Open your project at https://supabase.com/dashboard, then **SQL Editor → New query**.
2. Paste the whole of `cravedash_schema.sql` and click **Run**. It is safe to run again; it never deletes data.
3. Check **Table Editor**: you should see profiles, restaurants, menu_items, riders, orders and the rest. Sample restaurants, menu items and riders are added only when the database has no restaurants.

## 2. Environment variables
Supabase dashboard → **Project Settings → API Keys** (or API).
| File | Variable | Value |
|---|---|---|
| `customer-app/.env` | `EXPO_PUBLIC_SUPABASE_URL` | Project URL |
| `customer-app/.env` | `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`) |
| `admin-dashboard/.env` | `VITE_SUPABASE_URL` | Project URL |
| `admin-dashboard/.env` | `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key |

Copy each `.env.example` to `.env` first. Never put the service-role / secret key in either app.
Restart after editing: `npx expo start -c` and `npm run dev`.

## 3. Auth settings
**Authentication → Providers → Email** is enabled by default.
- For quick testing, turn off **Confirm email** so new accounts can sign in immediately. Turn it back on for production.
- **Authentication → URL Configuration**: set Site URL to your admin URL (e.g. `http://localhost:5173`) for now.

## 4. Create the first administrator
Customer sign-up never grants admin rights. Roles can only be written from the SQL Editor.
1. Sign up with your admin email in the customer app (or create the user under Authentication → Users).
2. In the SQL Editor run (use your email):
```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'you@example.com'
on conflict do nothing;
```
3. Log in to the admin dashboard with that account.

## 5. Storage
The script creates a public bucket `cravedash-images` (anyone can view, only admins can upload). The dashboard currently takes image **URLs**; upload files in **Storage → cravedash-images** and paste the public URL.

## 6. Route preview Edge Function (optional but recommended)
```
npm install -g supabase            (or use npx supabase ...)
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set GOOGLE_MAPS_API_KEY=your_google_key
supabase functions deploy route-directions
```
Enable the **Directions API** on that Google key. Without it the app still shows the map and a straight line, with a setup message.

## 7. Test permissions
Run in the SQL Editor after creating a normal customer, replacing the UUID with that customer's id:
```sql
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"<customer-uuid>","role":"authenticated"}', true);
update public.orders set total = 0;                          -- expect 0 rows / permission denied
select public.admin_set_payment_status('<order-uuid>','paid'); -- expect "Not authorized"
insert into public.user_roles values ('<customer-uuid>','admin'); -- expect permission denied
```

## 8. Troubleshooting
| Message | Fix |
|---|---|
| `relation "public.profiles" does not exist` | Run the whole script top to bottom in one go. |
| `Not authorized` in the dashboard | The logged-in user has no `admin` row in `user_roles` (step 4). |
| `Invalid API key` / `Failed to fetch` | Wrong URL/key in `.env`, or you did not restart the dev server. |
| `That rider is busy` | A rider can hold 2 active orders. Pick another or finish existing ones. |
| Sign-up works but sign-in says "Email not confirmed" | Confirm the email or turn off Confirm email (step 3). |
| Empty menu in the app | Sample data only loads into an empty database. Add restaurants and items in the dashboard. |
