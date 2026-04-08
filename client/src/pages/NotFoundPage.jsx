import { Link } from "react-router-dom";

export const NotFoundPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 p-4 text-center text-white">
    <p className="text-sm uppercase tracking-[0.4em] text-blue-200">404</p>
    <h1 className="text-4xl font-bold">Page introuvable</h1>
    <Link to="/" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950">
      Retour à l’accueil
    </Link>
  </div>
);
