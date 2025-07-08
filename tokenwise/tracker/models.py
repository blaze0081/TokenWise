from django.db import models

class Wallet(models.Model):
    """Represents a Solana wallet being tracked."""
    address = models.CharField(max_length=44, unique=True, primary_key=True)
    balance = models.BigIntegerField(help_text="The token balance in the smallest unit (e.g., lamports)")
    first_seen = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.address

class SolanaMetric(models.Model):
    """A simple key-value store for storing metrics like Solana price or chart data."""
    name = models.CharField(max_length=50, primary_key=True)
    data = models.JSONField()
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Transaction(models.Model):
    """Represents a transaction involving a tracked wallet and the target token."""
    TRANSACTION_TYPE_CHOICES = [
        ('BUY', 'Buy'),
        ('SELL', 'Sell'),
        ('TRANSFER', 'Transfer'),
        ('UNKNOWN', 'Unknown'),
    ]

    signature = models.CharField(max_length=88, unique=True, primary_key=True)
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    timestamp = models.DateTimeField()
    description = models.TextField(blank=True, null=True)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPE_CHOICES, default='UNKNOWN')
    amount = models.BigIntegerField(help_text="The amount of the target token transferred", default=0)
    protocol = models.CharField(max_length=50, blank=True, null=True, help_text="Protocol used for the swap (e.g., JUPITER)")

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.wallet.address} - {self.transaction_type} - {self.signature}"
