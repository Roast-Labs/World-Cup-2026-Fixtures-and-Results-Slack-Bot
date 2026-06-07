# ⚽ World Cup 2026 Slack Bot

A lightweight Google Apps Script that posts a daily message to a Slack channel every morning with **last night's results** and **today's fixtures** for the FIFA World Cup 2026.

No server. No API key. No cost. Just a Google Sheet and a Slack webhook.

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

🕐 19:00 BST — Canada vs UEFA Path A winner
    📍 Toronto  |  Group B

🕐 20:00 BST — Qatar vs Switzerland
    📍 San Francisco Bay Area  |  Group B
```

On rest days it posts a friendly no-fixtures message so you know it's still running.

---

## Data source

Match data comes from the [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) open data project — a free, public domain JSON feed that includes fixtures and results (with goalscorers) for every World Cup match. No API key required.

---

## Prerequisites

- A Google account (for Google Sheets + Apps Script)
- A Slack workspace where you have permission to add apps

---

## Setup

### Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet
2. Name it something like **World Cup 2026 Bot**
3. You don't need to add any sheets manually — the script will create the **Logs** tab automatically on first run

---

### Step 2 — Open Apps Script

1. In your Google Sheet, click **Extensions** in the top menu
2. Click **Apps Script**
3. This opens the script editor in a new tab
4. Delete the default `function myFunction() {}` placeholder
5. Paste in the full script from [`worldcup-bot.gs`](worldcup-bot.gs)
6. Save the project (Ctrl+S / Cmd+S)
7. Name the project **World Cup Bot**

---

### Step 3 — Create a Slack Incoming Webhook

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and sign in
2. Click **Create New App** → choose **From scratch**
3. Name it **World Cup Bot** and select your workspace → click **Create App**
4. In the left sidebar, click **Incoming Webhooks**
5. Toggle **Activate Incoming Webhooks** to **On**
6. Scroll down and click **Add New Webhook to Workspace**
7. Search for and select the Slack channel you want to post to
8. Click **Allow**
9. Copy the webhook URL — it looks like:
   ```
   https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
   ```

---

### Step 4 — Add the webhook URL to the script

In Apps Script, find this line near the top of the file and replace the placeholder with your webhook URL:

```javascript
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL';
```

Save the file again.

---

### Step 5 — Test manually

1. In Apps Script, make sure `sendDailyUpdate` is selected in the function dropdown at the top
2. Click **▶ Run**
3. The first time you run it, Google will ask for permissions — click **Review Permissions** → choose your Google account → click **Allow**
4. Once it runs, check:
   - Your Google Sheet should now have a **Logs** tab with entries
   - Your Slack channel should have received a message

---

### Step 6 — Set the daily 8am trigger

1. In Apps Script, click the **⏰ Triggers** icon in the left sidebar
2. Click **+ Add Trigger** in the bottom right
3. Configure as follows:

   | Setting | Value |
   |---|---|
   | Function to run | `sendDailyUpdate` |
   | Deployment | Head |
   | Event source | Time-driven |
   | Type of time based trigger | Day timer |
   | Time of day | 8am to 9am |
   | Failure notification | Immediately |

4. Click **Save**

---

### Step 7 — Check the timezone

1. In Apps Script, click the **⚙️ Project Settings** icon in the left sidebar
2. Scroll to **Time zone** and make sure it's set to **Europe/London**
3. If not, change it and save

---

## Logs

Every run writes to a **Logs** sheet in your Google Sheet with three columns:

| Timestamp | Status | Message |
|---|---|---|
| 12/06/2026, 08:00:01 | INFO | Daily update started |
| 12/06/2026, 08:00:02 | INFO | Fetched 104 matches from data source |
| 12/06/2026, 08:00:02 | INFO | Today: 2026-06-12 \| Yesterday: 2026-06-11 |
| 12/06/2026, 08:00:03 | INFO | Result logged: Mexico 2–1 South Africa |
| 12/06/2026, 08:00:03 | SUCCESS | Message successfully posted to Slack |

Status values: `INFO`, `WARN`, `ERROR`, `SUCCESS`

If a run fails, you'll get an email notification from Google (configured in the trigger) and the error will appear in the Logs sheet.

---

## Configuration

At the top of `worldcup-bot.gs` you can change these constants:

| Constant | Default | Description |
|---|---|---|
| `SLACK_WEBHOOK_URL` | _(your webhook)_ | Slack incoming webhook URL |
| `DATA_URL` | openfootball 2026 JSON | URL of the match data feed |
| `LOG_SHEET_NAME` | `Logs` | Name of the logging sheet tab |

---

## Notes

- **Score availability** — the openfootball feed is community-maintained, so scores may appear a few hours after the final whistle. An 8am post covering the previous evening's matches should always have results by then.
- **BST conversion** — match times in the feed are in local UTC offsets (e.g. `UTC-6`). The script converts all kick-off times to BST automatically.
- **Rest days** — on days with no fixtures, the bot still runs and posts a rest day message so you can confirm it's working.
- **Tournament dates** — the 2026 World Cup runs from **11 June to 19 July 2026**.

---

## License

MIT — do whatever you like with it.

---

## Contributing

PRs welcome. Some ideas if you want to extend it:

- Add a "top scorers" leaderboard section
- Post a separate message when a match kicks off (using a more frequent trigger)
- Switch to a richer data source (e.g. [API-Football](https://www.api-football.com/)) for live scores
- Add support for posting to multiple channels
- Format the message using [Slack Block Kit](https://api.slack.com/block-kit) for richer layouts

---

*Not affiliated with FIFA.*
