from rest_framework import viewsets, views
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Sum, Q, Count
from .tasks import refresh_data_task
from django.http import JsonResponse
from rest_framework import status
import requests
from django.core.cache import cache
from .models import Wallet, Transaction, SolanaMetric
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
        """Fetches the Solana price from the database."""
        try:
            # Fetch the price from the SolanaMetric model
            stats_metric = SolanaMetric.objects.get(name='solana_stats')
            price = stats_metric.data.get('price', 0)
        except SolanaMetric.DoesNotExist:
            print("Warning: Solana price not found in database. Returning 0.")
            price = 0
        except Exception as e:
            print(f"Error fetching Solana price from database: {e}")
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


class DashboardMetricsView(views.APIView):
    """API endpoint to provide aggregated metrics for the dashboard."""

    def get(self, request, *args, **kwargs):
        # Calculate Total Volume
        total_volume_agg = Transaction.objects.aggregate(total=Sum('amount'))
        total_volume = total_volume_agg['total'] or 0

        # Calculate Buy and Sell Volume
        buy_volume_agg = Transaction.objects.filter(transaction_type='BUY').aggregate(total=Sum('amount'))
        buy_volume = buy_volume_agg['total'] or 0

        sell_volume_agg = Transaction.objects.filter(transaction_type='SELL').aggregate(total=Sum('amount'))
        sell_volume = sell_volume_agg['total'] or 0

        # Calculate Net Direction
        net_direction = buy_volume - sell_volume

        # Calculate Total Transactions
        total_transactions = Transaction.objects.count()

        # Get Protocol Usage data
        protocol_usage = Transaction.objects.values('protocol').annotate(count=Count('protocol')).order_by('-count')

        data = {
            'total_volume': total_volume,
            'net_direction': net_direction,
            'total_transactions': total_transactions,
            'protocol_usage': list(protocol_usage)
        }

        return Response(data)


class SolanaStatsView(views.APIView):
    """API view to fetch cached Solana market data."""
    def get(self, request, *args, **kwargs):
        try:
            # Fetch the single metric containing all combined data
            solana_metric = SolanaMetric.objects.get(name='solana_stats')

            # The data field now contains everything the frontend needs
            return Response(solana_metric.data)
        except SolanaMetric.DoesNotExist:
            return Response(
                {"error": "Solana market data not found. Please run the refresh command."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RefreshDataView(views.APIView):
    """API endpoint to trigger the data refresh command."""

    def post(self, request, *args, **kwargs):
        try:
            # Trigger the Celery task to run in the background
            refresh_data_task.delay()

            return Response({"status": "Data refresh initiated"}, status=status.HTTP_202_ACCEPTED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
