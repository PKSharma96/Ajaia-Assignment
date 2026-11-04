import { expect, test } from "@playwright/test";
import {
  ALICE,
  BOB,
  CAROL,
  alertMessage,
  createDocument,
  deleteDocument,
  editor,
  expectSaved,
  login,
  loginInNewContext,
  screenshot,
} from "./helpers";

const unique = () => Date.now().toString(36);

test("login page lists demo accounts and unknown emails are rejected", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /alice@ajaia.dev/ })).toBeVisible();
  await screenshot(page, "01-login");

  await page.getByLabel("Or enter a demo email").fill("nobody@ajaia.dev");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(alertMessage(page)).toHaveText("No demo account found with that email");
});

test("signed-out visitors are sent to the login page", async ({ page }) => {
  await page.goto("/documents");
  await expect(page).toHaveURL(/\/login$/);
});

test("dashboard separates owned and shared documents", async ({ page }) => {
  await login(page, ALICE);

  const owned = page.locator("section", { hasText: "My documents" });
  const shared = page.locator("section", { hasText: "Shared with me" });

  await expect(owned.getByText("Welcome to Ajaia Docs")).toBeVisible();
  await expect(shared.getByText("Q4 Planning Notes")).toBeVisible();
  await expect(shared.getByText("Owned by Bob Smith")).toBeVisible();
  await expect(shared.getByText("Can view")).toBeVisible();
  await screenshot(page, "02-dashboard");
});

test("create, rename, format, autosave and reopen a document", async ({ page, context }) => {
  await login(page, ALICE);
  const title = `E2E formatting ${unique()}`;
  const id = await createDocument(page, title);

  await editor(page).click();
  await page.getByLabel("Text style").selectOption("h1");
  await page.keyboard.type("Project kickoff");
  await page.keyboard.press("Enter");

  await page.getByRole("button", { name: "Bold" }).click();
  await page.keyboard.type("Important");
  await page.getByRole("button", { name: "Bold" }).click();
  await page.keyboard.type(" and ");
  await page.getByRole("button", { name: "Italic" }).click();
  await page.keyboard.type("italic");
  await page.getByRole("button", { name: "Italic" }).click();
  await page.keyboard.type(" and ");
  await page.getByRole("button", { name: "Underline" }).click();
  await page.keyboard.type("underlined");
  await page.getByRole("button", { name: "Underline" }).click();
  await page.keyboard.press("Enter");

  await page.getByRole("button", { name: "Bulleted list" }).click();
  await page.keyboard.type("First point");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second point");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter"); // leave the list
  await page.getByRole("button", { name: "Numbered list" }).click();
  await page.keyboard.type("Step one");

  await expectSaved(page);
  await screenshot(page, "03-editor-formatting");

  // Reopen: everything must come back from the database.
  await page.reload();
  await expect(page.getByLabel("Document title")).toHaveValue(title);
  await expect(editor(page).locator("h1")).toHaveText("Project kickoff");
  await expect(editor(page).locator("strong")).toHaveText("Important");
  await expect(editor(page).locator("em")).toHaveText("italic");
  await expect(editor(page).locator("u")).toHaveText("underlined");
  await expect(editor(page).locator("ul > li")).toHaveCount(2);
  await expect(editor(page).locator("ol > li")).toHaveText("Step one");

  await page.getByRole("link", { name: "← Documents" }).click();
  await expect(page.getByText(title)).toBeVisible();

  await deleteDocument(context, id);
});

test("an empty title is not saved and the previous title comes back", async ({ page, context }) => {
  await login(page, ALICE);
  const title = `E2E title ${unique()}`;
  const id = await createDocument(page, title);

  const titleInput = page.getByLabel("Document title");
  await titleInput.fill("   ");
  await titleInput.press("Enter");
  await expect(titleInput).toHaveValue(title);

  await page.reload();
  await expect(titleInput).toHaveValue(title);

  await deleteDocument(context, id);
});

test("sharing: viewer is read-only, upgrading to editor allows editing, revoking removes access", async ({
  browser,
}) => {
  const alice = await loginInNewContext(browser, ALICE);
  const title = `E2E shared ${unique()}`;
  const id = await createDocument(alice.page, title);
  await editor(alice.page).click();
  await alice.page.keyboard.type("Written by Alice");
  await expectSaved(alice.page);

  // Alice shares with Bob as a viewer.
  await alice.page.getByRole("button", { name: "Share" }).click();
  const dialog = alice.page.getByRole("dialog");
  await dialog.getByLabel("Email to share with").fill(BOB);
  await dialog.getByLabel("Access level", { exact: true }).selectOption("VIEWER");
  await dialog.getByRole("button", { name: "Share" }).click();
  await expect(dialog.getByText("bob@ajaia.dev")).toBeVisible();

  // Sharing with an unknown user shows a clear error.
  await dialog.getByLabel("Email to share with").fill("ghost@ajaia.dev");
  await dialog.getByRole("button", { name: "Share" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("No user found with email ghost@ajaia.dev");
  await screenshot(alice.page, "04-share-dialog");

  // Bob sees it under "Shared with me" and can only read it.
  const bob = await loginInNewContext(browser, BOB);
  const sharedSection = bob.page.locator("section", { hasText: "Shared with me" });
  await sharedSection.getByText(title).click();
  await expect(editor(bob.page)).toHaveText("Written by Alice");
  await expect(bob.page.getByText("You have view-only access")).toBeVisible();
  await expect(bob.page.getByRole("toolbar", { name: "Formatting" })).toHaveCount(0);
  await expect(editor(bob.page)).toHaveAttribute("contenteditable", "false");
  await screenshot(bob.page, "05-viewer-mode");

  // Alice upgrades Bob to editor. After reloading, Bob can edit.
  await dialog.getByLabel("Access level for Bob Smith").selectOption("EDITOR");
  await expect(dialog.getByLabel("Access level for Bob Smith")).toHaveValue("EDITOR");
  await bob.page.reload();
  await expect(bob.page.getByRole("toolbar", { name: "Formatting" })).toBeVisible();
  await editor(bob.page).click();
  await bob.page.keyboard.press("End");
  await bob.page.keyboard.type(", edited by Bob");
  await expectSaved(bob.page);

  // Bob cannot share or delete: no Share button for non-owners.
  await expect(bob.page.getByRole("button", { name: "Share" })).toHaveCount(0);

  // Alice revokes access; Bob can no longer open the document.
  await dialog.getByRole("button", { name: "Remove Bob Smith" }).click();
  await expect(dialog.getByText("Only you can open this document.")).toBeVisible();
  await bob.page.reload();
  await expect(bob.page.getByText("Cannot open document")).toBeVisible();

  await deleteDocument(alice.context, id);
  await alice.context.close();
  await bob.context.close();
});

test("a user without access cannot open someone else's document", async ({ browser }) => {
  const alice = await loginInNewContext(browser, ALICE);
  const id = await createDocument(alice.page, `E2E private ${unique()}`);

  const carol = await loginInNewContext(browser, CAROL);
  await carol.page.goto(`/documents/${id}`);
  await expect(carol.page.getByText("Cannot open document")).toBeVisible();

  await deleteDocument(alice.context, id);
  await alice.context.close();
  await carol.context.close();
});

test("conflicting edits show a reload prompt instead of overwriting", async ({ browser }) => {
  const alice = await loginInNewContext(browser, ALICE);
  const id = await createDocument(alice.page, `E2E conflict ${unique()}`);
  await alice.context.request.post(`/api/documents/${id}/shares`, { data: { email: BOB, role: "EDITOR" } });

  const bob = await loginInNewContext(browser, BOB);
  await bob.page.goto(`/documents/${id}`);

  // Bob saves first.
  await editor(bob.page).click();
  await bob.page.keyboard.type("Bob was here first");
  await expectSaved(bob.page);

  // Alice still has the old version open, so her save is rejected.
  await editor(alice.page).click();
  await alice.page.keyboard.type("Alice typing later");
  await expect(alertMessage(alice.page)).toContainText("Someone else saved this document");
  await expect(alice.page.getByRole("status")).toHaveText("Not saved: newer version exists");
  await screenshot(alice.page, "06-conflict");

  await alice.page.getByRole("button", { name: "Reload" }).click();
  await expect(editor(alice.page)).toHaveText("Bob was here first");

  await deleteDocument(alice.context, id);
  await alice.context.close();
  await bob.context.close();
});

test("import a Markdown file as a new document, and reject unsupported files", async ({ page, context }) => {
  await login(page, ALICE);

  await page.getByTestId("import-input").setInputFiles({
    name: "Imported notes.md",
    mimeType: "text/markdown",
    buffer: Buffer.from("# From a file\n\nSome **bold** text\n\n- one\n- two\n"),
  });

  await expect(page).toHaveURL(/\/documents\/[^/]+$/);
  await expect(page.getByLabel("Document title")).toHaveValue("Imported notes");
  await expect(editor(page).locator("h1")).toHaveText("From a file");
  await expect(editor(page).locator("strong")).toHaveText("bold");
  await expect(editor(page).locator("ul > li")).toHaveCount(2);
  const id = page.url().split("/").pop()!;
  await screenshot(page, "07-imported-markdown");

  await page.goto("/documents");
  await page.getByTestId("import-input").setInputFiles({
    name: "contract.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4"),
  });
  await expect(alertMessage(page)).toContainText("Unsupported file type");

  await deleteDocument(context, id);
});
