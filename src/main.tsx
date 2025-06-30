import 'web-animations-js';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';          // ⬅ value import added
import { Provider } from 'react-redux';
import { store } from './app/store';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';   // Tailwind directives live here


createRoot(document.getElementById('root')!).render(
  //<StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
 // </StrictMode>,
);

