from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # On connecte les routes de notre application om_engine
    path('api/', include('om_engine.urls')),
]