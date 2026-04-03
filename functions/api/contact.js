export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const subject = formData.get("subject") || "(無主題)";
    const name = formData.get("name") || "(未填寫)";
    const email = formData.get("email") || "(未填寫)";
    const message = formData.get("message") || "(無內容)";

    // Send email via MailChannels (free for Cloudflare Workers)
    const emailBody = `
來自好得力企業社網站的詢問

主題：${subject}
姓名：${name}
E-mail：${email}

內容：
${message}
    `.trim();

    const sendResult = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: "a16389787@yahoo.com.tw", name: "好得力企業社" }],
          },
        ],
        from: {
          email: "noreply@xn--22qx2bp2fd1df8j.tw",
          name: "好得力企業社網站",
        },
        reply_to: { email: email, name: name },
        subject: `[網站詢問] ${subject}`,
        content: [{ type: "text/plain", value: emailBody }],
      }),
    });

    if (sendResult.ok) {
      return Response.redirect(new URL("/contact.html?success=1", context.request.url).toString(), 303);
    } else {
      return Response.redirect(new URL("/contact.html?error=1", context.request.url).toString(), 303);
    }
  } catch (e) {
    return Response.redirect(new URL("/contact.html?error=1", context.request.url).toString(), 303);
  }
}
