
/**
 * SaveRaks 2.0 - Serverless Backend
 * Agroton Neon-Industrial Logic
 */

const SCRIPT_PROP = PropertiesService.getScriptProperties();
const GEMINI_KEY = SCRIPT_PROP.getProperty('API_KEY');
const LINE_TOKEN = SCRIPT_PROP.getProperty('LINE_CHANNEL_ACCESS_TOKEN');

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = [
    { name: "Users", headers: ["id", "schoolId", "name", "role", "points", "xp", "level", "hasConsented", "createdAt"] },
    { name: "Logs", headers: ["id", "timestamp", "schoolId", "type", "label", "points", "description", "status"] },
    { name: "Pins", headers: ["id", "timestamp", "type", "status", "x", "y", "description", "reportedBy"] }
  ];

  sheets.forEach(s => {
    let sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
      sheet.getRange(1, 1, 1, s.headers.length).setValues([s.headers]).setFontWeight("bold");
    }
  });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    switch(data.action) {
      case 'LOGIN': return handleLogin(data, ss);
      case 'CONSENT': return handleConsent(data, ss);
      case 'VISION_SCAN': return handleVision(data, ss);
      case 'GET_FEED': return handleGetFeed(ss);
      case 'GET_PINS': return handleGetPins(ss);
      case 'DEPLOY_NODE': return handleDeploy(data, ss);
      default: return jsonRes({ error: "Action invalid" });
    }
  } catch (err) {
    return jsonRes({ error: err.toString() });
  }
}

function handleLogin(data, ss) {
  const sheet = ss.getSheetByName("Users");
  const users = sheet.getDataRange().getValues();
  for (let i = 1; i < users.length; i++) {
    if (users[i][1] === data.schoolId) {
      return jsonRes({ user: formatUser(users[i]) });
    }
  }
  // Optional: Auto-create student if not found for demo
  return jsonRes({ error: "Not found" });
}

function handleVision(data, ss) {
  // Anti-Cheat: Check cooldown (Last 60s)
  // ... logic to check activity sheet for userId ...

  const analysis = callGeminiVision(data.mode, data.image);
  if (analysis) {
    // Log SRT Award
    const logSheet = ss.getSheetByName("Logs");
    logSheet.appendRow([
      Utilities.getUuid(), new Date(), data.schoolId, 
      data.mode.toUpperCase(), analysis.label, 
      analysis.points, analysis.analysis, "APPROVED"
    ]);

    // Update User Total
    updatePoints(data.schoolId, analysis.points, ss);

    return jsonRes(analysis);
  }
  return jsonRes({ error: "AI Processing Failed" });
}

function callGeminiVision(mode, base64) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
  
  const systemPrompt = `You are the SaveRaks Eco-Guardian AI. 
    Mode: ${mode}. Analyze the image. 
    Return JSON: { "category": string, "label": string, "points": number, "analysis": string }.
    Recycle: +10 SRT. Grease Trap Clean: +50 SRT. Hazard: +20 SRT.
    If it is a fake/screen/paper photo, return 0 points and 'Fraud Detected'.
    Use Thai for 'label' and 'analysis'.`;

  const payload = {
    contents: [{
      parts: [
        { text: systemPrompt },
        { inlineData: { mimeType: "image/jpeg", data: base64 } }
      ]
    }]
  };

  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });

  const json = JSON.parse(res.getContentText());
  const text = json.candidates[0].content.parts[0].text;
  try {
    return JSON.parse(text.replace(/```json|```/g, ""));
  } catch(e) { return null; }
}

function updatePoints(schoolId, amount, ss) {
  const sheet = ss.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === schoolId) {
      const current = parseInt(data[i][4] || 0);
      sheet.getRange(i+1, 5).setValue(current + amount);
      sheet.getRange(i+1, 6).setValue(current + amount); // XP
      break;
    }
  }
}

function formatUser(row) {
  return {
    id: row[0], schoolId: row[1], name: row[2],
    role: row[3], points: row[4], xp: row[5],
    level: row[6], hasConsented: row[7],
    badges: []
  };
}

function jsonRes(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
