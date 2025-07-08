from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination
import requests
from django.core.cache import cache
from .models import Wallet, Transaction
from .serializers import WalletSerializer, TransactionSerializer, HistoricalTransactionSerializer


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class WalletViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows wallets to be viewed, ordered by balance.
    Supports pagination and includes USD balance.
    Can be looked up by wallet address.
    """
    queryset = Wallet.objects.all().order_by('-balance')
    serializer_class = WalletSerializer
    lookup_field = 'address'
    pagination_class = StandardResultsSetPagination

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['solana_price'] = self._get_solana_price()
        return context

    def _get_solana_price(self):
        price = cache.get('solana_price')
        if price is None:
            try:
                url = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
                response = requests.get(url, timeout=5)
                response.raise_for_status()
                price = response.json().get('solana', {}).get('usd', 0)
                cache.set('solana_price', price, timeout=60)  # Cache for 60 seconds
            except requests.exceptions.RequestException as e:
                print(f"Error fetching Solana price: {e}")
                price = 0
        return price


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows transactions to be viewed, ordered by timestamp.
    Can be filtered by wallet address using the `?wallet=` query parameter.
    """
    serializer_class = TransactionSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """
        Optionally restricts the returned transactions to a given wallet.
        Returns all transactions if no wallet is specified.
        """
        queryset = Transaction.objects.all().order_by('-timestamp')

        # Filter by wallet address if the 'wallet' query parameter is provided
        wallet_address = self.request.query_params.get('wallet')
        if wallet_address:
            queryset = queryset.filter(wallet__address=wallet_address)

        return queryset


class HistoricalTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for historical transaction data with date filtering."""
    serializer_class = HistoricalTransactionSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """Filter transactions by a given date range."""
        queryset = Transaction.objects.all().order_by('-timestamp')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            # Add 1 day to the end_date to make it inclusive
            from datetime import datetime, timedelta
            end_date_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
            queryset = queryset.filter(timestamp__lt=end_date_dt)
            
        return queryset
