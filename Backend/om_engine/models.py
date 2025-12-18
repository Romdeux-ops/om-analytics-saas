from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid

class Club(models.Model):
    name = models.CharField(max_length=100)
    # Finances (Critique pour le module Mercato)
    budget_transfert = models.BigIntegerField(default=0, help_text="En euros")
    masse_salariale_actuelle = models.BigIntegerField(default=0, help_text="Salaire annuel total")
    plafond_salarial_dncg = models.BigIntegerField(default=0, help_text="Limite imposée par la DNCG")
    reputation = models.IntegerField(default=50, help_text="Score 0-100 influençant l'attractivité")

    def __str__(self):
        return self.name

class Player(models.Model):
    class Position(models.TextChoices):
        GOALKEEPER = 'GK', _('Gardien')
        DEFENDER = 'DEF', _('Défenseur')
        MIDFIELDER = 'MID', _('Milieu')
        FORWARD = 'FWD', _('Attaquant')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name="players")
    name = models.CharField(max_length=100)
    position = models.CharField(max_length=3, choices=Position.choices)
    
    # Stats Sportives (Data Science Inputs)
    overall_rating = models.IntegerField(help_text="Niveau global 0-100")
    form_factor = models.FloatField(default=1.0, help_text="Multiplicateur de forme (ex: 1.1 = en feu)")
    injury_prone = models.FloatField(default=0.1, help_text="Probabilité de blessure")
    
    # Stats Économiques
    market_value = models.BigIntegerField(help_text="Valeur estimée transfert")
    wage = models.BigIntegerField(help_text="Salaire annuel")

    def __str__(self):
        return f"{self.name} ({self.overall_rating})"

class Match(models.Model):
    home_team = models.ForeignKey(Club, on_delete=models.CASCADE, related_name="home_matches")
    away_team = models.ForeignKey(Club, on_delete=models.CASCADE, related_name="away_matches")
    date = models.DateTimeField()
    played = models.BooleanField(default=False)
    
    # Résultat final
    home_score = models.IntegerField(default=0)
    away_score = models.IntegerField(default=0)
    
    # Stockage JSON pour le replay "Minute par Minute" côté frontend
    match_log = models.JSONField(default=list, blank=True)