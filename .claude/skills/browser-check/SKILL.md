---
name: browser-check
description: Uses a headless browser to visit the local app and check for console errors or UI issues.
---
1. **Script Generation:** Write a temporary Node.js script using Playwright to visit `http://localhost:3000`.
2. **Execution:** Run the script and capture:
   - Any browser console errors.
   - A screenshot of the page (saved to `tmp/verification.png`).
3. **Analysis:** Review the console output. If there are 404s or JS crashes, fix the code and retry.
4. **Cleanup:** Delete the temporary script but keep the screenshot for me to see.