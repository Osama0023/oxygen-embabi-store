/**
 * One-time script to upload app-icon.png to Cloudinary.
 * Run: node scripts/upload-app-icon-to-cloudinary.js
 * Requires: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env
 */

const path = require('path');
const fs = require('fs');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const idx = line.indexOf('=');
    if (idx > 0 && !line.trim().startsWith('#')) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (val) process.env[key] = val;
    }
  });
}

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET in .env');
  process.exit(1);
}

const cloudinary = require('cloudinary').v2;
cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

const iconPath = path.join(__dirname, '..', 'public', 'app-icon.png');
if (!fs.existsSync(iconPath)) {
  console.error('app-icon.png not found in public folder');
  process.exit(1);
}

cloudinary.uploader.upload(iconPath, {
  folder: 'embabi-store/icons',
  public_id: 'app-icon',
  overwrite: true,
  resource_type: 'image',
}, (err, result) => {
  if (err) {
    console.error('Upload failed:', err.message);
    process.exit(1);
  }
  const url = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/embabi-store/icons/app-icon`;
  console.log('\n✓ Uploaded successfully!\n');
  console.log('Add this to your .env file:\n');
  console.log(`NEXT_PUBLIC_APP_ICON_URL=${url}`);
  console.log('\n(Or use the full URL with version:', result.secure_url, ')\n');
});
