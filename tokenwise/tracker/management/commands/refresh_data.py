from django.core.management.base import BaseCommand
from tracker.services import SolanaService
from tracker.models import Wallet

class Command(BaseCommand):
    help = 'Refreshes the database by discovering top wallets and their transactions.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting full data refresh process...'))
        service = SolanaService()

        # --- Step 1: Fetch and store Solana market data ---
        self.stdout.write(self.style.HTTP_INFO('Step 1: Fetching Solana market data...'))
        service.get_solana_market_data()
        self.stdout.write(self.style.SUCCESS('--> Successfully updated Solana market data.'))

        # --- Step 2: Discover and update top wallets ---
        self.stdout.write(self.style.HTTP_INFO('Step 2: Discovering top wallets...'))
        top_holders = service.get_top_token_holders()

        if not top_holders:
            self.stdout.write(self.style.WARNING('Could not retrieve token holders. Aborting refresh.'))
            return

        wallets_updated = 0
        wallets_created = 0
        for holder in top_holders:
            wallet_address = str(holder.address)
            balance = int(holder.amount.amount)
            
            _, created = Wallet.objects.update_or_create(
                address=wallet_address,
                defaults={'balance': balance}
            )
            if created:
                wallets_created += 1
            else:
                wallets_updated += 1
        
        self.stdout.write(self.style.SUCCESS(
            f'Wallet discovery complete. Created: {wallets_created}, Updated: {wallets_updated}.'
        ))

        # --- Step 2: Discover transactions for all tracked wallets ---
        self.stdout.write(self.style.HTTP_INFO('\nStep 2: Discovering transactions for all tracked wallets...'))
        wallets = Wallet.objects.all()

        if not wallets.exists():
            self.stdout.write(self.style.WARNING('No wallets found in the database. Cannot fetch transactions.'))
            return

        total_wallets = wallets.count()
        for i, wallet in enumerate(wallets):
            self.stdout.write(f'Processing wallet {i+1}/{total_wallets}: {wallet.address}')
            try:
                # This service method fetches and saves transactions internally
                service.get_wallet_transactions(wallet.address)
            except Exception as e:
                self.stderr.write(self.style.ERROR(f'Failed to fetch transactions for {wallet.address}: {e}'))
        
        self.stdout.write(self.style.SUCCESS('\nTransaction discovery complete.'))
        self.stdout.write(self.style.SUCCESS('Full data refresh completed successfully.'))
