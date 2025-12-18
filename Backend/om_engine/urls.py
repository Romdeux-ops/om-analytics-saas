from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClubViewSet, PlayerViewSet, MatchViewSet

router = DefaultRouter()
router.register(r'clubs', ClubViewSet)
router.register(r'players', PlayerViewSet)
router.register(r'matches', MatchViewSet)

urlpatterns = [
    path('', include(router.urls)),
]