from .models import SpotifyToken
from django.utils import timezone
from datetime import timedelta
from .credentials import CLIENT_ID, CLIENT_SECRET
from requests import post, put, get

BASE_URL = "http://api.spotify.com/v1/me/"


def get_user_tokens(session_id):
    user_tokens = SpotifyToken.objects.filter(user=session_id)
    if user_tokens.exists():
        return user_tokens[0]
    else:
        return None


# save the spotify token in a new model or update a new model
# with the new spotify tokens
def update_or_create_user_tokens(session_id, access_token,
                                 token_type, expires_in, refresh_token):
    tokens = get_user_tokens(session_id)
    # change the expires in into a time stamp
    # expires in is just a number of seconds
    expires_in = timezone.now() + timedelta(seconds=expires_in)

    if tokens:
        tokens.access_token = access_token
        tokens.refresh_token = refresh_token
        tokens.expires_in = expires_in
        tokens.token_type = token_type
        tokens.save(update_fields=['access_token',
                                   'refresh_token',
                                   'token_type', 'expires_in'])
    else:
        tokens = SpotifyToken(user=session_id, access_token=access_token,
                              refresh_token=refresh_token,
                              token_type=token_type, expires_in=expires_in)
        tokens.save()


# tell us if the user is already authenticated

def is_spotify_authenticated(session_id):
    tokens = get_user_tokens(session_id)
    if tokens:
        expiry = tokens.expires_in
        if expiry <= timezone.now():
            # refresh token if the expiry has passed
            refresh_spotify_token(session_id)
        return True

    return False


def refresh_spotify_token(session_id):
    refresh_token = get_user_tokens(session_id)
    response = post('https://accounts.spotify.com/api/token', data={
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }).json()
    access_token = response.get('access_token')
    token_type = response.get('token_type')
    expires_in = response.get('expires_in')
    refresh_token = response.get('refresh_token')

    update_or_create_user_tokens(
        session_id, access_token, token_type, expires_in, refresh_token)


# session_id = host session id in this case
def execute_spotify_api_request(session_id, endpoint, method='GET'):
    if method not in ['POST', 'PUT', 'GET']:
        return {'Error': f'{method} is not a valid method'}
    tokens = get_user_tokens(session_id)
    headers = {'Content-Type': 'application/json',
               'Authorization': "Bearer " + tokens.access_token}
    if method == 'POST':
        post(BASE_URL + endpoint, headers=headers)
    if 'PUT':
        put(BASE_URL, endpoint, headers=headers)
    if method == 'GET':
        response = get(BASE_URL + endpoint, {}, headers=headers)
        try:
            print("here")
            return response.json()
        except:
            return {'Error': 'Issue with requst'}
