import { v2 as cloudinary } from 'cloudinary';
import { requireAdmin } from '../../lib/auth';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { file } = req.body || {};
  if (!file) return res.status(400).json({ error: 'No file provided' });

  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: 'house-bird-cafe/menu',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto:good', fetch_format: 'auto' },
      ],
    });
    return res.json({ url: result.secure_url });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
}