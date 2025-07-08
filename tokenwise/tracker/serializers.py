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
    """Serializer for the Transaction model."""
    id = serializers.CharField(source='signature', read_only=True)
    wallet_address = serializers.CharField(source='wallet.address', read_only=True)
    # The 'amount' field in the API response.
    api_amount = serializers.SerializerMethodField(method_name='get_token_amount')
    # The raw 'amount' field from the model, not exposed in the API.
    model_amount = serializers.IntegerField(source='amount', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id',
            'signature',
            'timestamp',
            'wallet_address',
            'transaction_type',
            'api_amount', # Expose the calculated amount
            'protocol',
            'description',
            'model_amount', # Temporarily include for calculation
        ]

    def get_token_amount(self, obj):
        """Convert the raw transaction amount to a user-friendly token quantity."""
        return obj.amount / TOKEN_DECIMALS

    def to_representation(self, instance):
        """Modify the final output to rename 'api_amount' to 'amount'."""
        ret = super().to_representation(instance)
        ret['amount'] = ret.pop('api_amount') # Rename field for the frontend
        del ret['model_amount'] # Remove the raw amount field
        # The frontend expects 'source' for protocol, not 'protocol'
        ret['source'] = ret.pop('protocol')
        # The frontend expects 'wallet' for wallet_address
        ret['wallet'] = ret.pop('wallet_address')
        return ret
