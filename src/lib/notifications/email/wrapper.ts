export function wrapEmailHtml(
  heading: string,
  bodyHtml: string,
  ctaLabel?: string,
  ctaUrl?: string,
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; background:#f8faf8; padding:32px 16px;">
    <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e1e3e1;">
      <div style="background:#0d6436; padding:20px 24px;">
        <span style="color:#ffffff; font-size:16px; font-weight:600;">ABU Cooperative</span>
      </div>
      <div style="padding:24px;">
        <h1 style="font-size:18px; color:#191c1b; margin:0 0 12px;">${heading}</h1>
        <div style="font-size:14px; color:#404940; line-height:1.6;">${bodyHtml}</div>
        ${
          ctaLabel && ctaUrl
            ? `<a href="${appUrl}${ctaUrl}" style="display:inline-block; margin-top:20px; background:#0d6436; color:#ffffff; text-decoration:none; padding:10px 20px; border-radius:6px; font-size:14px; font-weight:500;">${ctaLabel}</a>`
            : ""
        }
      </div>
      <div style="padding:16px 24px; border-top:1px solid #e1e3e1;">
        <p style="font-size:11px; color:#8a938c; margin:0;">ABU Cooperative Management System</p>
      </div>
    </div>
  </div>`;
}
