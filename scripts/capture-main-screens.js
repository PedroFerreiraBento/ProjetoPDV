const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = path.resolve('prints-principais');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();

  const shot = async (name, fullPage = true) => {
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(outDir, name), fullPage });
  };

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await shot('01-login-escolha.png');

  await page.getByRole('button', { name: /Painel de Gestão/i }).click();
  await page.waitForTimeout(500);
  await shot('02-login-admin.png');

  await page.getByPlaceholder('admin@sistema.com').fill('admin@sistema.com');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.getByRole('button', { name: /Entrar no Sistema/i }).click();
  await page.waitForURL('**/', { timeout: 15000 });
  await shot('03-portal.png');

  await page.goto('http://localhost:5173/dashboard/overview', { waitUntil: 'networkidle' });
  await shot('04-dashboard-overview.png');

  await page.goto('http://localhost:5173/dashboard/sales', { waitUntil: 'networkidle' });
  await shot('05-dashboard-vendas.png');

  await page.goto('http://localhost:5173/dashboard/settings', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: /Filiais/i }).click();
  await page.waitForTimeout(600);
  await shot('06-dashboard-config-filiais.png');

  await page.goto('http://localhost:5173/pos', { waitUntil: 'networkidle' });

  const terminalSelectorVisible = await page.getByText('Selecione o Terminal').isVisible().catch(() => false);
  if (terminalSelectorVisible) {
    await page.locator('button:has-text("Escolha um terminal ativo")').click().catch(async () => {
      await page.getByRole('combobox').first().click();
    });
    const option = page.locator('[role="option"]').first();
    await option.click();
    await page.getByRole('button', { name: /Confirmar/i }).click();
    await page.waitForTimeout(1000);
  }

  await shot('07-pdv.png');

  const fiadosBtn = page.getByRole('button', { name: /Fiados/i }).first();
  if (await fiadosBtn.isVisible().catch(() => false)) {
    await fiadosBtn.click();
    await page.waitForTimeout(800);
    await shot('08-pdv-fiados.png');
  }

  await browser.close();
  console.log(`Screenshots salvos em: ${outDir}`);
})();
