# Setting up the "AI drafts your listing" feature

This feature lets a business upload their AI-generated deliverable (Word, PDF, or
text) on the **Post a Project** page. The website reads it, sends it to Claude,
and fills in the whole listing automatically — title, category, an honest
completeness %, the skills needed, a budget for the remaining work, a summary,
and the list of what's still missing. Experts then see an **AI Completeness
Report** on the project page.

You need to do **four things once**. No coding required — just copying and
pasting. Total time: about 15 minutes.

> 🔒 **About your secret key:** Your Anthropic API key is a password for a paid
> service. It is **only ever pasted into Supabase** (step 3), never into the
> website's code or GitHub. That's what keeps it safe.

---

## Before you start

Have these ready:

- Your **Anthropic API key** (starts with `sk-ant-...`). Get it from
  <https://console.anthropic.com> → **API Keys**. Treat it like a password.
- Login access to your **Supabase** project (the same one the site already uses).
- Whoever deploys the website (or the Lovable/hosting dashboard) so the site can
  be rebuilt after you flip the switch in step 4.

---

## Step 1 — Add the database column (2 minutes)

This gives each project a place to store its AI report.

1. Open your project in **Supabase**.
2. In the left menu click **SQL Editor**, then **New query**.
3. Open the file **`supabase/ai_analysis_upgrade.sql`** from this project, copy
   **everything** in it, and paste it into the editor.
4. Click **Run**.

You should see "Success". (If it says the column already exists, that's fine —
it just means it was already added.)

---

## Step 2 — Deploy the AI Edge Function (5 minutes)

This is the small secure program that talks to Claude on the server.

1. In **Supabase**, click **Edge Functions** in the left menu.
2. Click **Deploy a new function** (or **Create a new function**).
3. Name it **exactly**: `analyze-deliverable`
   *(the name must match — the website calls it by this name).*
4. Open the file **`supabase/functions/analyze-deliverable/index.ts`** from this
   project. Copy **everything** in it.
5. Paste it into the Supabase function editor, replacing any starter code.
6. Leave **"Verify JWT"** / **"Enforce JWT"** turned **ON** (this ensures only
   signed-in users can use it).
7. Click **Deploy**.

Wait for it to say the function is deployed.

---

## Step 3 — Add your Anthropic key as a secret (3 minutes)

This is where — and the **only** place — your key goes.

1. In **Supabase**, go to **Project Settings** → **Edge Functions**
   (some accounts show this as **Edge Functions → Secrets** or
   **Configuration → Secrets**).
2. Click **Add new secret**.
3. Name: `ANTHROPIC_API_KEY`
4. Value: paste your Anthropic key (`sk-ant-...`).
5. Click **Save**.

That's it — the key now lives safely on Supabase's servers.

**Optional — choose a different AI model.** By default the feature uses
`claude-sonnet-5` (fast and cost-effective). To use the most powerful model
instead, add a second secret named `ANTHROPIC_MODEL` with the value
`claude-opus-4-8`. You can skip this.

---

## Step 4 — Turn the feature on (2 minutes)

Until now, nothing has changed on the live site. This step makes the upload box
appear.

1. In the website's environment settings, add this setting:

   ```
   VITE_ENABLE_AI_ANALYSIS=true
   ```

   - If you edit files directly, it goes in your **`.env`** file (next to
     `VITE_SUPABASE_URL`).
   - If your site is hosted (e.g. Lovable, Vercel, Netlify), add it in that
     host's **Environment Variables** settings.
2. **Rebuild / redeploy** the website so the new setting takes effect.
   *(Environment settings only apply after a fresh build.)*

To turn the feature **off** again later, set it to `false` (or remove it) and
redeploy.

---

## Testing checklist (do this after all 4 steps)

Have a sample document ready — a Word, PDF, or text file of an AI-generated
draft (e.g. a draft contract, financial model write-up, or marketing plan).

1. **Sign in as a business** and go to **Post a Project**.
2. Confirm the new box at the top appears: *"Upload your AI-generated deliverable
   and we'll draft your listing for you."*
3. Click **Upload & draft my listing** and choose your sample file.
4. You should see **"Claude is reading your deliverable…"** for a few seconds.
5. The form should fill itself in sensibly: a title, a category, a completeness
   %, skills, a budget range, and a description that starts with a summary and
   then a **"Remaining work for the expert"** list. Filled fields show a small
   **AI-suggested** tag.
6. Edit any one field (e.g. the title). Its **AI-suggested** tag should disappear.
7. Check the blue info box showing the questions experts might ask.
8. Click **Publish to Marketplace**.
9. Open the project you just posted. You should see a new **AI Completeness
   Report** card (score + summary + remaining work), and your uploaded document
   listed under **Documents**.
10. **Sign in as an approved expert**, open the same project from the Job Board,
    and confirm the **AI Completeness Report** is visible to them too.

If the analysis ever fails (bad key, service down, an unreadable file), you'll
see a gentle message — *"We couldn't analyze the document — you can still fill
the form yourself"* — and you can post the project manually. **The AI step never
blocks posting.**

---

## Quick troubleshooting

- **The upload box doesn't appear.** `VITE_ENABLE_AI_ANALYSIS` isn't `true`, or
  the site wasn't rebuilt after setting it (step 4).
- **"We couldn't analyze the document" every time.** Re-check step 3 (the secret
  is named exactly `ANTHROPIC_API_KEY` and the key is valid), and step 2 (the
  function is named exactly `analyze-deliverable` and deployed).
- **The AI report doesn't show on the project page.** Make sure step 1 (the SQL)
  was run successfully.
