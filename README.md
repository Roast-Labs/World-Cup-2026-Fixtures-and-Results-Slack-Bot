# ⚽ World Cup 2026 Slack Bot

A self-installing Google Apps Script that posts a daily message to a Slack channel every morning with **last night's results** and **today's fixtures** for the FIFA World Cup 2026.

No server. No API key. No cost. Run `setup()` once and you're done.

![World Cup 2026](https://img.shields.io/badge/FIFA%20World%20Cup-2026-green) ![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?logo=google&logoColor=white) ![Slack](https://img.shields.io/badge/Slack-4A154B?logo=slack&logoColor=white) ![License: MIT](https://img.shields.io/badge/License-MIT-yellow)

---

## What it does

Every morning at 8am (UK time) the bot posts a message to a Slack channel of your choice:

```
⚽ World Cup 2026 Daily Update

🏆 Yesterday's Results — Thursday 11 June

⚽ Mexico 2–1 South Africa  (HT: 1–0)  |  Group A
    Mexico: Hirving Lozano 34', Raúl Jiménez 78'
    South Africa: Percy Tau 55'

⚽ South Korea 1–1 Czech Republic  (HT: 0–1)  |  Group A
    South Korea: Son Heung-min 90+2'
    Czech Republic: Tomáš Souček 23'

─────────────────

📅 Today's Fixtures — Friday 12 June

🕐 19:00 BST — Canada vs Uruguay
    📍 Toronto  |  Group B

🕐 22:00 BST — Qatar vs Switzerland
    📍 San Francisco Bay Area  |  Group B
```

On rest days it posts a friendly no-fixtures message so you know it's still running.

---

## Data source

Match data comes from [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) — a free, public domain JSON feed that includes fixtures and results (with goalscorers) for every World Cup match. No API key required.

---

## Prerequisites

- A Google account (for Google Sheets + Apps Script)
- A Slack workspace where you have permission to add apps

---

## Setup

### Step 1 — Create a Slack Incoming Webhook

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and sign in
2. Click **Create New App** → choose **From scratch**
3. Name it **World Cup Bot** and select your workspace → click **Create App**
4. In the left sidebar, click **Incoming Webhooks**
5. Toggle **Activate Incoming Webhooks** to **On**
6. Click **Add New Webhook to Workspace**
7. Search for and select the Slack channel you want to post to → click **Allow**
8. Copy the webhook URL — it looks like:
   ```
   https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
   ```

---

### Step 2 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet
2. Name it **World Cup 2026 Bot** (or anything you like)

---

### Step 3 — Add the script

1. In your Google Sheet, click **Extensions → Apps Script**
2. Delete the default `function myFunction() {}` placeholder
3. Paste in the full contents of [`worldcup-bot.gs`](worldcup-bot.gs)
4. Save the project (Ctrl+S / Cmd+S) and name it **World Cup Bot**

---

### Step 4 — Add your webhook URL

At the top of the script, find the `CONFIG` block and paste in your webhook URL:

```javascript
const CONFIG = {
  SLACK_WEBHOOK_URL: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL', // ← paste here
  ...
};
```

Save again.

---

### Step 5 — Run setup()

1. In the function dropdown at the top of Apps Script, select **`setup`**
2. Click **▶ Run**
3. Google will ask for permissions — click **Review Permissions** → choose your account → click **Allow**

That's it. `setup()` will automatically:

- ✅ Create the **Logs** sheet with colour-coded status rows
- ✅ Set a **daily 8am trigger** (Europe/London timezone)
- ✅ Add a **⚽ World Cup Bot menu** to your Google Sheet
- ✅ Post a **confirmation message** to your Slack channel

If anything goes wrong (e.g. wrong webhook URL) it'll tell you exactly what to fix via a popup.

---

## Running manually

After setup, a **⚽ World Cup Bot** menu appears in your Google Sheet toolbar:

| Menu item | What it does |
|---|---|
| ▶ Run now (test) | Runs the bot immediately — useful for testing |
| 🔧 Run setup again | Re-runs setup, e.g. if you change the webhook URL |
| 🗑 Remove all triggers | Deletes the daily trigger (to pause the bot) |

---

## Logs

Every run writes to the **Logs** sheet with colour-coded status rows:

| Timestamp | Status | Message |
|---|---|---|
| 12/06/2026, 08:00:01 | 🟦 INFO | Daily update started |
| 12/06/2026, 08:00:02 | 🟦 INFO | Fetched 104 matches from data source |
| 12/06/2026, 08:00:03 | 🟦 INFO | Result: Mexico 2–1 South Africa |
| 12/06/2026, 08:00:04 | 🟩 SUCCESS | Message posted to Slack |

Colour coding: 🟩 `SUCCESS` · 🟥 `ERROR` · 🟨 `WARN` · ⬜ `INFO`

---

## Configuration

All settings are in the `CONFIG` block at the top of `worldcup-bot.gs`:

| Setting | Default | Description |
|---|---|---|
| `SLACK_WEBHOOK_URL` | _(your webhook)_ | Slack incoming webhook URL |
| `DATA_URL` | openfootball 2026 JSON | Match data feed URL |
| `LOG_SHEET_NAME` | `Logs` | Name of the logging sheet tab |
| `TRIGGER_HOUR` | `8` | Hour to run daily (24hr, London time) |
| `TIMEZONE` | `Europe/London` | Timezone for trigger and logging |

---

## Notes

- **Score availability** — the openfootball feed is community-maintained so scores may appear a few hours after the final whistle. An 8am post covering the previous evening's matches should always have results by then.
- **BST conversion** — match times in the feed use local UTC offsets (e.g. `UTC-6`). The script converts all kick-off times to BST automatically.
- **Rest days** — on days with no fixtures the bot still runs and posts a rest day message.
- **Tournament dates** — the 2026 World Cup runs from **11 June to 19 July 2026**.

---

## Contributing

PRs welcome. Some ideas if you want to extend it:

- Add a "top scorers" leaderboard section
- Switch to a richer data source (e.g. [API-Football](https://www.api-football.com/)) for live scores
- Format the message using [Slack Block Kit](https://api.slack.com/block-kit) for richer layouts
- Add support for posting to multiple channels
- Add a sweepstake/prediction league feature

---

## License

MIT — do whatever you like with it.

---

## Credits

Match data provided by [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) — a free, open public domain football dataset maintained by the open football community. If you find this bot useful, consider giving their repo a ⭐.

---

*Not affiliated with FIFA.*