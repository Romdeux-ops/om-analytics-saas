from rest_framework import serializers
from .models import Club, Player, Match

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = '__all__'

class ClubSerializer(serializers.ModelSerializer):
    # On imbrique les joueurs pour avoir la composition de l'équipe en un seul appel
    players = PlayerSerializer(many=True, read_only=True)

    class Meta:
        model = Club
        fields = '__all__'

class MatchSerializer(serializers.ModelSerializer):
    home_team_name = serializers.CharField(source='home_team.name', read_only=True)
    away_team_name = serializers.CharField(source='away_team.name', read_only=True)

    class Meta:
        model = Match
        fields = '__all__'