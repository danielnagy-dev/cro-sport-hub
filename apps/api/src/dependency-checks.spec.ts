import { describe, expect, it } from "vite-plus/test";
import { checkPostgres, checkRedis } from "./dependency-checks.js";

describe("dependency checks", () => {
  it("reports Postgres down when the port is closed", async () => {
    await expect(
      checkPostgres("postgresql://cro_sport:cro_sport@127.0.0.1:1/cro_sport"),
    ).resolves.toBe("down");
  });

  it("reports Redis down when the port is closed", async () => {
    await expect(checkRedis("redis://127.0.0.1:1")).resolves.toBe("down");
  });
});
