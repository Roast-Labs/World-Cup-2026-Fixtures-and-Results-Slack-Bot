const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL';
const DATA_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';
const LOG_SHEET_NAME = 'Logs';

// --- LOGGING ---

function getLogSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(LOG_SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Status', 'Message']);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function log(status, message) {
  const sheet = getLogSheet();
  const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' });
  sheet.appendRow([timestamp, status, message]);
}

// --- MAIN ---

function sendDailyUpdate() {
  log('INFO', 'Daily update started');

  // Fetch data
  let data;
  try {
    const response = UrlFetchApp.fetch(DATA_URL);
    data = JSON.parse(response.getContentText());
    log('INFO', `Fetched ${data.matches.length} matches from data source`);
  } catch (e) {
    log('ERROR', `Failed to fetch data: ${e.message}`);
    return;
  }

  const today = getUKDate(0);
  const yesterday = getUKDate(-1);
  log('INFO', `Today: ${today} | Yesterday: ${yesterday}`);

  const todaysMatches = data.matches.filter(m => m.date === today);
  const yesterdaysMatches = data.matches.filter(m => m.date === yesterday);
  log('INFO', `Matches found — today: ${todaysMatches.length}, yesterday: ${yesterdaysMatches.length}`);

  const sections = [];

  // --- LAST NIGHT'S RESULTS ---
  if (yesterdaysMatches.length === 0) {
    sections.push(`📋 *No matches yesterday*`);
    log('INFO', 'No matches yesterday');
  } else {
    const resultLines = yesterdaysMatches.map(m => {
      if (!m.score || !m.score.ft) {
        log('WARN', `Score not yet available for ${m.team1} vs ${m.team2} on ${m.date}`);
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
      log('INFO', `Result logged: ${m.team1} ${s1}–${s2} ${m.team2}`);
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
      log('INFO', `Fixture logged: ${m.team1} vs ${m.team2} at ${ukTime}`);
      return `🕐 *${ukTime}* — *${m.team1}* vs *${m.team2}*\n    📍 ${m.ground}  |  ${m.group}`;
    });
    sections.push(`*📅 Today's Fixtures — ${formatDate(today)}*\n\n${fixtureLines.join('\n\n')}`);
  }

  const message = `⚽ *World Cup 2026 Daily Update*\n\n${sections.join('\n\n─────────────────\n\n')}`;

  // --- POST TO SLACK ---
  try {
    UrlFetchApp.fetch(SLACK_WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ text: message })
    });
    log('SUCCESS', 'Message successfully posted to Slack #foooty');
  } catch (e) {
    log('ERROR', `Failed to post to Slack: ${e.message}`);
  }

  log('INFO', 'Daily update complete');
}

// --- HELPERS ---

function getUKDate(offsetDays) {
  const now = new Date();
  now.setDate(now.getDate() + offsetDays);
  const ukTime = new Date(now.toLocaleString('en-GB', { timeZone: 'Europe/London' }));
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