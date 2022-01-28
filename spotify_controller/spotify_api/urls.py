from django.urls import path
from .views import *

urlpatterns = [
    path('get-auth-url', AuthURL.as_view()),
    path('redirect', spotify_callback),
    path('is-authenticated', IsAuthenticated.as_view()),
    path('current-song', CurrentSong.as_view()),
    path('pause-song', PauseSong.as_view()),
    path('play-song', PlaySong.as_view()),
    path('current-pod', CurrentPod.as_view()),
    path('skip-song', SkipSong.as_view()),
    path('skip-to-previous-song', SkipToPreviousSong.as_view()),
    path('seek', SeekToPosition.as_view()),
    path('change-volume', UpdateVolume.as_view()),
    path('playback-state', GetPlayBackState.as_view())
]
