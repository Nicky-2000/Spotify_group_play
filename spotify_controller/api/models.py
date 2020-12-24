from django.db import models
import string
import random
# Create your models here.

# make random code for a room


def generate_unique_code():
    lenght = 6
    while True:
        # will generate a random code only using upper case ascii characters
        code = ''.join(random.choices(string.ascii_uppercase, k=lenght))
        # room.objects gives me all the room objects
        if Room.objects.filter(code=code).count() == 0:
            break

    return code


class Room(models.Model):
    # In here you describe the stuff you want to store in the data base
    # you can then use python code to access the stuff

    # the arguments are the constrains on the code field.
    code = models.CharField(
        max_length=8, default=generate_unique_code, unique=True)

    # store information about the host
    host = models.CharField(max_length=50, unique=True)

    # whether or not the host can pause
    guest_can_pause = models.BooleanField(null=False, default=False)

    votes_to_skip = models.IntegerField(null=False, default=1)

    # Auto_now_add stores the time that the room was created
    created_at = models.DateTimeField(auto_now_add=True)

    # you can add methods on the models
    # in Django we want FAT models and thin views

# A session is a temp connection between two devices
# A page that you would usually have to sign into but you dont have to
# because its the same device

# I dont have to sign into facebook each time because its still in the same session

# sessions have to do with a unique key
