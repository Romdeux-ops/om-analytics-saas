// On définit l'adresse du backend
const API_BASE_URL = "http://127.0.0.1:8000/api";

export async function simulateMatch(matchId: number) {
  try {
    // On envoie une requête POST pour déclencher le calcul Python
    const res = await fetch(`${API_BASE_URL}/matches/${matchId}/simulate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error("Erreur lors de la simulation");
    }

    // On reçoit le match complet avec le score final et les logs
    return await res.json();
  } catch (error) {
    console.error("Simulation Error:", error);
    return null;
  }
}