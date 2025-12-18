from django.db.models import Sum
from ..models import Player, Club
import random

def simulate_transfer_window(club_id):
    """
    Algorithme de décision pour le Mercato.
    1. Analyse financière (Passage DNCG).
    2. Analyse sportive (Identifier le maillon faible).
    3. Action (Vendre ou Acheter).
    """
    om = Club.objects.get(id=club_id)
    players = om.players.all().order_by('overall_rating')
    
    logs = []

    # 1. Vérification Financière (DNCG)
    masse_salariale = players.aggregate(Sum('wage'))['wage__sum'] or 0
    deficit_budgetaire = om.budget_transfert < 0
    salarial_overflow = masse_salariale > om.plafond_salarial_dncg

    # STRATÉGIE DE VENTE (Si on est dans le rouge)
    if deficit_budgetaire or salarial_overflow:
        logs.append("⚠️ Alerte DNCG : Nécessité de vendre.")
        # On vend un joueur à forte valeur marchande mais pas le meilleur (pour ne pas tuer l'équipe)
        # On prend le top 3-6 des meilleurs joueurs
        bankable_players = players.order_by('-market_value')[2:6]
        
        if bankable_players:
            player_to_sell = random.choice(bankable_players)
            sale_price = player_to_sell.market_value * random.uniform(0.9, 1.2) # Négociation
            
            # Transaction
            om.budget_transfert += int(sale_price)
            player_to_sell.delete() # Simplification: il quitte le club
            om.save()
            
            logs.append(f"VENTE: {player_to_sell.name} vendu pour {sale_price/1000000:.1f}M€ pour équilibrer les comptes.")
            return logs # On arrête là pour aujourd'hui

    # STRATÉGIE D'ACHAT (Si on a de l'argent)
    elif om.budget_transfert > 5000000: # On a au moins 5M€
        # Identifier le poste le plus faible
        weakest_player = players.first() # Le joueur avec le rating le plus bas (grâce au order_by initial)
        
        target_rating = weakest_player.overall_rating + 5 # On veut une upgrade
        estimated_cost = target_rating * 1000000 # Formule arbitraire de prix
        
        if om.budget_transfert >= estimated_cost:
            # Simulation d'achat
            new_player = Player.objects.create(
                club=om,
                name=f"Recrue {weakest_player.position}", # Placeholder
                position=weakest_player.position,
                overall_rating=target_rating,
                market_value=estimated_cost,
                wage=weakest_player.wage * 1.5,
                form_factor=1.0
            )
            
            om.budget_transfert -= estimated_cost
            om.save()
            logs.append(f"ACHAT: Recrutement d'un {new_player.position} (Niveau {target_rating}) pour remplacer {weakest_player.name}.")
        else:
            logs.append("Scouting: Pas assez de budget pour améliorer l'équipe significativement.")
            
    else:
        logs.append("Mercato calme : Finances stables, pas de mouvement.")

    return logs