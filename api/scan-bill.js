import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_PROMPT = `You are a medical bill extraction assistant for ChildBloom, an Indian child development app. You extract information from Indian hospital bills, pharmacy receipts, and doctor consultation receipts.

Extract ALL available information and return ONLY valid JSON. No preamble, no explanation, just JSON.

If a field is not found in the bill, use null.
For amounts, return numbers only (no ₹ symbol).
For dates, return YYYY-MM-DD format.
For medicines, extract name, dosage, duration, and instructions separately.

Return this exact JSON structure:
{
  "hospital_name": "string or null",
  "doctor_name": "string or null",
  "bill_date": "YYYY-MM-DD or null",
  "visit_type": "consultation|vaccination|emergency|lab_test|pharmacy|other",
  "diagnosis": "string or null",
  "medicines": [
    {
      "name": "medicine name",
      "dosage": "e.g. 5ml",
      "duration": "e.g. 5 days",
      "instructions": "e.g. after food, twice daily"
    }
  ],
  "tests_done": [
    {
      "test_name": "e.g. CBC",
      "result": "e.g. Normal",
      "normal_range": "e.g. 4-11 x10^3/uL or null"
    }
  ],
  "total_amount": number or null,
  "amount_paid": number or null,
  "follow_up_date": "YYYY-MM-DD or null",
  "follow_up_notes": "string or null",
  "ai_summary": "2-3 sentence warm summary of this visit for parents. Reference child's name if provided. Mention any important follow-ups.",
  "confidence": "high|medium|low"
}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { imageBase64, childId, childName, childAgeMonths } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'No image provided' });
  }

  try {
    // Rate limit: max 10 scans per user per day (count today's medical_bills)
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('medical_bills')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today + 'T00:00:00Z');

    if (count >= 10) {
      return res.status(429).json({
        error: 'rate_limit',
        message: 'You have reached the limit of 10 bill scans per day.',
      });
    }

    // Detect media type and strip data URL prefix
    let mediaType = 'image/jpeg';
    if (imageBase64.includes('data:image/png')) mediaType = 'image/png';
    else if (imageBase64.includes('data:image/webp')) mediaType = 'image/webp';
    else if (imageBase64.includes('data:image/gif')) mediaType = 'image/gif';

    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `Extract all medical information from this hospital bill/receipt. Child name: ${childName || 'unknown'}, Age: ${childAgeMonths || 'unknown'} months.`,
            },
          ],
        },
      ],
    });

    const responseText = message.content[0].text.trim();

    let extracted;
    try {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      extracted = JSON.parse(jsonMatch ? jsonMatch[1] : responseText);
    } catch {
      return res.status(422).json({
        error: 'unclear_image',
        message: 'Could not read the bill clearly. Please retake in better lighting.',
      });
    }

    // Verify it looks like a medical document
    const hasMedicalContent =
      extracted.hospital_name ||
      extracted.doctor_name ||
      (extracted.medicines && extracted.medicines.length > 0) ||
      extracted.diagnosis ||
      extracted.total_amount;

    if (!hasMedicalContent) {
      return res.status(422).json({
        error: 'not_medical',
        message: 'This does not appear to be a medical bill.',
      });
    }

    return res.status(200).json(extracted);
  } catch (err) {
    return res.status(500).json({
      error: 'scan_failed',
      message: 'Could not process the bill. Please try again.',
    });
  }
}
