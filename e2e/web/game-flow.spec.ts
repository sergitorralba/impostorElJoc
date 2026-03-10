import { test, expect } from '@playwright/test';

test('Full Game Flow - Standard Mode', async ({ page }) => {
  // 1. Language Selection
  await page.goto('/');
  // Wait for any of the language buttons to appear
  await expect(page.getByText('EN')).toBeVisible({ timeout: 15000 });
  await page.getByText('EN').click();

  // 2. Mode Selection
  await expect(page.getByText('SELECT MODE')).toBeVisible();
  await page.getByText('ADULT').click();

  // 3. Player Setup
  await expect(page.getByPlaceholder('Player Name')).toBeVisible();
  
  const players = ['Alice', 'Bob', 'Charlie'];
  for (const name of players) {
    await page.getByPlaceholder('Player Name').fill(name);
    await page.getByText('+').click();
  }
  
  await expect(page.getByText('Alice')).toBeVisible();
  await expect(page.getByText('Bob')).toBeVisible();
  await expect(page.getByText('Charlie')).toBeVisible();

  // 4. Start Game
  await page.getByText('START GAME').click();

  // 5. Reveal Phase (Loop through 3 players)
  for (let i = 0; i < 3; i++) {
    await expect(page.getByText('Pass the phone to:')).toBeVisible();
    
    // Click to reveal (Web fallback we implemented)
    await page.getByText('Click to lift the veil').click();
    
    // Check if role is visible
    await expect(page.getByText('YOUR ROLE:')).toBeVisible();
    
    // Proceed to next player
    await page.getByText('I UNDERSTAND').click();
  }

  // 6. Lobby / Play Phase
  await expect(page.getByText('ACTION TIME')).toBeVisible();
  await page.getByText('DECISION METHOD').click();

  // 7. Voting Choice
  await expect(page.getByText('PUBLIC AGREEMENT')).toBeVisible();
  await page.getByText('PUBLIC AGREEMENT').click();

  // 8. Public Agreement Selection (Pick the first player as suspect)
  await expect(page.getByText('Select the Suspect')).toBeVisible();
  await page.locator('text=Alice').first().click();

  // 9. Results Screen
  await expect(page.getByText('TERMINATED')).toBeVisible();
  await expect(page.getByText('IMPOSTORS WERE:')).toBeVisible();
  
  // 10. Play Again / Reboot
  await page.getByText('REBOOT SESSION').click();
  
  // Back to start
  await expect(page.getByText('SELECT LANGUAGE')).toBeVisible();
});
