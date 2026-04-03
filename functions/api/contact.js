import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

const TURNSTILE_SECRET = "0x4AAAAAAC0DuGS0Ys9DGTaSdFxyOIjnysw";

export async function onRequestPost(context) {
  const redirect = (path) =>
    Response.redirect(new URL(path, context.request.url).toString(), 303);

  try {
    const formData = await context.request.formData();

    // Verify Turnstile token
    const token = formData.get("cf-turnstile-response");
    if (!token) return redirect("/contact.html?error=1");

    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: TURNSTILE_SECRET, response: token }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) return redirect("/contact.html?error=1");

    // Extract form fields
    const subject = formData.get("subject") || "(無主題)";
    const name = formData.get("name") || "(未填寫)";
    const email = formData.get("email") || "(未填寫)";
    const message = formData.get("message") || "(無內容)";

    // Build email
    const msg = createMimeMessage();
    msg.setSender({ name: "好得力企業社網站", addr: "noreply@xn--22qx2bp2fd1df8j.tw" });
    msg.setRecipient("a16389787@yahoo.com.tw");
    msg.setSubject(`[網站詢問] ${subject}`);
    msg.setHeader("Reply-To", { addr: email, name: name });
    msg.addMessage({
      contentType: "text/plain",
      data: `來自好得力企業社網站的詢問\n\n主題：${subject}\n姓名：${name}\nE-mail：${email}\n\n內容：\n${message}`,
    });

    const emailMsg = new EmailMessage(
      "noreply@xn--22qx2bp2fd1df8j.tw",
      "a16389787@yahoo.com.tw",
      msg.asRaw()
    );

    await context.env.CONTACT_EMAIL.send(emailMsg);
    return redirect("/contact.html?success=1");
  } catch (e) {
    return redirect("/contact.html?error=1");
  }
}
