
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Select from './pages/Select';
import Run from './pages/Run';
import Arrived from './pages/Arrived';
import Search from './pages/Search';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen font-sans text-gray-900 bg-gray-50 flex flex-col">
        <Routes>
          <Route path="/" element={<Navigate to="/ar-nav" replace />} />
          <Route path="/ar-nav" element={<Home />} />
          <Route path="/ar-nav/select" element={<Select />} />
          <Route path="/ar-nav/search" element={<Search />} />
          <Route path="/ar-nav/run" element={<Run />} />
          <Route path="/ar-nav/arrived" element={<Arrived />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
