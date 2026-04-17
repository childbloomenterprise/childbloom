import { generateWeeklyInsight } from '../services/aiService.js';
import { weeklyInsightSchema } from '../validators/aiValidators.js';

export async function postWeeklyInsight(req, res, next) {
  try {
    const parsed = weeklyInsightSchema.parse(req.body);
    const insight = await generateWeeklyInsight(parsed);
    res.json({ data: { insight } });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({
        error: { message: 'Invalid request data', details: err.errors },
      });
    }
    next(err);
  }
}
