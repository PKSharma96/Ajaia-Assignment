import { type Browser, type BrowserContext, type Page, expect } from "@playwright/test";

export const ALICE = "alice@ajaia.dev";
export const BOB = "bob@ajaia.dev";
export const CAROL = "carol@ajaia.dev";

/** Set SCREENSHOTS=1 to refresh the images in docs/screenshots while the tests run. */
export async function screenshot(page: Page, name: string) {
  if (process.env.SCREENSHOTS) await page.screenshot({ path: `docs/screenshots/${name}.png` });
}

export async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(email) }).click();
  await expect(page).toHaveURL(/\/documents$/);
}

/** A separate browser context is like a separate browser: its own cookies, its own user. */
export async function loginInNewContext(browser: Browser, email: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await login(page, email);
  return { context, page };
}

export async function createDocument(page: Page, title: string) {
  await page.getByRole("button", { name: "+ New document" }).click();
  await expect(page).toHaveURL(/\/documents\/[^/]+$/);

  // New documents open with the title selected, ready to be renamed.
  const titleInput = page.getByLabel("Document title");
  await expect(titleInput).toBeFocused();
  await titleInput.fill(title);
  await titleInput.press("Enter");
  await expectSaved(page);

  return page.url().split("/").pop()!;
}

export async function expectSaved(page: Page) {
  await expect(page.getByRole("status")).toHaveText("All changes saved");
}

export function editor(page: Page) {
  return page.getByLabel("Document content");
}

/** Our error messages. Skips Next.js's own empty role="alert" route announcer. */
export function alertMessage(page: Page) {
  return page.getByRole("alert").filter({ hasText: /\S/ });
}

export async function deleteDocument(context: BrowserContext, id: string) {
  await context.request.delete(`/api/documents/${id}`);
}
