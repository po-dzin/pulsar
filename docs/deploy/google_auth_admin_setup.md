# Google Auth + Admin Setup (Supabase + Vercel)

## 1) Vercel Environment Variables
Add these in Vercel Project Settings -> Environment Variables:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`

Use the same values as in local `.env.local`.

## 2) Supabase Auth URL Settings
In Supabase -> Authentication -> URL Configuration:

1. `Site URL`:
   - production domain (for example `https://your-app.vercel.app` or custom domain)
2. `Redirect URLs`:
   - production callback: `https://your-app.vercel.app/auth/callback`
   - preview callback pattern if used
   - local callback: `http://localhost:3000/auth/callback`

## 3) Google OAuth Provider in Supabase
In Supabase -> Authentication -> Providers -> Google:

1. Enable Google provider.
2. Set Google Client ID / Client Secret.
3. In Google Cloud Console, add Supabase callback URL from provider screen to Authorized redirect URIs.

## 4) Admin Role Bootstrap
After first login, grant admin role in Supabase SQL editor:

```sql
insert into public.admin_roles (user_id, role)
values ('<auth_user_uuid>', 'admin')
on conflict (user_id, role) do nothing;
```

Then open `/admin` and manage roles/content/leads from UI.

## 5) Post-Deploy Smoke Checklist
1. Open `/diagnostics` unauthenticated and verify Google button is visible.
2. Login with Google and verify redirect returns to the same page.
3. Complete test and verify result + history are saved.
4. Open `/admin` with admin account and verify roles/users/leads/content panels load.
5. Submit consultation on `/products` and verify the lead appears in admin panel.
