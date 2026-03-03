import { describe, expect, it } from "vitest";
import { resolveLocale, textFor, withLang } from "@/lib/i18n";

describe("i18n helpers", () => {
  it("resolves only en/fr locales", () => {
    expect(resolveLocale("fr")).toBe("fr");
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("de")).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
  });

  it("returns localized labels", () => {
    expect(textFor("en").navHome).toBe("Home");
    expect(textFor("fr").navHome).toBe("Accueil");
  });

  it("appends language query param safely", () => {
    expect(withLang("/dashboard", "fr")).toBe("/dashboard?lang=fr");
    expect(withLang("/dashboard?tab=returns", "en")).toBe("/dashboard?tab=returns&lang=en");
  });
});
