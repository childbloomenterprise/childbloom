export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { rating, ratingLabel, message, userEmail, userName } = req.body || {};

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'invalid_rating' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(503).json({ error: 'email_service_unavailable' });
  }

  const stars = '⭐'.repeat(rating);

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f5f0e8; border-radius: 16px;">
      <h1 style="color: #1f5e3a; font-size: 24px; margin: 0 0 6px;">New Review — ChildBloom</h1>
      <p style="color: #6a9a7a; font-size: 12px; margin: 0 0 28px; text-transform: uppercase; letter-spacing: 0.12em;">User Feedback</p>

      <div style="background: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 14px;">
        <p style="font-size: 30px; margin: 0 0 10px;">${stars}</p>
        <p style="font-size: 22px; font-weight: bold; color: #1f5e3a; margin: 0 0 4px;">${ratingLabel}</p>
        <p style="color: #6a9a7a; font-size: 13px; margin: 0;">Rating: ${rating} / 5</p>
      </div>

      ${message ? `
      <div style="background: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 14px;">
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #6a9a7a; margin: 0 0 10px;">Message</p>
        <p style="color: #2A1C15; font-size: 15px; margin: 0; line-height: 1.65;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      </div>
      ` : ''}

      <div style="background: #ffffff; border-radius: 12px; padding: 24px;">
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #6a9a7a; margin: 0 0 10px;">From</p>
        <p style="color: #2A1C15; font-size: 15px; margin: 0;">${(userName || 'Anonymous').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        ${userEmail ? `<p style="color: #6a9a7a; font-size: 13px; margin: 4px 0 0;">${userEmail.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : ''}
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ChildBloom Reviews <onboarding@resend.dev>',
        to: 'childbloomenterprise@gmail.com',
        subject: `${stars} ${ratingLabel} — New ChildBloom Review`,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Resend error:', err);
      return res.status(503).json({ error: 'email_failed' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('send-review error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
