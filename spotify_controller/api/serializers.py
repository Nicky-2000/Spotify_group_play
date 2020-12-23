from rest_framework import serializers
from .models import Room

# this will turn a room into a json format


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        # on each model their is a primary key (a unique integer) that is automatically created when you add a new model to the database
        fields = ('id', 'code', 'host', 'guest_can_pause',
                  'votes_to_skip', 'created_at')
