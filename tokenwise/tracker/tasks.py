from celery import shared_task
from django.core.management import call_command


@shared_task
def discover_wallets_task():
    """
    A Celery task to discover and update wallets.
    """
    call_command('discover_wallets')

@shared_task
def discover_transactions_task():
    """
    A Celery task to discover and store recent transactions for all tracked wallets.
    """
    call_command('discover_transactions')


@shared_task
def refresh_data_task():
    """
    A Celery task to run the full data refresh process.
    This includes discovering wallets and their transactions.
    """
    print("Executing refresh_data_task...")
    call_command('refresh_data')
    print("refresh_data_task finished.")
