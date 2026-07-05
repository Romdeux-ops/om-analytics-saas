import { Reveal } from "@/src/components/ui/Reveal";
import { WelcomeActions } from "@/src/components/welcome/WelcomeActions";

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback_failed: "La connexion a échoué. Veuillez réessayer.",
};

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null;

  return (
    <div className="page-shell">
      <main className="relative z-10 mx-auto flex min-h-[80vh] max-w-2xl flex-col justify-center px-4 py-10 md:px-6">
        <Reveal>
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 font-black font-tech text-2xl text-slate-950 shadow-lg shadow-cyan-500/30">
              OM
            </div>
            <h1 className="font-tech text-3xl font-black tracking-tight text-white md:text-4xl">
              <span className="text-gradient">OM</span>{" "}
              <span className="text-white">ANALYTICS</span>
            </h1>
            <p className="mt-3 text-slate-400">
              Rejoins la communauté des supporters — simulation, data et Fan Zone.
            </p>
          </div>

          {errorMessage && (
            <p className="mb-4 text-center text-sm text-red-400" role="alert">
              {errorMessage}
            </p>
          )}

          <WelcomeActions />

          <p className="mt-8 text-center text-xs text-slate-600">
            En continuant, vous acceptez les conditions d&apos;utilisation de la plateforme.
          </p>
        </Reveal>
      </main>
    </div>
  );
}
