import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("is type=button by default so it never submits a form by accident", () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button>Plain</Button>
        <Button type="submit">Send</Button>
      </form>,
    );

    expect(screen.getByRole("button", { name: "Plain" })).toHaveAttribute("type", "button");
    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute("type", "submit");
  });

  it("does not fire clicks while disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Alert", () => {
  it("announces errors to screen readers but not warnings", () => {
    render(
      <>
        <Alert>Something failed</Alert>
        <Alert tone="warning">Heads up</Alert>
      </>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Something failed");
    expect(screen.getByText("Heads up").closest("[role=alert]")).toBeNull();
  });

  it("renders an optional action", () => {
    render(<Alert action={<button>Reload</button>}>Conflict</Alert>);
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
  });
});

describe("Avatar", () => {
  it.each([
    ["Alice Johnson", "AJ"],
    ["carol", "C"],
    ["Mary Ann Lee", "MA"],
  ])("shows initials for %s", (name, initials) => {
    const { container } = render(<Avatar name={name} />);
    expect(container.textContent).toBe(initials);
  });

  it("uses the same colour for the same name", () => {
    const first = render(<Avatar name="Bob Smith" />).container.firstElementChild!.className;
    const second = render(<Avatar name="Bob Smith" />).container.firstElementChild!.className;
    expect(first).toBe(second);
  });
});
