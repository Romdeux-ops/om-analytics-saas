import random
import numpy as np

class MatchSimulator:
    def __init__(self, home_team, away_team):
        self.home_team = home_team
        self.away_team = away_team
        self.current_minute = 0
        self.score = {"home": 0, "away": 0}
        self.events = [] # Log des événements pour le frontend
        
        # Calcul de la puissance d'équipe (Moyenne pondérée des joueurs)
        # Dans un vrai scénario, on récupérerait le QuerySet des joueurs
        self.home_strength = self._calculate_team_strength(home_team)
        self.away_strength = self._calculate_team_strength(away_team)

    def _calculate_team_strength(self, team):
        # Simplification: Moyenne du overall_rating des joueurs
        players = team.players.all()
        if not players: return 50 # Valeur par défaut
        ratings = [p.overall_rating * p.form_factor for p in players]
        return np.mean(ratings)

    def simulate_match(self):
        """Simule 90 minutes complètes."""
        for minute in range(1, 91):
            self.simulate_minute(minute)
        return {
            "final_score": self.score,
            "timeline": self.events
        }

    def simulate_minute(self, minute):
        """Logique Core: Détermine ce qui se passe à cette minute précise."""
        
        # Facteur Momentum : Différence de niveau + Aléatoire (Variance)
        # Si diff > 0, avantage Home. Si diff < 0, avantage Away.
        diff = self.home_strength - self.away_strength
        # On ajoute du bruit (la "glorieuse incertitude du sport")
        noise = np.random.normal(0, 10) 
        momentum = diff + noise

        event_type = None
        description = ""

        # Seuils de probabilité basés sur le momentum
        if momentum > 25: # Domination Home forte à cette minute
            if random.random() < 0.08: # 8% de chance de but si domination
                self.score["home"] += 1
                event_type = "GOAL_HOME"
                description = f"But pour {self.home_team.name} !"
            elif random.random() < 0.15:
                event_type = "CHANCE_HOME"
                description = f"Grosse occasion pour {self.home_team.name} !"
        
        elif momentum < -25: # Domination Away forte
            if random.random() < 0.08:
                self.score["away"] += 1
                event_type = "GOAL_AWAY"
                description = f"But pour {self.away_team.name} !"
            elif random.random() < 0.15:
                event_type = "CHANCE_AWAY"
                description = f"Tir dangereux de {self.away_team.name}."

        else: # Bataille au milieu de terrain
            if random.random() < 0.02: # Carton jaune aléatoire
                event_type = "YELLOW_CARD"
                description = "Jeu rugueux, l'arbitre sort le carton."

        # Enregistrement de l'événement s'il y en a un
        if event_type:
            self.events.append({
                "minute": minute,
                "type": event_type,
                "description": description,
                "current_score": self.score.copy()
            })