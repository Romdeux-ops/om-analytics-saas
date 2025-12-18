import MatchLiveInterface from '../components/MatchLiveInterface';

// Fonction pour récupérer le match depuis Django
async function getMatchData() {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/matches/1/', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch match data');
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function Home() {
  const matchData = await getMatchData();

  return (
    <main className="min-h-screen py-10 px-4">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">
          OM <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#009DDC] to-[#D3A400]">ANALYTICS</span>
        </h1>
        <p className="text-gray-400">Plateforme de Simulation Sportive</p>
      </header>
      
      {matchData ? (
        <MatchLiveInterface matchData={matchData} />
      ) : (
        <div className="text-center text-white">Chargement du match... (Vérifiez que le backend tourne)</div>
      )}
    </main>
  );
}