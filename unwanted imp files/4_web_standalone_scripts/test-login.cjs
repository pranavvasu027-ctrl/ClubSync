const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  console.log('Navigating to login...');
  await page.goto('http://localhost:5175/login', { waitUntil: 'networkidle0' });
  
  console.log('Typing credentials...');
  // Find email input
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    inputs[0].value = 'atharvadhokane1@gmail.com';
    inputs[1].value = 'password'; // Use standard password, adjust if wrong
    
    // Dispatch input events
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
  });
  
  await page.click('button[type="submit"]');
  
  console.log('Clicked login, waiting 5 seconds...');
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Current URL:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Body Text:', bodyText.substring(0, 500));
  
  await browser.close();
})();
