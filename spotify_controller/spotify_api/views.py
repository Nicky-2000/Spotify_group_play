from django.shortcuts import render, redirect
from rest_framework.views import APIView
from .credentials import REDIRECT_URI, CLIENT_SECRET, CLIENT_ID

from rest_framework import status
from rest_framework.response import Response
from requests import Request, post

from .util import *
from api.models import Room
from .models import Vote, Vote_back
# Create your views here.

# view that can request authorizastion to access data (step 1)


class AuthURL(APIView):
    def get(self, request, format=None):
        scopes = 'user-modify-playback-state user-read-playback-state user-read-currently-playing'

        url = Request('GET', "https://accounts.spotify.com/authorize", params={
            'scope': scopes,
            'response_type': 'code',  # we will get a code back that will help authenticate the user
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID
        }).prepare().url
        return Response({"url": url}, status=status.HTTP_200_OK)
        # this returns the URL which will be hit in the frontend


def spotify_callback(request, format=None):
    code = request.GET.get('code')
    error = request.GET.get('error')

    # post function automatically sends the request
    response = post('https://accounts.spotify.com/api/token', data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    refresh_token = response.get('refresh_token')
    expires_in = response.get('expires_in')
    error = response.get('error')

    if not request.session.exists(request.session.session_key):
        request.session.create()

    update_or_create_user_tokens(request.session.session_key, access_token,
                                 token_type, expires_in, refresh_token)
    # 'frontend:room' will redirect me to room page
    return redirect('frontend:')


class IsAuthenticated(APIView):
    def get(self, request, format=None):
        is_authenticated = is_spotify_authenticated(
            self.request.session.session_key)

        return Response({'status': is_authenticated}, status=status.HTTP_200_OK)


class CurrentSong(APIView):
    def update_room_song(self, room, song_id):
        current_song = room.current_song

        if current_song != song_id:
            room.current_song = song_id
            room.save(update_fields=['current_song'])
            #delete all the vote objects tied to the room
            votes = Vote.objects.filter(room=room)
            votes_back = Vote_back.objects.filter(room=room)
            votes.delete()
            votes_back.delete()

    def get(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)
        if room.exists():
            room = room[0]
        else:
            return Response({}, status=status.HTTP_404_NOT_FOUND)
        host = room.host
        # currently playing endpoint
        endpoint = "player/currently-playing"
        # send get request
        response = execute_spotify_api_request(host, endpoint, 'GET')
        if 'error' in response or 'item' not in response:
            # this is if there is no song currently playing song
            print('no content')
            return Response({}, status=status.HTTP_204_NO_CONTENT)
            
        item = response.get('item')
        duration = item.get('duration_ms')
        progress = response.get('progress_ms')
        album_cover = item.get('album').get('images')[0].get('url')
        is_playing = response.get('is_playing')
        song_id = item.get('id')

        #handle if there are multiple artists for a song
        artist_string =""
        for i, artist in enumerate(item.get('artists')):
            if i > 0:
                artist_string += ", "
            name = artist.get('name')
            artist_string += name

        # get the list of votes number of votes to skip
        votes = Vote.objects.filter(room=room, song_id=song_id)
        votes_back = Vote_back.objects.filter(room=room, song_id=song_id)
        song = {
            'title': item.get('name'),
            'artist': artist_string,
            'duration': duration, 
            'time': progress,
            'image_url': album_cover,
            'is_playing': is_playing,
            'votes': len(votes),
            'votes_back': len(votes_back),
            'votes_required': room.votes_to_skip,
            'id': song_id
        }
        self.update_room_song(room, song_id);
        return Response(song, status=status.HTTP_200_OK)

class PauseSong(APIView):
    # put requests update the information (update the is_playing memeber)
    def put(self, response, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        if self.request.session.session_key == room.host or room.guest_can_pause:
            toggle_play_pause_song(room.host, play=False)
            return Response({}, status=status.HTTP_204_NO_CONTENT)
        
        return Response({}, status=status.HTTP_403_FORBIDDEN)


class PlaySong(APIView):
    # put requests update the information (update the is_playing memeber)
    def put(self, response, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        if self.request.session.session_key == room.host or room.guest_can_pause:
            toggle_play_pause_song(room.host, play=True)
            return Response({}, status=status.HTTP_204_NO_CONTENT)
        
        return Response({}, status=status.HTTP_403_FORBIDDEN)


# gave up on trying to access podcasts
class CurrentPod(APIView):
    def get(self, request, format=None):
        
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)
        if room.exists():
            room = room[0]
        else:
            return Response({}, status=status.HTTP_404_NOT_FOUND)
        host = room.host
        endpoint = "player/currently-playing"
        # send get request
        response = execute_spotify_api_request(host, endpoint, 'GET')

        return Response(response, status=status.HTTP_200_OK)

class SkipSong(APIView):
    def post(self, request, format=None):
        voted_before = Vote.objects.filter(user=self.request.session.session_key)
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        if voted_before.exists():
            if room.current_song != voted_before[0].song_id:
                voted_before.delete()
            else:
                return Response({}, status.HTTP_405_METHOD_NOT_ALLOWED)

        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        # votes is a list of votes where the room=room and the same song wants to be skipped
        votes = Vote.objects.filter(room=room, song_id=room.current_song)
        votes_needed = room.votes_to_skip
        if self.request.session.session_key == room.host or len(votes) + 1  >= votes_needed:
            votes.delete()
            print("YES TO HOST")
            skip_song(room.host)
        else:
            vote = Vote(user=self.request.session.session_key,
                        room=room, song_id=room.current_song)
            vote.save()
        return Response({}, status.HTTP_200_OK)

class SkipToPreviousSong(APIView):
    def post(self, request, format=None):
        voted_before = Vote_back.objects.filter(user=self.request.session.session_key)
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        if voted_before.exists():
            if room.current_song != voted_before[0].song_id:
                voted_before.delete()
            else:
                return Response({}, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        votes = Vote_back.objects.filter(room=room, song_id=room.current_song)
        votes_needed = room.votes_to_skip
        if self.request.session.session_key == room.host or len(votes) + 1 >= votes_needed:
            skip_song(room.host, back=True)
            return Response({}, status.HTTP_200_OK)
        else:
            vote_back = Vote_back(user=self.request.session.session_key,
                        room=room, song_id=room.current_song)
            vote_back.save()
            return Response({}, status.HTTP_200_OK)

class SeekToPosition(APIView):
    # def put(self, request, format=None):
    #     room_code = self.request.session.get('room_code')
    #     room = Room.objects.filter(code=room_code)[0]
    #     if self.request.session.session_key == room.host:
    #         seek_to_position()
    def put(self, request, format=None):
        miliseconds = request.GET.get('miliseconds')
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)
        if room.exists():
            room = room[0]
        else:
            return Response({}, status=status.HTTP_404_NOT_FOUND)
        host = room.host

        response = seek_in_song(host, miliseconds)
        
        return Response(response, status.HTTP_200_OK)
    
class UpdateVolume(APIView):
    def put(self, request, format=None):
        new_volume = request.GET.get('volume')
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)
        if room.exists():
            room = room[0]
        else:
            return Response({}, status=status.HTTP_404_NOT_FOUND)
        host = room.host

        response = update_volume(host, new_volume)
        
        return Response(response, status.HTTP_200_OK)

# this only returns current_volume right now...
class GetPlayBackState(APIView):
    def get(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)
        if room.exists():
            room = room[0]
        else:
            return Response({}, status=status.HTTP_404_NOT_FOUND)
        host = room.host
        
        endpoint = "player"
        # send get request
        response = execute_spotify_api_request(host, endpoint, 'GET')
        
        # get the info from json response
        device = response.get('device')
        playback_state = {
            'current_volume' : device.get('volume_percent')
        }
        print(playback_state)
        return Response(playback_state, status=status.HTTP_200_OK)
