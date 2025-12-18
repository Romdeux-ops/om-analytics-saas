from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Club, Player, Match
from .serializers import ClubSerializer, PlayerSerializer, MatchSerializer
from .logic.simulator import MatchSimulator
from .logic.mercato import simulate_transfer_window

class ClubViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint pour récupérer les infos du club (OM) et ses finances.
    """
    queryset = Club.objects.all()
    serializer_class = ClubSerializer

    @action(detail=True, methods=['post'])
    def run_mercato(self, request, pk=None):
        """
        Déclenche l'IA du Mercato pour ce club.
        POST /api/clubs/{id}/run_mercato/
        """
        logs = simulate_transfer_window(pk)
        
        # On recharge l'objet pour renvoyer les finances mises à jour
        club = self.get_object()
        serializer = self.get_serializer(club)
        
        return Response({
            "logs": logs,
            "club_state": serializer.data
        })

class PlayerViewSet(viewsets.ModelViewSet):
    """
    Gestion des joueurs.
    """
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer

class MatchViewSet(viewsets.ModelViewSet):
    """
    Gestion des matchs et simulation.
    """
    queryset = Match.objects.all().order_by('date')
    serializer_class = MatchSerializer

    @action(detail=True, methods=['post'])
    def simulate(self, request, pk=None):
        """
        Lance la simulation minute par minute d'un match spécifique.
        POST /api/matches/{id}/simulate/
        """
        match = self.get_object()
        
        if match.played:
            return Response({"error": "Match déjà joué !"}, status=status.HTTP_400_BAD_REQUEST)

        # Instanciation du moteur de simulation
        simulator = MatchSimulator(match.home_team, match.away_team)
        result = simulator.simulate_match()

        # Sauvegarde des résultats
        match.home_score = result['final_score']['home']
        match.away_score = result['final_score']['away']
        match.match_log = result['timeline'] # Le JSON complet minute par minute
        match.played = True
        match.save()

        return Response({
            "status": "Match terminé",
            "score": f"{match.home_score} - {match.away_score}",
            "details": MatchSerializer(match).data
        })