import type { MatchEvent } from "./schema";

export interface TeamInput {
  name: string;
  strength: number;
}

function randomNormal(mean = 0, stdDev = 1): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

export function calculateTeamStrength(
  players: { overallRating: number; formFactor: number }[],
): number {
  if (players.length === 0) return 50;
  const ratings = players.map((p) => p.overallRating * p.formFactor);
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
}

export class MatchSimulator {
  private score = { home: 0, away: 0 };
  private events: MatchEvent[] = [];

  constructor(
    private homeTeam: TeamInput,
    private awayTeam: TeamInput,
  ) {}

  simulateMatch(): { final_score: { home: number; away: number }; timeline: MatchEvent[] } {
    for (let minute = 1; minute <= 90; minute++) {
      this.simulateMinute(minute);
    }
    return {
      final_score: { ...this.score },
      timeline: this.events,
    };
  }

  private simulateMinute(minute: number): void {
    const diff = this.homeTeam.strength - this.awayTeam.strength;
    const noise = randomNormal(0, 10);
    const momentum = diff + noise;

    let eventType: string | null = null;
    let description = "";

    if (momentum > 25) {
      if (Math.random() < 0.08) {
        this.score.home += 1;
        eventType = "GOAL_HOME";
        description = `But pour ${this.homeTeam.name} !`;
      } else if (Math.random() < 0.15) {
        eventType = "CHANCE_HOME";
        description = `Grosse occasion pour ${this.homeTeam.name} !`;
      }
    } else if (momentum < -25) {
      if (Math.random() < 0.08) {
        this.score.away += 1;
        eventType = "GOAL_AWAY";
        description = `But pour ${this.awayTeam.name} !`;
      } else if (Math.random() < 0.15) {
        eventType = "CHANCE_AWAY";
        description = `Tir dangereux de ${this.awayTeam.name}.`;
      }
    } else if (Math.random() < 0.02) {
      eventType = "YELLOW_CARD";
      description = "Jeu rugueux, l'arbitre sort le carton.";
    }

    if (eventType) {
      this.events.push({
        minute,
        type: eventType,
        description,
        current_score: { ...this.score },
      });
    }
  }
}
