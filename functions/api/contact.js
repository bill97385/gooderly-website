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

    const emailBody = `
來自好得力企業社網站的詢問

主題：${subject}
姓名：${name}
E-mail：${email}

內容：
${message}
    `.trim();

    // Send email via MailChannels
    const sendResult = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [
          { to: [{ email: "a16389787@yahoo.com.tw", name: "好得力企業社" }] },
        ],
        from: { email: "noreply@xn--22qx2bp2fd1df8j.tw", name: "好得力企業社網站" },
        reply_to: { email: email, name: name },
        subject: `[網站詢問] ${subject}`,
        content: [{ type: "text/plain", value: emailBody }],
      }),
    });

    return redirect(sendResult.ok ? "/contact.html?success=1" : "/contact.html?error=1");
  } catch (e) {
    return redirect("/contact.html?error=1");
  }
}
