from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Room
from django.shortcuts import render
from rest_framework import generics, status
from .serializers import RoomSerializer, CreateRoomSerializer,\
    UpdateRoomSerializer

# Create your views here.

# api view


class RoomView(generics.ListAPIView):
    # queryset is all the stuff i want to see
    queryset = Room.objects.all()
    serializer_class = RoomSerializer


class GetRoom(APIView):
    serializer_class = RoomSerializer
    lookup_url_kwarg = 'code'

    def get(self, request, format=None):
        code = request.GET.get(self.lookup_url_kwarg)
        if code is not None:
            room = Room.objects.filter(code=code)
            if len(room) > 0:
                data = RoomSerializer(room[0]).data
                # check if session key is the host if not then is_host is false
                data['is_host'] = (self.request.session.session_key ==
                                   room[0].host)
                return Response(data, status=status.HTTP_200_OK)
            return Response({'Room Not Found': "Invalid Room Code!"},
                            status=status.HTTP_404_NOT_FOUND)
        return Response({'Bad Request': 'Code parameter not found in request'},
                        status=status.HTTP_400_BAD_REQUEST)

# user wants to join room We need to see if code is valid then let them in


class JoinRoom(APIView):
    lookup_url_kwarg = 'code'

    def post(self, request, format=None):
        # make sure the user has an active session
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()
        code = request.data.get(self.lookup_url_kwarg)
        if code is not None:
            room_result = Room.objects.filter(code=code)
            if len(room_result) > 0:
                room = room_result[0]
                self.request.session['room_code'] = code
                return Response({'message': 'Room Joined :)'},
                                status=status.HTTP_200_OK)
            return Response({'Bad Request': 'Invalid Room Code'},
                            status=status.HTTP_404_NOT_FOUND)
        return Response(
            {'Bad Request': 'Invalid POST data, did not find a code key'},
            status=status.HTTP_400_BAD_REQUEST)


class CreateRoomView(APIView):
    # can define a get method, post and put method when inheriting APIView
    serializer_class = CreateRoomSerializer

    def post(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        # serializes the data
        serializer = self.serializer_class(data=request.data)
        # if data is valid
        if serializer.is_valid():
            guest_can_pause = serializer.data.get('guest_can_pause')
            votes_to_skip = serializer.data.get('votes_to_skip')
            host = self.request.session.session_key
            queryset = Room.objects.filter(host=host)
            if queryset.exists():
                room = queryset[0]
                room.guest_can_pause = guest_can_pause
                room.votes_to_skip = votes_to_skip
                self.request.session['room_code'] = room.code
                room.save(update_fields=['guest_can_pause', 'votes_to_skip'])
            else:
                room = Room(host=host, guest_can_pause=guest_can_pause,
                            votes_to_skip=votes_to_skip)
                room.save()
                self.request.session['room_code'] = room.code
            return Response(RoomSerializer(room).data,
                            status=status.HTTP_200_OK)

        return Response({'Bad Request': 'Invalid data...'},
                        status=status.HTTP_400_BAD_REQUEST)

# check if the current user is already in a room
# I previously updated the session to add the 'room_code' variable


class IsUserInRoom(APIView):
    def get(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()
        data = {
            'code': self.request.session.get('room_code')
        }
        # JsonResponse serializes a python dictionary
        return JsonResponse(data, status=status.HTTP_200_OK)


class LeaveRoom(APIView):
    # Post means updating something in the model
    # usually with post you are creating something new we could
    # use patch instead
    def post(self, request, format=None):
        if 'room_code' in self.request.session:
            # Pop removes the room_code from the session
            # (This could be assigned to a variable
            self.request.session.pop('room_code')
            # check if host is leaving the session if so delete the room
            host_id = self.request.session.session_key
            room_results = Room.objects.filter(host=host_id)
            if len(room_results) > 0:
                room = room_results[0]
                room.delete()
        return Response({"Message:" "Response"}, status=status.HTTP_200_OK)

# update a room


class UpdateRoom(APIView):
    serializer_class = UpdateRoomSerializer
    # patch is just modifying something

    def patch(self, request):
        # Make sure the user has a session
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            guest_can_pause = serializer.data.get("guest_can_pause")
            votes_to_skip = serializer.data.get("votes_to_skip")
            code = serializer.data.get("code")

            queryset = Room.objects.filter(code=code)
            if not queryset.exists():
                return Response({"Message": "Room Not Found"},
                                status=status.HTTP_404_NOT_FOUND)
            room = queryset[0]
            # make sure the user is the host of the room
            user_id = self.request.session.session_key
            if room.host != user_id:
                Response({"Bad Request": "You are not host of room"},
                         status=status.HTTP_403_FORBIDDEN)
            room.guest_can_pause = guest_can_pause
            room.votes_to_skip = votes_to_skip
            room.save(update_fields=['guest_can_pause', 'votes_to_skip'])
            return Response(RoomSerializer(room.data),
                            status=status.HTTP_200_OK)
        return Response({"Bad Request": "Invalid Data..."},
                        status=status.HTTP_400_BAD_REQUEST)
