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

## Part 7 — Approving experts

New experts start as "pending approval" and can't bid. Once you've run **Part 9**
below, you approve (or reject) them with two clicks in the **Admin area →
Experts** tab — no SQL needed. Rejecting lets you add a reason, which is sent to
the expert as a notification.

> Prefer SQL? You can still approve an expert directly in the SQL Editor
> (replace the email with the expert's email):
> ```sql
> update public.expert_profiles set approval_status = 'approved'
> where id = (select id from public.profiles where email = 'expert@example.com');
> ```

---

## Testing checklist (plain English)

Do these in order — about 5 minutes:

1. **Browse without an account:** open the site, click **Browse Jobs** in the header. You should see the 30 sample projects with working category filters.
2. **Create a business account:** click **Get Started** → choose **Business** → fill the form. You should land on a dashboard that says "My Projects".
3. **Post a project:** click **Post a Project**, fill in a title, category, description, budget, deadline; attach a file and tick **Confidential** on it; click **Publish to Marketplace**. Then check it appears at the top of **Browse Jobs**.
4. **Save a draft:** post another project but click **Save as Draft**. It should show on your dashboard marked **Draft** — and should NOT appear on Browse Jobs. On the draft's card, click **Publish to Marketplace** and confirm it now appears on Browse Jobs. (Each project card also has a **Delete** button, handy for clearing out test projects.)
5. **Sign out** (click your name in the header → Sign Out).
6. **Create an expert account:** click **Get Started** → choose **Expert** → fill everything in. Your dashboard should show a friendly banner saying your application is being reviewed.
7. **Try to bid while pending:** open **Browse Jobs**, click **View Details** on any project, then **Submit Bid**. You should see the "being reviewed" message instead of a bid form.
8. **Approve yourself as a test:** run the Part 7 SQL with the expert's email, then refresh the site. Now the bid form should appear — submit a bid with a price and hours. Your expert dashboard should list the bid.
9. **Bid twice:** try to bid on the same project again — the site should politely tell you that you already bid.
10. **Check role locks:** while signed in as the expert, try visiting `/submit-project` directly in the address bar — you should be bounced back to your dashboard.
11. **Super Admin:** sign in with your own (admin) account — you should land on the **Admin area** (the Overview, with live numbers). If you haven't run Part 9 yet, do that first.

If every step works, the marketplace is officially real. 🎉

---

## Part 8 — Turn on real bidding & the bid comparison screen (one more copy-paste)

This is the second (and, for now, final) database step. It adds everything the
new bidding features need: the transaction record, notifications, the commission
setting, and the safe "accept a winner" action. It only **adds** to your
database — your accounts and your 30 projects are untouched.

1. In Supabase's left sidebar, click **SQL Editor** → **New query**.
2. On your computer, open the file **`supabase/bidding_upgrade.sql`** inside the
   project folder (right-click → Open with → Notepad).
3. Select **everything** (Ctrl+A), copy (Ctrl+C), paste into the SQL Editor (Ctrl+V).
4. Click **Run**. You should see **"Success. No rows returned."**

> If you ever see a message that something "already exists", that's fine — it
> just means the file was already run. It's safe to run again.

**About the commission:** the platform commission starts at **15%** and lives in
a settings table (not hard-coded), so a future Super-Admin screen will be able to
change it. Every accepted bid records the exact commission used at that moment,
so your money history stays accurate even if you change the rate later.

---

## Testing checklist — the full bidding journey (plain English)

Do this after Part 8. You'll need two accounts: your **business** account and one
**expert** account (approve the expert first in the **Admin area → Experts**, or
with the Part 7 SQL). About 10 minutes.

1. **Expert places a bid.** Sign in as the approved expert → **Browse Jobs** →
   **View Details** on a project → **Submit Bid**. Enter a **price for the whole
   job** and **estimated hours** — notice the **price-per-hour** updates live as
   you type. Add a completion date, approach, experience, and a question, then
   **Submit Bid**. It should appear under **My Bids** with a **Pending** badge.
2. **One bid per project.** Open that same project again — instead of a new form
   you should see "You've already submitted a bid" with a link to view it.
3. **Edit / withdraw.** On **My Bids**, while the bid is **Pending**, try **Edit**
   (change the price and save) and confirm the change sticks. (You can also
   **Withdraw** here — try it on a throwaway bid.)
4. **Business sees the new bid.** Sign in as the business. The **bell** in the
   header should show a red count, and clicking it shows "New bid received".
   Your dashboard project card should show **"1 bid received"**.
5. **Compare bids.** Click **Compare bids** on the project. Each bid shows the
   expert's name and headline, price, hours, price-per-hour, completion date,
   and their approach/experience/questions (long text has **Read more**). Try
   the **Sort by** menu (cheapest / fewest hours / newest), the **Show
   shortlisted only** switch, and **Shortlist** a bid. The cheapest bid is
   gently highlighted.
6. **Accept a winner.** Click **Accept** on a bid. A window shows the money split:
   **bid amount**, **platform commission (15%)**, and **expert receives** — all
   formatted like `$1,250.00`. Click **Confirm & Accept**.
7. **Check what happened automatically:**
   - The winning bid is now **Accepted**; every other bid on that project is
     **Declined**.
   - The project is now **In Progress** and has **disappeared from Browse Jobs**.
   - The expert's dashboard shows the win under **Active Projects**, and the bell
     notified them ("Bid accepted 🎉"). Any losing experts were notified too.
8. **Check the money record.** In Supabase → **Table Editor** → **transactions**.
   There should be one row for this project with the correct **total_amount**,
   **commission_percent (15)**, **platform_earnings**, and **expert_payout**
   (total minus commission). This is the permanent record for your future
   payments.

If all eight steps work, the heart of the marketplace is beating. ❤️

> Note on confidential files: on a project's detail page, any file marked
> **Confidential** shows as **locked** ("Available after your bid is accepted")
> — its name is visible but it can't be opened by bidders.

---

## Part 9 — Turn on the Super Admin area (one more copy-paste)

This adds your control centre: an overview of every key number, a user list with
deactivate/reactivate, the expert approval queue, the full transactions table with
an Excel download, and the commission control with a change history. It only
**adds** to your database — nothing existing is touched.

1. In Supabase's left sidebar, click **SQL Editor** → **New query**.
2. On your computer, open **`supabase/admin_upgrade.sql`** inside the project
   folder (right-click → Open with → Notepad).
3. Select **everything** (Ctrl+A), copy (Ctrl+C), paste into the SQL Editor
   (Ctrl+V), and click **Run**. You should see **"Success. No rows returned."**

> If you ever see "already exists", that's fine — it just means it was already
> run. Safe to run again.

Now sign in with your **Super Admin** account. Your account menu (top-right) shows
**Admin area**, and `/dashboard` sends you straight there.

### Testing checklist — the Super Admin area (plain English)

1. **Overview:** sign in as Super Admin → you land on **Overview**. Check the
   cards — total users (split into businesses/experts), projects, in progress,
   total bids, value of accepted bids, and your **commission earnings** (gold).
   The chart shows the last 8 weeks of activity.
2. **Users:** open **Users**. Search by name or email. On a *test* account (not
   yourself, not another admin) click **Deactivate**. Sign out, try to sign in as
   that person → you're immediately signed back out with a "deactivated" message.
   Back as admin, **Reactivate** them and confirm they can sign in again.
3. **Experts:** open **Experts**. Your pending test expert is listed with their
   full application (headline, profession, license, experience, skills, categories,
   and whether they agreed to the Manifesto). Click **Approve**.
4. **Bidding gate:** a *pending* expert who tries to bid still sees the friendly
   "being reviewed" message; the one you just **approved** now gets the bid form
   and can submit. (Try **Reject** on another test expert with a reason — they get
   a notification with your reason.)
5. **Settings:** open **Settings**. Change the commission to a new number (say
   **20%**) and save. The **change history** logs it (you, the time, old → new).
6. **New rate applies everywhere:** as a **business**, accept a new bid — the
   money-split window now shows **20%**. Open **Transactions** and confirm the new
   row used **20%**. (Older transactions keep the rate they were recorded with.)
7. **Download:** in **Transactions**, use the date/status filters, check the
   **totals row** at the bottom, then click **Download (CSV)** and open it in Excel.
8. **Safety:** sign in as a business or expert and type `/admin` (or
   `/admin/transactions`) into the address bar → you're bounced to your own
   dashboard and no admin data loads.

### The Transparency Manifesto

New experts must tick "I agree to the Transparency Manifesto" before their
application is submitted (you'll see the confirmation on their card in **Experts**).
The current wording is **placeholder** text about honesty, transparent billing, and
disclosing AI usage — send me the real wording whenever it's ready and I'll drop it
straight in (it lives in one file: `src/lib/manifesto.ts`).
