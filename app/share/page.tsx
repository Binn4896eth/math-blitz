import type { Metadata } from "next";

type SharePageProps = {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
};

// Helper to safely extract a string from searchParams
function getParam(
  searchParams: SharePageProps["searchParams"],
  key: string,
  fallback: string
): string {
  const value = searchParams[key];
  if (Array.isArray(value)) return value[0] ?? fallback;
  if (typeof value === "string") return value;
  return fallback;
}

// This controls the meta tags, including fc:miniapp / fc:frame
export async function generateMetadata(
  { searchParams }: SharePageProps
): Promise<Metadata> {
  const score = getParam(searchParams, "score", "0");
  const username = getParam(searchParams, "username", "Player");

  // 🔁 Replace with your real deployed URL
  const baseUrl = "https://math-blitz-nine.vercel.app/";

  const imageUrl = `${baseUrl}/api/share-image?score=${encodeURIComponent(
    score
  )}&username=${encodeURIComponent(username)}`;

  const embed = {
    version: "1",
    imageUrl,
    button: {
      title: "🎯 Play Math Blitz",
      action: {
        type: "launch_miniapp",
        url: baseUrl + "/",
        name: "Math Blitz",
        splashImageUrl: baseUrl + "https://imgur.com/a/TOceCaM",
        splashBackgroundColor: "#4d56f8ff",
      },
    },
  };

  return {
    title: `Math Blitz – ${username} scored ${score}`,
    description: `${username} scored ${score} points in Math Blitz. Can you beat them?`,
    openGraph: {
      images: [imageUrl],
    },
    other: {
      "fc:miniapp": JSON.stringify(embed),
      "fc:frame": JSON.stringify(embed),
    },
  };
}

// The actual page content (what a browser shows when visiting the URL)
export default function SharePage({ searchParams }: SharePageProps) {
  const score = getParam(searchParams, "score", "0");
  const username = getParam(searchParams, "username", "Player");

  // 🔁 Same base URL as above
  const baseUrl = "https://math-blitz-nine.vercel.app";
  const imageUrl = `${baseUrl}/api/share-image?score=${encodeURIComponent(
    score
  )}&username=${encodeURIComponent(username)}`;

  return (
    <div className="min-h-screen flex justify-start bg-gradient-to-b from-purple-50 via-blue-50 to-slate-50 px-4 pt-10 pb-10">
      <div className="max-w-xl w-full mx-auto bg-white/90 border border-slate-200 rounded-3xl shadow-xl px-6 py-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
          Math Blitz Result
        </h1>
        <p className="text-sm text-slate-500 mb-4">
          This is the share preview for Farcaster.
        </p>

        <p className="mt-3 text-lg">
          <span className="text-slate-500">@{username}</span>{" "}
          <span className="ml-1">scored</span>{" "}
          <span className="font-bold text-purple-700">{score}</span>{" "}
          <span>points!</span>
        </p>

        <img
          src={imageUrl}
          alt="Math Blitz share preview"
          className="mt-6 rounded-2xl border shadow-lg mx-auto"
        />

        <p className="text-sm mt-8 text-gray-600">
          Share this link on Farcaster to show off your score.
        </p>
        <p className="text-xs mt-2 text-gray-400">
          URL: <code className="break-all">{`${baseUrl}/share?score=${score}&username=${username}`}</code>
        </p>
      </div>
    </div>
  );
}
