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
      <main className="relative z-10 mx-auto flex min-h-[80vh] max-w-3xl flex-col justify-center px-4 py-10 md:px-6">
        <Reveal>
          <div className="mb-10 rule-thick pt-4">
            <p className="label text-ink/50">Olympique de Marseille</p>
            <h1 className="display mt-2 text-[clamp(4rem,16vw,10rem)]">
              OM <span className="text-accent-text">Analytics</span>
            </h1>
            <p className="editorial mt-4 text-2xl text-ink/70">
              Simulation · Données · Virage.
            </p>
          </div>
        </Reveal>

        {errorMessage && (
          <p className="label mb-4 text-live-text" role="alert">
            {errorMessage}
          </p>
        )}

        <WelcomeActions />

        <p className="label mt-8 text-ink/40">
          En continuant, vous acceptez les conditions d&apos;utilisation de la plateforme.
        </p>
      </main>
    </div>
  );
}
