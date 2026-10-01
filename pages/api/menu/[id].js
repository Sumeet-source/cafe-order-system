import dbConnect from '../../../lib/mongodb';
import MenuItem from '../../../lib/models/MenuItem';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  await dbConnect();
  const { id } = req.query;

  if (req.method === 'PUT') {
    const updated = await MenuItem.findByIdAndUpdate(id, req.body, { new: true });
    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    await MenuItem.findByIdAndDelete(id);
    return res.json({ success: true });
  }

  res.status(405).end();
}
