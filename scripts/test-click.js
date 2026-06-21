const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  await page.goto('http://localhost:5173/menu');
  await page.waitForTimeout(2000);
  
  // Try to find the Orders button text or class
  // Since user needs to be logged in to see the Orders button, we must simulate login or just check if the button exists.
  const buttonLocator = page.locator('button:has-text("Orders")');
  const count = await buttonLocator.count();
  
  if (count === 0) {
     console.log('Orders button not found. Probably need to login.');
  } else {
     console.log('Found Orders button, clicking...');
     await buttonLocator.click();
     await page.waitForTimeout(1000);
     const modal = await page.locator('.modal-overlay').count();
     console.log('Modal visible count:', modal);
  }
  
  await browser.close();
})();
