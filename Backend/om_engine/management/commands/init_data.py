from django.core.management.base import BaseCommand
from om_engine.models import Club, Player, Match
from django.utils import timezone
import datetime

class Command(BaseCommand):
    help = 'Initialise les données de démonstration pour le SaaS OM'

    def handle(self, *args, **kwargs):
        self.stdout.write("Suppression des anciennes données...")
        # On vide la base pour éviter les doublons à chaque relance
        Match.objects.all().delete()
        Player.objects.all().delete()
        Club.objects.all().delete()

        # --- CRÉATION DES CLUBS ---
        self.stdout.write("Création des Clubs...")
        om = Club.objects.create(
            name="Olympique de Marseille",
            budget_transfert=15000000, # 15 M€
            masse_salariale_actuelle=80000000,
            plafond_salarial_dncg=100000000,
            reputation=85
        )

        psg = Club.objects.create(
            name="Paris Saint-Germain",
            budget_transfert=200000000, # 200 M€
            masse_salariale_actuelle=300000000,
            plafond_salarial_dncg=500000000,
            reputation=90
        )

        # --- CRÉATION DES JOUEURS OM ---
        self.stdout.write("Création des Joueurs OM...")
        players_om = [
            ("Pau López", "GK", 82, 3000000),
            ("Jonathan Clauss", "DEF", 83, 3800000),
            ("Chancel Mbemba", "DEF", 84, 4500000),
            ("Leonardo Balerdi", "DEF", 81, 3500000),
            ("Quentin Merlin", "DEF", 79, 2000000),
            ("Geoffrey Kondogbia", "MID", 82, 5000000),
            ("Jordan Veretout", "MID", 82, 4200000),
            ("Valentin Rongier", "MID", 83, 4000000),
            ("Amine Harit", "MID", 80, 3000000),
            ("Pierre-Emerick Aubameyang", "FWD", 86, 8000000),
            ("Ismaïla Sarr", "FWD", 79, 3500000),
        ]

        for name, pos, rate, wage in players_om:
            Player.objects.create(
                club=om,
                name=name,
                position=pos,
                overall_rating=rate,
                market_value=rate * 500000, # Formule simplifiée pour la valeur
                wage=wage,
                form_factor=1.0
            )

        # --- CRÉATION DES JOUEURS PSG (ADVERSAIRES) ---
        self.stdout.write("Création des Joueurs PSG...")
        players_psg = [
            ("Gianluigi Donnarumma", "GK", 88, 10000000),
            ("Marquinhos", "DEF", 87, 12000000),
            ("Achraf Hakimi", "DEF", 86, 10000000),
            ("Warren Zaïre-Emery", "MID", 82, 5000000),
            ("Vitinha", "MID", 84, 7000000),
            ("Kylian Mbappé", "FWD", 94, 50000000),
            ("Ousmane Dembélé", "FWD", 86, 15000000),
        ]

        for name, pos, rate, wage in players_psg:
            Player.objects.create(
                club=psg,
                name=name,
                position=pos,
                overall_rating=rate,
                market_value=rate * 1000000,
                wage=wage
            )

        # --- CRÉATION DU MATCH ---
        self.stdout.write("Création du Match...")
        Match.objects.create(
            home_team=om,
            away_team=psg,
            date=timezone.now() + datetime.timedelta(days=1), # Match prévu demain
            played=False,
            home_score=0,
            away_score=0
        )

        self.stdout.write(self.style.SUCCESS("✅ Base de données initialisée avec succès !"))