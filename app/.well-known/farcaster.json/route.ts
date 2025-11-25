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
    "ownerAddress": "0x" // add your Base Account address here
  },
  "miniapp": {
    "version": "1",
    "name": "Example Mini App",
    "homeUrl": "https://ex.co",
    "iconUrl": "https://ex.co/i.png",
    "splashImageUrl": "https://ex.co/l.png",
    "splashBackgroundColor": "#000000",
    "webhookUrl": "https://ex.co/api/webhook",
    "subtitle": "Fast, fun, social",
    "description": "A fast, fun way to challenge friends in real time.",
    "screenshotUrls": [
      "https://ex.co/s1.png",
      "https://ex.co/s2.png",
      "https://ex.co/s3.png"
    ],
    "primaryCategory": "social",
    "tags": ["example", "miniapp", "baseapp"],
    "heroImageUrl": "https://ex.co/og.png",
    "tagline": "Play instantly",
    "ogTitle": "Example Mini App",
    "ogDescription": "Challenge friends in real time.",
    "ogImageUrl": "https://ex.co/og.png",
    "noindex": true
  }
}); // see the next step for the manifest_json_object
}