
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { MOCK_DESTINATIONS } from '../constants';
import { Destination } from '../types';

const Select: React.FC = () => {
  const location = useLocation();
  const [destinations, setDestinations] = useState<Destination[]>(MOCK_DESTINATIONS);

  // Simple logic to "add" a new destination if passed from search page
  useEffect(() => {
    const state = location.state as { newDest?: Destination };
    if (state?.newDest) {
      setDestinations(prev => {
        // Avoid duplicates in the session
        if (prev.find(d => d.id === state.newDest?.id)) return prev;
        return [state.newDest, ...prev];
      });
    }
  }, [location.state]);

  return (
    <Layout>
      <div className="flex flex-col h-full">
        <header className="py-4 border-b mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-gray-800">목적지 선택</h2>
            <p className="text-sm text-gray-500">이동하고 싶은 위치를 선택하세요</p>
          </div>
          <Link 
            to="/ar-nav/search"
            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100"
            title="새 목적지 검색"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto pb-6">
          {destinations.map((dest) => (
            <div 
              key={dest.id} 
              className="p-5 border border-gray-100 rounded-2xl bg-gray-50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-800">{dest.name}</h3>
                <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                  {dest.distance}m
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{dest.description}</p>
              <Link 
                to="/ar-nav/run" 
                className="inline-flex items-center justify-center w-full py-3 bg-white border border-blue-600 text-blue-600 font-bold rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors"
              >
                선택
              </Link>
            </div>
          ))}
        </div>

        <footer className="mt-auto py-4">
          <Link to="/ar-nav" className="text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            이전으로
          </Link>
        </footer>
      </div>
    </Layout>
  );
};

export default Select;
