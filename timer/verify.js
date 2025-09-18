// Simple verification script to test if the timer app loads
const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.goto('http://localhost:3001/timer/', { waitUntil: 'networkidle2' });
    
    // Wait a bit for React to mount
    await page.waitForTimeout(2000);
    
    // Check if the timer root has content
    const hasContent = await page.evaluate(() => {
      const root = document.getElementById('timer-root');
      return root && root.children.length > 0;
    });
    
    console.log('Timer app loaded successfully:', hasContent);
    
    await browser.close();
    process.exit(hasContent ? 0 : 1);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
