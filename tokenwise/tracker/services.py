import traceback
import requests
import subprocess
import json
from datetime import datetime
from django.conf import settings
from solana.rpc.api import Client
from solders.pubkey import Pubkey
from pycoingecko import CoinGeckoAPI
from .models import Wallet, Transaction, SolanaMetric

class SolanaService:
    """A service for interacting with the Solana blockchain."""

    def __init__(self):
        self.client = Client(settings.SOLANA_RPC_URL, timeout=30)
        self.token_mint_address = settings.TARGET_TOKEN_MINT_ADDRESS
        try:
            self.api_key = settings.SOLANA_RPC_URL.split('api-key=')[-1]
        except IndexError:
            raise ValueError("SOLANA_RPC_URL in .env file is missing an API key.")
        self.api_base_url = "https://api.helius.xyz/v0/addresses"
        self.coingecko_client = CoinGeckoAPI()

    def get_top_token_holders(self, limit=60):
        """Fetches the top token holders for the target token."""
        try:
            mint_pubkey = Pubkey.from_string(self.token_mint_address)
            response = self.client.get_token_largest_accounts(mint_pubkey)
            
            if response and response.value:
                return response.value[:limit]
            else:
                print(f"Received unexpected response from Solana RPC: {response}")
                return []
        except Exception as e:
            print(f"An error occurred while fetching top token holders: {type(e).__name__} - {e}")
            traceback.print_exc()
            return []

    def get_wallet_transactions(self, wallet_address: str, limit: int = 100):
        """Fetches and stores recent transactions for a given wallet address from Helius."""
        print(f"Fetching transactions for wallet: {wallet_address}")
        api_url = f"{self.api_base_url}/{wallet_address}/transactions"
        params = {
            "api-key": self.api_key,
            "limit": limit,
        }
        
        try:
            # Construct the full URL with parameters
            full_url = f"{api_url}?api-key={self.api_key}&limit={limit}"
            
            print(f"--> Making request with curl to: {api_url}")
            
            # Use curl via subprocess, which is more reliable for large responses
            process = subprocess.run(
                ['curl', '-s', '-L', full_url],  # -s for silent, -L to follow redirects
                capture_output=True, 
                text=True, 
                timeout=60
            )
            
            if process.returncode != 0:
                print(f"Error calling curl: {process.stderr}")
                return

            print("--> Received response from curl")
            
            if not process.stdout:
                print("--> Curl returned empty output.")
                transactions_data = []
            else:
                try:
                    transactions_data = json.loads(process.stdout)
                except json.JSONDecodeError:
                    print("Error: Failed to decode JSON from Helius API response.")
                    print(f"Raw response snippet: {process.stdout[:500]}")
                    return

            if not transactions_data:
                print(f"No transactions found for wallet {wallet_address}.")
                return

            wallet, _ = Wallet.objects.get_or_create(address=wallet_address)
            new_tx_count = 0

            for tx_data in transactions_data:
                signature = tx_data.get("signature")
                if not signature or Transaction.objects.filter(signature=signature).exists():
                    continue

                token_transfers = [
                    t for t in tx_data.get("tokenTransfers", [])
                    if t.get("mint") == self.token_mint_address
                ]

                if not token_transfers:
                    continue

                transfer = token_transfers[0]
                tx_type = 'UNKNOWN'
                
                # Correctly identify buy/sell based on the token account address
                if transfer.get('fromTokenAccount') == wallet_address:
                    tx_type = 'SELL'
                elif transfer.get('toTokenAccount') == wallet_address:
                    tx_type = 'BUY'

                if tx_type == 'UNKNOWN':
                    continue

                # The 'tokenAmount' field holds the human-readable, decimal-adjusted amount.
                # Explicitly cast to float to handle potential string values from the API.
                try:
                    amount = float(transfer.get("tokenAmount", 0))
                except (ValueError, TypeError):
                    amount = 0.0

                # If amount is zero, log the entire transaction for debugging and skip.
                if amount == 0.0:
                    print(f"[WARN] Skipping transaction {signature} due to zero amount. Full data:")
                    print(json.dumps(tx_data, indent=2))
                    continue
                
                # Robust protocol extraction
                protocol = tx_data.get("source", "UNKNOWN") # Default to top-level source
                events = tx_data.get("events", {})
                if events and "swap" in events:
                    # Use the more specific protocol from the swap event if available
                    program_info = events["swap"].get("programInfo", {})
                    protocol = program_info.get("source", protocol)

                Transaction.objects.create(
                    signature=signature,
                    wallet=wallet,
                    timestamp=datetime.fromtimestamp(tx_data["timestamp"]),
                    description=tx_data.get("description", ""),
                    transaction_type=tx_type,
                    amount=amount,
                    protocol=protocol,
                )
                new_tx_count += 1
            
            print(f"Successfully saved {new_tx_count} new transactions for wallet {wallet_address}.")

        except requests.exceptions.RequestException as e:
            print(f"HTTP Error fetching transactions for {wallet_address}: {e}")
        except Exception as e:
            print(f"An error occurred while processing transactions for {wallet_address}: {type(e).__name__} - {e}")
            traceback.print_exc()

    def get_solana_market_data(self):
        """Fetches Solana market data from CoinGecko and stores it in the database."""
        print("Fetching Solana market data from CoinGecko...")
        try:
            # Fetch market stats
            coin_data = self.coingecko_client.get_coin_by_id(
                id='solana',
                localization=False,
                tickers=False,
                market_data=True,
                community_data=False,
                developer_data=False,
                sparkline=False
            )

            # Fetch 7-day market chart data
            market_chart = self.coingecko_client.get_coin_market_chart_by_id(id='solana', vs_currency='usd', days=7)

            # Combine all data into a single structure
            combined_data = {
                'price': coin_data['market_data']['current_price'].get('usd', 0),
                'price_change_percentage_24h': coin_data['market_data'].get('price_change_percentage_24h', 0),
                'market_cap': coin_data['market_data']['market_cap'].get('usd', 0),
                'total_volume': coin_data['market_data']['total_volume'].get('usd', 0),
                'circulating_supply': coin_data['market_data'].get('circulating_supply', 0),
                'total_supply': coin_data['market_data'].get('total_supply', 0),
                'chart_data': market_chart.get('prices', [])
            }

            # Store everything in a single database entry
            SolanaMetric.objects.update_or_create(
                name='solana_stats',
                defaults={'data': combined_data}
            )
            print("Successfully fetched and stored combined Solana market data.")

        except Exception as e:
            print(f"An error occurred while fetching CoinGecko data: {e}")
            traceback.print_exc()
