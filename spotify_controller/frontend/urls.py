from django.urls import path
from .views import index

# this variable makes the redirect function used in
# spotify_api.views works

app_name = 'frontend'
urlpatterns = [

    path('', index, name=''),  # name is needed for the redirect function
    path('join', index),
    path('create', index),
    path('room/<str:roomCode>', index)
]
