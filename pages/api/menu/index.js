import dbConnect from '../../../lib/mongodb';
import MenuItem from '../../../lib/models/MenuItem';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const items = await MenuItem.find({}).sort({ category: 1, name: 1 }).lean();
    return res.json(items);
  }

  if (req.method === 'POST') {
    if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const item = await MenuItem.create({
        name:        req.body.name,
        description: req.body.description || '',
        price:       Number(req.body.price),
        category:    req.body.category || 'General',
        imageUrl:    req.body.imageUrl || '',
        isAvailable: req.body.isAvailable !== false,
      });
      return res.status(201).json(item);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  res.status(405).end();
}
