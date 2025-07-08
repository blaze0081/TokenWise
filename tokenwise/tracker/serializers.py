from rest_framework import serializers
from .models import Wallet, Transaction

# The number of decimal places for the token
TOKEN_DECIMALS = 1_000_000

class WalletSerializer(serializers.ModelSerializer):
    """Serializer for the Wallet model, including calculated token quantity and USD balance."""
    token_quantity = serializers.SerializerMethodField()
    balance_usd = serializers.SerializerMethodField()

    class Meta:
        model = Wallet
        fields = ['address', 'token_quantity', 'balance_usd', 'last_updated']

    def get_token_quantity(self, obj):
        """Convert the raw balance to a user-friendly token quantity."""
        return obj.balance / TOKEN_DECIMALS

    def get_balance_usd(self, obj):
        """Calculate the balance in USD based on the current price passed in the context."""
        token_quantity = self.get_token_quantity(obj)
        # Get the Solana price from the context, defaulting to 0 if not provided
        price = self.context.get('solana_price', 0)
        return token_quantity * price

class TransactionSerializer(serializers.ModelSerializer):
    """Standardized serializer for the Transaction model."""
    wallet_address = serializers.CharField(source='wallet.address', read_only=True)
    amount = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'signature',
            'timestamp',
            'wallet_address',
            'transaction_type',
            'amount',
            'protocol',
            'description',
        ]

    def get_amount(self, obj):
        """Convert the raw transaction amount to a user-friendly token quantity."""
        return obj.amount / TOKEN_DECIMALS


class HistoricalTransactionSerializer(serializers.ModelSerializer):
    """Serializer for the historical transaction data, ensuring consistent field names."""
    wallet_address = serializers.CharField(source='wallet.address', read_only=True)
    amount = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'signature',
            'timestamp',
            'wallet_address',
            'transaction_type',
            'amount',
            'protocol',
        ]

    def get_amount(self, obj):
        """Convert the raw transaction amount to a user-friendly token quantity."""
        return obj.amount / TOKEN_DECIMALS
