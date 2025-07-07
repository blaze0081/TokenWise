from django.core.management.base import BaseCommand
from tracker.services import SolanaService
from tracker.models import Wallet

class Command(BaseCommand):
    help = 'Discovers and stores the top 60 token holders for the target token.'

    def handle(self, *args, **options):
        self.stdout.write('Starting wallet discovery...')
        
        self.stdout.write('Initializing SolanaService...')
        service = SolanaService()
        
        self.stdout.write('Fetching top token holders...')
        top_holders = service.get_top_token_holders()

        if not top_holders:
            self.stdout.write(self.style.WARNING('Could not retrieve token holders. The service may have returned an empty list or an error occurred.'))
            return

        self.stdout.write(f'Found {len(top_holders)} token holders. Processing...')
        wallets_updated = 0
        wallets_created = 0

        for i, holder in enumerate(top_holders):
            wallet_address = str(holder.address)
            # The holder.amount is a UiTokenAmount object; its integer value is in the .amount attribute.
            balance = int(holder.amount.amount)
            
            self.stdout.write(f'Processing holder {i+1}/{len(top_holders)}: {wallet_address}', ending='... ')
            
            _, created = Wallet.objects.update_or_create(
                address=wallet_address,
                defaults={'balance': balance}
            )

            if created:
                wallets_created += 1
                self.stdout.write(self.style.SUCCESS('CREATED'))
            else:
                wallets_updated += 1
                self.stdout.write(self.style.NOTICE('UPDATED'))
        
        self.stdout.write(self.style.SUCCESS(
            f'Successfully completed wallet discovery. '
            f'{wallets_created} new wallets added, {wallets_updated} existing wallets updated.'
        ))
