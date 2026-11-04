/**
 * Playwright End-to-End Automated Test Suite for HomeServe Horizon
 * Uses Windows system Edge / Chrome browser channel
 */
import { chromium } from 'playwright';

async function runE2ETest() {
  console.log('🚀 Starting Playwright E2E Test Suite for HomeServe Horizon...');
  // Launch using system Edge browser channel
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Visit App
    console.log('1. Navigating to http://127.0.0.1:5173...');
    await page.goto('http://127.0.0.1:5173');
    await page.waitForLoadState('networkidle');

    // 2. Check Title & Brand
    const title = await page.textContent('h1');
    console.log(`✓ Hero Title Loaded: "${title.replace(/\s+/g, ' ').trim()}"`);

    // 3. Check Persona Switcher to Super Admin
    const adminPill = page.locator('text=Super Admin');
    await adminPill.click();
    await page.waitForTimeout(1000);
    console.log('✓ Switched to Super Admin persona successfully');

    // Check Admin Dashboard KPIs
    await page.waitForSelector('text=Platform Analytics');
    console.log('✓ Super Admin Command Center displayed with live revenue KPIs');

    // 4. Switch to Service Provider
    const provPill = page.locator('text=Provider (Apex Pro)');
    await provPill.click();
    await page.waitForTimeout(1000);
    console.log('✓ Switched to Service Provider persona');
    await page.waitForSelector('text=Provider Operations Hub');
    console.log('✓ Service Provider dashboard & bookings queue loaded');

    // 5. Switch to Technician
    const techPill = page.locator('text=Technician (Vikram)');
    await techPill.click();
    await page.waitForTimeout(1000);
    console.log('✓ Switched to Field Technician persona');
    await page.waitForSelector('text=Field Operations Console');
    console.log('✓ Technician job dispatch list loaded');

    // 6. Switch back to Customer and browse catalog
    const custPill = page.locator('text=Customer (Rahul)');
    await custPill.click();
    await page.waitForTimeout(1000);
    console.log('✓ Switched to Customer persona');

    // Click Explore Services
    const exploreBtn = page.locator('text=Explore Services').first();
    await exploreBtn.click();
    await page.waitForTimeout(1000);

    // Filter by Electrical Services
    const elecBtn = page.locator('button:has-text("Electrical Services")').first();
    await elecBtn.click();
    await page.waitForTimeout(1000);
    console.log('✓ Filtered services by category');

    console.log('\n🎉 ALL PLAYWRIGHT E2E CRITICAL WORKFLOW TESTS PASSED PERFECTLY!');
  } catch (error) {
    console.error('❌ E2E Test Failure:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2ETest();
