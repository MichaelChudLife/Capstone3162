import { beforeEach, describe, expect, it } from "vitest";
import { freshWorkspace } from "./helpers";

type Workspace = Awaited<ReturnType<typeof freshWorkspace>>;
let ws: Workspace;

const DEMO_PASSWORD = "Committee2026!";
const SCRYPT_HASH = /[0-9a-f]{32}:[0-9a-f]{128}/;

beforeEach(async () => {
  ws = await freshWorkspace();
});

describe("F_REQ-8 · Password hashes stay on the server", () => {
  it("leaves the hash off every member record that pages hand to components", () => {
    const records = [...ws.data.getMembers(), ws.data.getCurrentUser(), ws.data.getMemberById("m2")];

    for (const member of records) {
      expect(member).not.toHaveProperty("passwordHash");
      expect(JSON.stringify(member)).not.toMatch(SCRYPT_HASH);
    }
  });

  it("still signs a member in with the right password", () => {
    expect(ws.data.authenticate("michael@cca.org.au", DEMO_PASSWORD)?.id).toBe("m1");
    expect(ws.data.authenticate("  Sener@CCA.org.au ", DEMO_PASSWORD)?.id).toBe("m5");
  });

  it("refuses a wrong password or an unknown email", () => {
    expect(ws.data.authenticate("michael@cca.org.au", "committee2026!")).toBeUndefined();
    expect(ws.data.authenticate("michael@cca.org.au", "")).toBeUndefined();
    expect(ws.data.authenticate("nobody@cca.org.au", DEMO_PASSWORD)).toBeUndefined();
  });
});
