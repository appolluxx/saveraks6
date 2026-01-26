
# 🚀 SaveRaks 2.0 Deployment Guide

Follow these steps to move from development to a live production environment.

---

## 1. Backend Setup (Google Cloud)

### A. Spreadsheet Preparation
1. Create a new Google Sheet named **"SaveRaks_Database"**.
2. Open the Sheet, click **Extensions > Apps Script**.
3. Rename the project to **"SaveRaks_Backend"**.
4. Paste the content of `Code.gs` into the editor.

### B. Security & Keys (Critical)
1. In the Apps Script editor, click the **Project Settings (Gear Icon)**.
2. Scroll down to **"Script Properties"**.
3. Add the following properties:
   - `API_KEY`: Your Google Gemini API Key.
   - `LINE_CHANNEL_ACCESS_TOKEN`: Your long-lived LINE Messaging API token.
   - `TARGET_LINE_USER_ID`: Your technical LINE User ID (for admin alerts).

### C. Database Initialization
1. In the Apps Script code editor, select `setupDatabase` from the function dropdown at the top.
2. Click **Run**.
3. Review and grant the necessary permissions (it will ask to access your Sheets).
4. Verify that your Google Sheet now has three tabs: `Users`, `Activity_Logs`, and `Map_Pins`.

### D. Deployment
1. Click **Deploy > New Deployment**.
2. Select **Web App**.
3. Configuration:
   - **Execute as:** Me (Your email)
   - **Who has access:** Anyone
4. Click **Deploy**.
5. **Copy the "Web App URL"**. You will need this for the frontend.

---

## 2. Frontend Setup (PWA)

### A. Environment Variables
1. Create a file named `.env` in your project root.
2. Add the following line, replacing the URL with the one you copied in the previous step:
   ```env
   VITE_API_URL=https://script.google.com/macros/s/YOUR_ACTUAL_ID/exec
   ```

### B. Build and Deploy
1. Run `npm install` and then `npm run build`.
2. Upload the `dist` folder to your hosting provider:
   - **Vercel/Netlify:** Connect your GitHub repo. In the dashboard, add `VITE_API_URL` to your **Environment Variables**.
   - **Firebase Hosting:** Use `firebase deploy`.

### C. Testing
1. Visit your live URL.
2. Log in with a unique ID (e.g., `ADMIN-01`).
3. Go to the **Admin** tab and click **"Send Test Push Message"**.
4. Check your LINE app to verify the notification arrives.

---

## 🔍 Troubleshooting
- **CORS Errors:** Ensure your Google Apps Script is deployed as "Anyone" and that you are sending the request body as `text/plain` (already handled in `api.ts`).
- **Data not appearing:** Check the Apps Script **Executions** tab to see if there were any errors during `doPost`.
- **AI not responding:** Verify your `GEMINI_API_KEY` is valid and active in the Google AI Studio console.
