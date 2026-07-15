# Exeleris — One-Time Setup Guide

This guide gets your website connected to its own real database and login system.
You only do this once, and none of it requires coding. Total time: about 15 minutes.

---

## Part 1 — Create your free Supabase account

Supabase is the service that stores your users, projects, bids, and uploaded files.

1. Go to **https://supabase.com** in your browser.
2. Click **Start your project** and sign up (you can use your email, or "Continue with GitHub" if you have one).
3. Once you're in, click **New project**.
4. Fill in the form:
   - **Name:** type `Exeleris`
   - **Database Password:** click **Generate a password**, then copy it and save it somewhere safe (a password manager or private note). You rarely need it, but don't lose it.
   - **Region:** pick the one closest to you (for the US, an East or West region is fine).
5. Click **Create new project** and wait 1–2 minutes while it sets up.

## Part 2 — Copy your two keys into the website

The website needs two pieces of text so it knows how to reach *your* database.

1. In Supabase, look at the left sidebar and click the **gear icon (Project Settings)**.
2. Click **Data API** (sometimes shown as just **API**).
3. You'll see **Project URL** — click **Copy** next to it.
4. On your computer, open the project folder `Exeleris Project` (on your Desktop), and open the file called **`.env`** with Notepad (right-click → Open with → Notepad).
5. Paste the URL right after `VITE_SUPABASE_URL=` so the line looks like:
   ```
   VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
   ```
   (no spaces, no quotation marks)
6. Back in Supabase, on the same settings area find **API Keys** and copy the key labelled **anon / public** (it's a very long block of letters). Do **not** use the one labelled "service_role" — that one is secret and never goes in the website.
7. Paste it after `VITE_SUPABASE_ANON_KEY=` in the same `.env` file:
   ```
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...(very long)...
   ```
8. Save the file and close Notepad.

## Part 3 — Build your database (one copy-paste)

1. In Supabase's left sidebar, click **SQL Editor** (the icon that looks like a terminal/page).
2. Click **New query**.
3. On your computer, open the file **`supabase/setup.sql`** inside the project folder (right-click → Open with → Notepad).
4. Select **everything** in it (Ctrl+A), copy (Ctrl+C), and paste it into the Supabase SQL Editor (Ctrl+V).
5. Click **Run** (bottom right).
6. You should see **"Success. No rows returned"**. That's it — your database now has all its tables, security rules, and the 30 sample marketplace projects.

> If you ever see an error saying something "already exists", it means the script was already run before — that's fine, don't run it twice.

## Part 4 — Let people sign in without email confirmation (for now)

While you're testing, it's easier if new accounts work instantly:

1. In Supabase's left sidebar, click **Authentication**.
2. Click **Sign In / Providers** (or **Providers**).
3. Click **Email**.
4. Turn **OFF** the switch called **Confirm email**.
5. Click **Save**.

(Later, when the site goes live, you can switch this back on so people must verify their email address.)

## Part 5 — Start the website

1. Open the project in the tool you normally use (Claude Code / terminal).
2. Run the site with `npm run dev` — or just ask Claude to "start the site".
3. Open the address it shows (usually **http://localhost:8080**).

## Part 6 — Make yourself the Super Admin

1. On the website, click **Get Started** and create a **Business** account using **your own email** (`gagan@repeatable.ai`). Any company name is fine.
2. Go back to Supabase → **SQL Editor** → **New query**, paste this one line, and click **Run**:
   ```sql
   update public.profiles set role = 'super_admin' where email = 'gagan@repeatable.ai';
   ```
3. On the website, **sign out and sign back in**. Your dashboard is now the Admin dashboard. 👑

## Part 7 — Approving experts (until the admin panel is built)

New experts start as "pending approval" and can't bid. To approve one, run this in the SQL Editor
(replace the email with the expert's email):

```sql
update public.expert_profiles set approval_status = 'approved'
where id = (select id from public.profiles where email = 'expert@example.com');
```

The full point-and-click admin panel for this is coming in a later session.

---

## Testing checklist (plain English)

Do these in order — about 5 minutes:

1. **Browse without an account:** open the site, click **Browse Jobs** in the header. You should see the 30 sample projects with working category filters.
2. **Create a business account:** click **Get Started** → choose **Business** → fill the form. You should land on a dashboard that says "My Projects".
3. **Post a project:** click **Post a Project**, fill in a title, category, description, budget, deadline; attach a file and tick **Confidential** on it; click **Publish to Marketplace**. Then check it appears at the top of **Browse Jobs**.
4. **Save a draft:** post another project but click **Save as Draft**. It should show on your dashboard marked **Draft** — and should NOT appear on Browse Jobs. On the draft's card, click **Publish to Marketplace** and confirm it now appears on Browse Jobs. (Each project card also has a **Delete** button, handy for clearing out test projects.)
5. **Sign out** (click your name in the header → Sign Out).
6. **Create an expert account:** click **Get Started** → choose **Expert** → fill everything in. Your dashboard should show a friendly banner saying your application is being reviewed.
7. **Try to bid while pending:** open **Browse Jobs**, click **Submit Bid** on any project. You should see the "being reviewed" message instead of a bid form.
8. **Approve yourself as a test:** run the Part 7 SQL with the expert's email, then refresh the site. Now the bid form should appear — submit a bid with a rate and hours. Your expert dashboard should list the bid.
9. **Bid twice:** try to bid on the same project again — the site should politely tell you that you already bid.
10. **Check role locks:** while signed in as the expert, try visiting `/submit-project` directly in the address bar — you should be bounced back to your dashboard.
11. **Super Admin:** sign in with your own (admin) account — your dashboard should show the Users / Transactions / Settings placeholder page.

If every step works, the marketplace is officially real. 🎉
