from rest_framework import serializers
from .models import Room

# this will turn a room into a json format


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        # on each model their is a primary key (a unique integer) that is
        # automatically created when you add a new model to the databas
        fields = ('id', 'code', 'host', 'guest_can_pause',
                  'votes_to_skip', 'created_at')


# To send a post request with a 'payload'
class CreateRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ('guest_can_pause', 'votes_to_skip')


class UpdateRoomSerializer(serializers.ModelSerializer):
    # This makes it so that the code field from the model will
    # not be referenced because in the model the code needs to
    # unique
    code = serializers.CharField(validators=[])

    class Meta:
        model = Room
        fields = ('guest_can_pause', 'votes_to_skip', 'code')
