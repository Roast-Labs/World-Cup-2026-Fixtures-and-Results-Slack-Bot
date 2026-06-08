// ============================================================
//  ⚽ World Cup 2026 Slack Bot
//  github.com/YOUR_USERNAME/worldcup-slack-bot
//
//  SETUP: Run setup() once to configure everything.
//  That's it. You're done.
// ============================================================

const CONFIG = {
  SLACK_WEBHOOK_URL: '',         // ← Paste your Slack webhook URL here before running setup()
  DATA_URL: 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json',
  LOG_SHEET_NAME: 'Logs',
  TRIGGER_HOUR: 8,               // 8 = 8am. Change if you want a different time.
  TIMEZONE: 'Europe/London',
};

// ============================================================
//  SETUP — Run this once
// ============================================================

function setup() {
  const ui = SpreadsheetApp.getUi();

  // 1. Check webhook URL has been filled in
  if (!CONFIG.SLACK_WEBHOOK_URL || CONFIG.SLACK_WEBHOOK_URL === '') {
    ui.alert(
      '⚠️ Missing Webhook URL',
      'Please paste your Slack Incoming Webhook URL into the CONFIG block at the top of the script, then run setup() again.',
      ui.ButtonSet.OK
    );
    return;
  }

  // 2. Create the Logs sheet if it doesn't exist
  createLogSheet();
  log('INFO', 'Setup started');

  // 3. Remove any existing triggers to avoid duplicates
  removeExistingTriggers();
  log('INFO', 'Existing triggers cleared');

  // 4. Create the daily 8am trigger
  ScriptApp.newTrigger('sendDailyUpdate')
    .timeBased()
    .everyDays(1)
    .atHour(CONFIG.TRIGGER_HOUR)
    .inTimezone(CONFIG.TIMEZONE)
    .create();
  log('INFO', `Daily trigger created — runs at ${CONFIG.TRIGGER_HOUR}:00 ${CONFIG.TIMEZONE} every day`);

  // 5. Create the custom Slack Bot menu in the sheet
  createMenu();
  log('INFO', 'Sheet menu created');

  // 6. Test the Slack connection with a setup confirmation message
  const testResult = sendSlackMessage(
    `✅ *World Cup 2026 Bot is live!*\n\nI'll post daily updates here every morning at ${CONFIG.TRIGGER_HOUR}:00am (UK time) with last night's results and today's fixtures. Come on! ⚽`
  );

  if (testResult.success) {
    log('SUCCESS', 'Setup complete — test message posted to Slack');
    ui.alert(
      '✅ Setup complete!',
      `Everything is configured:\n\n• Logs sheet created\n• Daily trigger set for ${CONFIG.TRIGGER_HOUR}:00am UK time\n• Test message posted to your Slack channel\n\nThe bot will now run automatically every morning.`,
      ui.ButtonSet.OK
    );
  } else {
    log('ERROR', `Setup completed but Slack test failed: ${testResult.error}`);
    ui.alert(
      '⚠️ Almost there',
      `The trigger and logs sheet were created, but the Slack test message failed:\n\n"${testResult.error}"\n\nDouble-check your webhook URL in the CONFIG block and run setup() again.`,
      ui.ButtonSet.OK
    );
  }
}

// ============================================================
//  MENU — Adds a "⚽ World Cup Bot" menu to the Google Sheet
// ============================================================

function onOpen() {
  createMenu();
}

function createMenu() {
  SpreadsheetApp.getUi()
    .createMenu('⚽ World Cup Bot')
    .addItem('▶ Run now (test)', 'sendDailyUpdate')
    .addItem('🔧 Run setup again', 'setup')
    .addItem('🗑 Remove all triggers', 'removeExistingTriggers')
    .addToUi();
}

// ============================================================
//  MAIN — Daily update function (runs on trigger)
// ============================================================

function sendDailyUpdate() {
  log('INFO', 'Daily update started');

  // Fetch data
  let data;
  try {
    const response = UrlFetchApp.fetch(CONFIG.DATA_URL);
    data = JSON.parse(response.getContentText());
    log('INFO', `Fetched ${data.matches.length} matches from data source`);
  } catch (e) {
    log('ERROR', `Failed to fetch data: ${e.message}`);
    return;
  }

  const today = getUKDate(0);
  const yesterday = getUKDate(-1);
  log('INFO', `Today: ${today} | Yesterday: ${yesterday}`);

  const todaysMatches = data.matches.filter(m => m.date === today && isValidMatch(m));
  const yesterdaysMatches = data.matches.filter(m => m.date === yesterday && isValidMatch(m));
  log('INFO', `Matches found — today: ${todaysMatches.length}, yesterday: ${yesterdaysMatches.length}`);

  const sections = [];

  // --- LAST NIGHT'S RESULTS ---
  if (yesterdaysMatches.length === 0) {
    sections.push(`📋 *No matches yesterday*`);
    log('INFO', 'No matches yesterday');
  } else {
    const resultLines = yesterdaysMatches.map(m => {
      if (!m.score || !m.score.ft) {
        log('WARN', `Score not yet available for ${m.team1} vs ${m.team2}`);
        return `⚽ *${m.team1}* vs *${m.team2}* — _(result not yet available)_  |  ${m.group}`;
      }
      const [s1, s2] = m.score.ft;
      const ht = m.score.ht ? `  _(HT: ${m.score.ht[0]}–${m.score.ht[1]})_` : '';

      const formatGoals = (goals, team) => {
        if (!goals || goals.length === 0) return '';
        const list = goals.map(g => {
          const pen = g.penalty ? ' (pen)' : '';
          const offset = g.offset ? `+${g.offset}` : '';
          return `${g.name} ${g.minute}${offset}'${pen}`;
        }).join(', ');
        return `\n    _${team}: ${list}_`;
      };

      const goals = formatGoals(m.goals1, m.team1) + formatGoals(m.goals2, m.team2);
      log('INFO', `Result: ${m.team1} ${s1}–${s2} ${m.team2}`);
      return `⚽ *${m.team1} ${s1}–${s2} ${m.team2}*${ht}  |  ${m.group}${goals}`;
    });

    sections.push(`*🏆 Yesterday's Results — ${formatDate(yesterday)}*\n\n${resultLines.join('\n\n')}`);
  }

  // --- TODAY'S FIXTURES ---
  if (todaysMatches.length === 0) {
    sections.push(`📅 *No fixtures today — rest day!*`);
    log('INFO', 'No fixtures today');
  } else {
    const fixtureLines = todaysMatches.map(m => {
      const ukTime = convertToUKTime(m.time);
      log('INFO', `Fixture: ${m.team1} vs ${m.team2} at ${ukTime}`);
      return `🕐 *${ukTime}* — *${m.team1}* vs *${m.team2}*\n    📍 ${m.ground}  |  ${m.group}`;
    });
    sections.push(`*📅 Today's Fixtures — ${formatDate(today)}*\n\n${fixtureLines.join('\n\n')}`);
  }

  const message = `⚽ *World Cup 2026 Daily Update*\n\n${sections.join('\n\n─────────────────\n\n')}`;

  const result = sendSlackMessage(message);
  if (result.success) {
    log('SUCCESS', 'Message posted to Slack');
  } else {
    log('ERROR', `Failed to post to Slack: ${result.error}`);
  }

  log('INFO', 'Daily update complete');
}

// ============================================================
//  SLACK
// ============================================================

function sendSlackMessage(text) {
  try {
    const response = UrlFetchApp.fetch(CONFIG.SLACK_WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ text }),
      muteHttpExceptions: true,
    });
    const code = response.getResponseCode();
    if (code === 200) {
      return { success: true };
    } else {
      return { success: false, error: `HTTP ${code}: ${response.getContentText()}` };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============================================================
//  TRIGGERS
// ============================================================

function removeExistingTriggers() {
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'sendDailyUpdate') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

// ============================================================
//  LOGGING
// ============================================================

function createLogSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.LOG_SHEET_NAME);
    const header = sheet.getRange('A1:C1');
    header.setValues([['Timestamp', 'Status', 'Message']]);
    header.setFontWeight('bold');
    header.setBackground('#4285F4');
    header.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(2, 80);
    sheet.setColumnWidth(3, 500);
  }
  return sheet;
}

function log(status, message) {
  const sheet = createLogSheet();
  const timestamp = new Date().toLocaleString('en-GB', { timeZone: CONFIG.TIMEZONE });

  // Colour code the status cell
  const row = sheet.getLastRow() + 1;
  sheet.appendRow([timestamp, status, message]);
  const statusCell = sheet.getRange(row, 2);
  const colours = { SUCCESS: '#34a853', ERROR: '#ea4335', WARN: '#fbbc04', INFO: '#ffffff' };
  statusCell.setBackground(colours[status] || '#ffffff');
}

// ============================================================
//  HELPERS
// ============================================================

function getUKDate(offsetDays) {
  const now = new Date();
  now.setDate(now.getDate() + offsetDays);
  const ukTime = new Date(now.toLocaleString('en-GB', { timeZone: CONFIG.TIMEZONE }));
  const y = ukTime.getFullYear();
  const m = String(ukTime.getMonth() + 1).padStart(2, '0');
  const d = String(ukTime.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function convertToUKTime(time) {
  const match = time.match(/(\d{2}):(\d{2})\s+UTC([+-]\d+)/);
  if (!match) return time;
  const hours = parseInt(match[1]);
  const mins = parseInt(match[2]);
  const offset = parseInt(match[3]);
  const ukOffset = 1; // BST during tournament
  let ukHours = ((hours - offset + ukOffset) % 24 + 24) % 24;
  return `${String(ukHours).padStart(2, '0')}:${String(mins).padStart(2, '0')} BST`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}