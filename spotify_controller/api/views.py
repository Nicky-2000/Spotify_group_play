from django.shortcuts import render
from rest_framework import generics
from .serializers import RoomSerializer
from .models import Room
# Create your views here.

# api view


class RoomView(generics.ListAPIView):
    # queryset is all the stuff i want to see
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
