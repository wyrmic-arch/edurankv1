import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-night flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md text-center">
        <div className="label mb-4">ERROR 404</div>
        <h1 className="font-serif text-6xl font-medium tracking-tight leading-none mb-6 text-ash">Off the map.</h1>
        <p className="text-ghost text-body mb-10">
          The page you are looking for doesn&rsquo;t exist, or it has been moved. It happens — even to the
          best navigators.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/" className="btn-solid">
            BACK TO BASE
          </Link>
          <Link href="/register" className="btn-ghost">
            GET STARTED
          </Link>
        </div>
      </div>
    </div>
  );
}
