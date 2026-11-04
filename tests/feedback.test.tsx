import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ToastProvider, useToast } from "@/components/ui/Toast";

function ToastButtons() {
  const toast = useToast();
  return (
    <>
      <button onClick={() => toast.success("Saved!")}>ok</button>
      <button onClick={() => toast.error("Failed!")}>fail</button>
    </>
  );
}

describe("Toast", () => {
  afterEach(() => vi.useRealTimers());

  it("shows success and error toasts; only errors are announced as alerts", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastButtons />
      </ToastProvider>,
    );

    await user.click(screen.getByText("ok"));
    await user.click(screen.getByText("fail"));

    expect(screen.getByText("Saved!")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Failed!");
  });

  it("can be dismissed with the close button", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastButtons />
      </ToastProvider>,
    );

    await user.click(screen.getByText("ok"));
    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));

    expect(screen.queryByText("Saved!")).not.toBeInTheDocument();
  });

  it("disappears on its own after a few seconds", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <ToastButtons />
      </ToastProvider>,
    );

    act(() => screen.getByText("ok").click());
    expect(screen.getByText("Saved!")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByText("Saved!")).not.toBeInTheDocument();
  });

  it("explains a missing provider instead of failing silently", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ToastButtons />)).toThrow(/ToastProvider/);
  });
});

describe("ConfirmDialog", () => {
  function setup() {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="Delete document?"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    return { onConfirm, onCancel, user: userEvent.setup() };
  }

  it("shows the question in an accessible dialog", () => {
    setup();
    expect(screen.getByRole("dialog", { name: "Delete document?" })).toHaveTextContent("This cannot be undone.");
  });

  it("confirms only when the destructive button is clicked", async () => {
    const { user, onConfirm, onCancel } = setup();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("focuses Cancel, so pressing Enter does not delete by accident", async () => {
    const { user, onConfirm, onCancel } = setup();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("cancels with Escape", async () => {
    const { user, onCancel } = setup();
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalled();
  });
});
