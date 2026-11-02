import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {clientManager} from './runtime/adapter.ts';
import './index.css';
import {StorageAlignmentPlay} from './components/play/StorageAlignmentPlay.tsx';

// Live is fail-closed at first render; demo requires an explicit user choice.
clientManager.switchClient(new URLSearchParams(window.location.search).get('demo') === '1');
createRoot(document.getElementById('root')!).render(new URLSearchParams(window.location.search).get('storageAlign')==='1'?<StorageAlignmentPlay/>:<App />);
