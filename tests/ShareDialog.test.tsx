import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShareDialog } from "@/components/ShareDialog";
import { ApiError, api } from "@/lib/api";
import type { Share } from "@/lib/types";

const owner = { id: "u1", name: "Alice", email: "alice@ajaia.dev" };
const bobShare: Share = { userId: "u2", name: "Bob", email: "bob@ajaia.dev", role: "EDITOR" };

function renderDialog(shares: Share[] = []) {
  const onSharesChange = vi.fn();
  const onClose = vi.fn();
  render(
    <ShareDialog
      documentId="doc1"
      documentTitle="Plan"
      owner={owner}
      shares={shares}
      onSharesChange={onSharesChange}
      onClose={onClose}
    />,
  );
  return { onSharesChange, onClose, user: userEvent.setup() };
}

beforeEach(() => {
  vi.spyOn(api, "demoUsers").mockResolvedValue({ users: [] });
});
afterEach(() => vi.restoreAllMocks());

describe("ShareDialog", () => {
  it("shares with the chosen role and clears the input", async () => {
    const addShare = vi.spyOn(api, "addShare").mockResolvedValue({ shares: [bobShare] });
    const { user, onSharesChange } = renderDialog();

    await user.type(screen.getByLabelText("Email to share with"), "bob@ajaia.dev");
    await user.selectOptions(screen.getByLabelText("Access level"), "VIEWER");
    await user.click(screen.getByRole("button", { name: "Share" }));

    expect(addShare).toHaveBeenCalledWith("doc1", "bob@ajaia.dev", "VIEWER");
    expect(onSharesChange).toHaveBeenCalledWith([bobShare]);
    expect(screen.getByLabelText("Email to share with")).toHaveValue("");
  });

  it("shows the server's error message, e.g. for an unknown email", async () => {
    vi.spyOn(api, "addShare").mockRejectedValue(new ApiError(404, "No user found with email ghost@ajaia.dev"));
    const { user, onSharesChange } = renderDialog();

    await user.type(screen.getByLabelText("Email to share with"), "ghost@ajaia.dev");
    await user.click(screen.getByRole("button", { name: "Share" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No user found with email ghost@ajaia.dev");
    expect(onSharesChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Email to share with")).toHaveValue("ghost@ajaia.dev");
  });

  it("asks for an email instead of calling the API when the input is empty", async () => {
    const addShare = vi.spyOn(api, "addShare");
    const { user } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Share" }));

    expect(addShare).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/Enter the email/);
  });

  it("lists the owner and current collaborators, and can change or remove access", async () => {
    const updateShare = vi.spyOn(api, "updateShare").mockResolvedValue({ shares: [{ ...bobShare, role: "VIEWER" }] });
    const removeShare = vi.spyOn(api, "removeShare").mockResolvedValue({ shares: [] });
    const { user } = renderDialog([bobShare]);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Access level for Bob"), "VIEWER");
    expect(updateShare).toHaveBeenCalledWith("doc1", "u2", "VIEWER");

    await user.click(screen.getByRole("button", { name: "Remove Bob" }));
    expect(removeShare).toHaveBeenCalledWith("doc1", "u2");
  });

  it("closes with the Escape key", async () => {
    const { user, onClose } = renderDialog();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});
