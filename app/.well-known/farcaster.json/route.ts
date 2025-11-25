function withValidProperties(properties: Record<string, undefined | string | string[]>) {
return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
);
}

export async function GET() {
const URL = process.env.NEXT_PUBLIC_URL as string;
return Response.json({
  "accountAssociation": {
    "header": "eyJmaWQiOjExMzcxNjgsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg5NzdiYmNlMDdCMjc3NWYzRWFjOURDNjMwNUNhRjg2NEE5NkI4NTc1In0",
    "payload": "eyJkb21haW4iOiJtYXRoLWJsaXR6LW5pbmUudmVyY2VsLmFwcCJ9",
    "signature": "uGqD/eWWuIB7R+Gznp4Ouf52Y8Ni39mriM64wO8LQ8RGUxZr+Cf6OoTHMOjWFjmhPeiskK4BjbfVmYsfjfKNCxw="
  },
  "baseBuilder": {
    "ownerAddress": "0x499184D108bb3dd6B085304E8E6F4370eABAa803" // add your Base Account address here
  },
  "miniapp": {
    "version": "1",
    "name": "Math Blitz",
    "homeUrl": "https://math-blitz.vercel.app",
    "iconUrl": "https://math-blitz.vercel.app/math-blitz-logo.png",
    "splashImageUrl": "https://math-blitz.vercel.app/math-blitz-logo.png",
    "splashBackgroundColor": "#020617",
    "webhookUrl": "https://math-blitz.vercel.app/api/webhook",
    "subtitle": "Fast math, faster reflexes",
    "description": "Math Blitz is a fast-paced math game with lives, difficulties, and a countdown on every question. Test your brain with addition, multiplication, and division under pressure.",
    "screenshotUrls": [
      "https://math-blitz.vercel.app/screenshots/screen1.png",
      "https://math-blitz.vercel.app/screenshots/screen2.png",
      "https://math-blitz.vercel.app/screenshots/screen3.png"
    ],
    "primaryCategory": "games",
    "tags": ["math", "game", "miniapp", "baseapp", "education"],
    "heroImageUrl": "https://math-blitz.vercel.app/og-math-blitz.png",
    "tagline": "Beat the timer, save your lives.",
    "ogTitle": "Math Blitz – Beat the Clock",
    "ogDescription": "Choose your difficulty and race the timer in this high-speed math challenge.",
    "ogImageUrl": "https://math-blitz.vercel.app/og-math-blitz.png",
    "noindex": true
  }
}); // see the next step for the manifest_json_object
}