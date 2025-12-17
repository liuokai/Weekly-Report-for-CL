import React from 'react';
import ReactDOM from 'react-dom/client';
import WeeklyReport from './weekly-report';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <WeeklyReport />
  </React.StrictMode>
);