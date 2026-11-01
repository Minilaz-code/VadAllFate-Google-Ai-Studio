// Isolated original-content test harness, not a gameplay entry/activation path.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {CampaignManager} from '../src/components/content/CampaignManager.tsx';
createRoot(document.getElementById('root')!).render(<main>
  <h1>Isolated prepared fixture inspection</h1>
  <CampaignManager onRefresh={async()=>undefined}/>
</main>);
