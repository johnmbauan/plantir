import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { assertSpyCall, assertSpyCalls, stub } from "jsr:@std/testing/mock";
import { sendResendEmail } from "../../alert-notifier/resend.ts";
import { json } from "../utils/supabase_env.ts";

const EMAIL = {
  from: "Plantir <alerts@plantir.green>",
  to: "user@example.com",
  subject: "Basil needs water",
  html: "<p>Basil</p>",
  text: "Basil",
};

describe("sendResendEmail", () => {
  it("posts the email to the Resend API", async () => {
    using fetchStub = stub(globalThis, "fetch", async () => json({ id: "re_1" }));
    await sendResendEmail("re_test", EMAIL);
    assertSpyCalls(fetchStub, 1);
    assertSpyCall(fetchStub, 0, {
      args: [
        "https://api.resend.com/emails",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer re_test",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: EMAIL.from,
            to: [EMAIL.to],
            subject: EMAIL.subject,
            html: EMAIL.html,
            text: EMAIL.text,
          }),
        },
      ],
    });
  });

  it("throws when Resend returns a non-OK status", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      async () => new Response("quota exceeded", { status: 429 }),
    );
    await assertRejects(
      () => sendResendEmail("re_test", EMAIL),
      Error,
      "Resend 429: quota exceeded",
    );
  });
});
