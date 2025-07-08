from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WalletViewSet,
    TransactionViewSet,
    HistoricalTransactionViewSet,
    DashboardMetricsView,
    RefreshDataView,
    SolanaStatsView,
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'wallets', WalletViewSet, basename='wallet')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'historical-transactions', HistoricalTransactionViewSet, basename='historical-transaction')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-metrics/', DashboardMetricsView.as_view(), name='dashboard-metrics'),
    path('refresh-data/', RefreshDataView.as_view(), name='refresh-data'),
    path('solana-stats/', SolanaStatsView.as_view(), name='solana-stats'),
]
