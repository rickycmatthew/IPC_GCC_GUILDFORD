# IPC Gospel Center — Netlify Deployment & Push Notification Setup

## Files in this package

```
ipc-calendar/
├── index.html                    ← Main calendar PWA
├── sw.js                         ← Service worker (push + offline)
├── manifest.json                 ← PWA manifest
├── icon-192.svg                  ← App icon (replace with PNG if preferred)
├── netlify.toml                  ← Netlify build config
├── .env.example                  ← Environment variable template
└── netlify/
    └── functions/
        ├── package.json          ← web-push dependency
        ├── subscribe.js          ← Saves push subscriptions
        └── send-notification.js  ← Sends daily push (called by cron-job.org)
```

---

## STEP 1 — Generate your VAPID keys

Run this once on any machine with Node.js:

```bash
npx web-push generate-vapid-keys
```

You will get output like:
```
Public Key:  Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Private Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Keep these — you need them in Steps 2 and 3.

---

## STEP 2 — Update index.html with your Public Key

Open `index.html` and find this line near the top:

```html
<meta name="vapid-public-key" content="PASTE_YOUR_VAPID_PUBLIC_KEY_HERE">
```

Replace `PASTE_YOUR_VAPID_PUBLIC_KEY_HERE` with your actual public key from Step 1.

---

## STEP 3 — Deploy to Netlify

### Option A: Drag and drop (easiest)
1. Go to https://app.netlify.com
2. Drag the entire `ipc-calendar` folder onto the Netlify dashboard
3. Wait for deploy to complete — you get a URL like `https://ipc-guildford.netlify.app`

### Option B: GitHub (recommended for updates)
1. Push this folder to a GitHub repo (rickycmatthew)
2. In Netlify: New site → Import from Git → select the repo
3. Build settings are auto-detected from `netlify.toml`

---

## STEP 4 — Set Environment Variables in Netlify

In Netlify dashboard → Site → Environment variables, add:

| Key | Value |
|-----|-------|
| `VAPID_PUBLIC_KEY` | Your public key from Step 1 |
| `VAPID_PRIVATE_KEY` | Your private key from Step 1 |
| `VAPID_EMAIL` | Your email address |
| `CRON_SECRET` | Any random string, e.g. `ipc2026guildford!` |

Then **redeploy** the site (Deploys → Trigger deploy).

---

## STEP 5 — Enable Netlify Blobs (free)

Netlify Blobs stores push subscriptions automatically.

1. In Netlify dashboard → Site → Blobs
2. It's enabled by default on all sites — no action needed
3. Subscriptions are saved at key `push-subscriptions`

---

## STEP 6 — Set up cron-job.org for 7am daily push

1. Go to https://cron-job.org and create a free account
2. Click **Create cronjob**
3. Set these values:

| Field | Value |
|-------|-------|
| Title | IPC Daily Bible Push |
| URL | `https://YOUR-SITE.netlify.app/.netlify/functions/send-notification` |
| Schedule | Every day at **07:00** (enable "Custom" and set Hour=7, Minute=0) |
| Request method | GET |
| Add header | `x-cron-secret` = the same value you set as `CRON_SECRET` in Step 4 |

4. Save — it will now fire at 7am every day

---

## STEP 7 — Test the push notification manually

After deploying, you can trigger a test push at any time by visiting:

```
https://YOUR-SITE.netlify.app/.netlify/functions/send-notification?secret=YOUR_CRON_SECRET
```

You should receive a push notification within a few seconds (if you've tapped "Enable" in the app).

---

## How the flow works

```
7:00am → cron-job.org → POST send-notification (with secret header)
                              ↓
                    Calculates today's Bible reading + birthdays/anniversaries
                              ↓
                    Loads all subscriptions from Netlify Blobs
                              ↓
                    Sends push to every subscribed device
                              ↓
              📱 Phone shows notification: "📖 Psalms 23–24 · Day 45 of 365"
                              ↓
                    Tap → opens IPC Guildford calendar
```

---

## Notes

- Users must tap **"Enable"** in the app banner to receive pushes (browser security requirement)
- iOS requires the app to be **added to Home Screen** first before push works (iOS 16.4+)
- Stale subscriptions (uninstalled apps) are automatically cleaned up
- The free Netlify tier includes 125,000 function invocations/month — more than enough
- cron-job.org free tier allows up to 5 jobs, each running once per day

---

## Troubleshooting

**"Enable" button does nothing** — Make sure you pasted the correct VAPID_PUBLIC_KEY in index.html (Step 2)

**Notification arrives but no sound** — Device notification settings; check app notification settings for the browser

**iOS not receiving** — User must add to Home Screen first, then tap Enable inside the installed app

**cron-job.org shows 401** — Check that CRON_SECRET in Netlify env matches the header value in cron-job.org
