import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {clientManager} from './runtime/adapter.ts';
import './index.css';

// Live is fail-closed at first render; demo requires an explicit user choice.
clientManager.switchClient(new URLSearchParams(window.location.search).get('demo') === '1');
createRoot(document.getElementById('root')!).render(<App />);
