import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock resend before importing email module
vi.mock("resend", () => {
  const mockSend = vi.fn();
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: { send: mockSend }
    })),
    __mockSend: mockSend
  };
});

import {
  isEmailEnabled,
  sendEmail,
  sendFilingConfirmation,
  sendSubmissionConfirmation,
  sendWelcomeOrSignInNotification
} from "@/lib/email";

// Access the mock send function
const { __mockSend: mockSend } = await import("resend") as unknown as { __mockSend: ReturnType<typeof vi.fn> };

describe("email service", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("isEmailEnabled", () => {
    it("returns false when RESEND_API_KEY is not set", () => {
      delete process.env.RESEND_API_KEY;
      expect(isEmailEnabled()).toBe(false);
    });

    it("returns true when RESEND_API_KEY is set", () => {
      process.env.RESEND_API_KEY = "re_test_key";
      expect(isEmailEnabled()).toBe(true);
    });
  });

  describe("sendEmail", () => {
    it("returns success:false when RESEND_API_KEY is not set", async () => {
      delete process.env.RESEND_API_KEY;
      const result = await sendEmail({
        to: "user@example.com",
        subject: "Test",
        html: "<p>Test</p>"
      });
      expect(result).toEqual({ success: false });
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("sends email successfully when API key is set", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockSend.mockResolvedValue({ data: { id: "email-123" }, error: null });

      const result = await sendEmail({
        to: "user@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
        text: "Hello"
      });

      expect(result).toEqual({ success: true, id: "email-123" });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: "Test Subject",
          html: "<p>Hello</p>",
          text: "Hello"
        })
      );
    });

    it("returns success:false when Resend returns an error", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockSend.mockResolvedValue({ data: null, error: { message: "Invalid API key" } });

      const result = await sendEmail({
        to: "user@example.com",
        subject: "Test",
        html: "<p>Test</p>"
      });

      expect(result).toEqual({ success: false });
    });

    it("returns success:false when send throws", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockSend.mockRejectedValue(new Error("Network error"));

      const result = await sendEmail({
        to: "user@example.com",
        subject: "Test",
        html: "<p>Test</p>"
      });

      expect(result).toEqual({ success: false });
    });
  });

  describe("sendFilingConfirmation", () => {
    const baseVars = {
      email: "filer@example.com",
      name: "Jane Doe",
      taxYear: 2024,
      filingMode: "INDIVIDUAL",
      status: "DRAFT",
      returnId: "ret-abc",
      missingFields: 3,
      appUrl: "https://app.example.com"
    };

    it("sends EN filing confirmation with missing fields warning", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockSend.mockResolvedValue({ data: { id: "fc-1" }, error: null });

      await sendFilingConfirmation(baseVars, "en");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "filer@example.com",
          subject: "Your 2024 tax return has been saved"
        })
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("3");
      expect(call.html).toContain("required field(s) still need values");
      expect(call.html).toContain("ret-abc");
    });

    it("sends FR filing confirmation with completion message", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockSend.mockResolvedValue({ data: { id: "fc-2" }, error: null });

      await sendFilingConfirmation({ ...baseVars, missingFields: 0 }, "fr");

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("2024");
      expect(call.subject).toContain("enregistrée");
      expect(call.html).toContain("Tous les champs requis sont remplis");
      expect(call.html).toContain("lang=fr");
    });
  });

  describe("sendSubmissionConfirmation", () => {
    const baseVars = {
      email: "filer@example.com",
      name: "Jane Doe",
      taxYear: 2024,
      provider: "sandbox",
      confirmationNumber: "SBX-12345",
      status: "SUBMISSION_PENDING",
      appUrl: "https://app.example.com"
    };

    it("sends EN submission confirmation", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockSend.mockResolvedValue({ data: { id: "sc-1" }, error: null });

      await sendSubmissionConfirmation(baseVars, "en");

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("submitted");
      expect(call.html).toContain("SBX-12345");
      expect(call.html).toContain("sandbox");
    });

    it("sends FR submission confirmation", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockSend.mockResolvedValue({ data: { id: "sc-2" }, error: null });

      await sendSubmissionConfirmation(baseVars, "fr");

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("soumise");
      expect(call.html).toContain("SBX-12345");
    });
  });

  describe("sendWelcomeOrSignInNotification", () => {
    it("sends welcome email for new users (EN)", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockSend.mockResolvedValue({ data: { id: "w-1" }, error: null });

      await sendWelcomeOrSignInNotification({
        email: "new@example.com",
        name: "New User",
        isNewUser: true,
        appUrl: "https://app.example.com"
      }, "en");

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("Welcome");
      expect(call.html).toContain("account has been created");
      expect(call.html).toContain("/returns/new");
    });

    it("sends sign-in notification for existing users (FR)", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockSend.mockResolvedValue({ data: { id: "s-1" }, error: null });

      await sendWelcomeOrSignInNotification({
        email: "existing@example.com",
        name: "Existing",
        isNewUser: false,
        provider: "google",
        appUrl: "https://app.example.com"
      }, "fr");

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("Nouvelle connexion");
      expect(call.html).toContain("google");
      expect(call.html).toContain("lang=fr");
    });
  });
});
