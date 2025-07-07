from django.core.management.base import BaseCommand
from tracker.models import Wallet
from tracker.services import SolanaService

class Command(BaseCommand):
    help = 'Discovers and stores recent transactions for all tracked wallets.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting transaction discovery...'))
        service = SolanaService()
        wallets = Wallet.objects.all()

        if not wallets.exists():
            self.stdout.write(self.style.WARNING('No wallets found in the database. Run discover_wallets first.'))
            return

        for wallet in wallets:
            try:
                service.get_wallet_transactions(wallet.address)
            except Exception as e:
                self.stderr.write(self.style.ERROR(f'Failed to fetch transactions for {wallet.address}: {e}'))
        
        self.stdout.write(self.style.SUCCESS('Transaction discovery complete.'))
