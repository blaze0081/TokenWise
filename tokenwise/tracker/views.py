from rest_framework import viewsets
from .models import Wallet
from .serializers import WalletSerializer


class WalletViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows wallets to be viewed.
    """
    queryset = Wallet.objects.all().order_by('-balance')
    serializer_class = WalletSerializer
