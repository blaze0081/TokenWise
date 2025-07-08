import { Suspense } from 'react';
import WalletMonitoring from './WalletMonitoring';

export default function MonitoringPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WalletMonitoring />
    </Suspense>
  );
}
