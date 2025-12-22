
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { NavStatus } from '../types';

const Run: React.FC = () => {
  const navigate = useNavigate();
  const [distance, setDistance] = useState(120);
  const [status, setStatus] = useState<NavStatus>('맞는 중');
  const [arrowRotation, setArrowRotation] = useState(0);

  // Simple simulation of navigation updates
  useEffect(() => {
    const interval = setInterval(() => {
      setArrowRotation((prev) => (prev + (Math.random() - 0.5) * 10) % 360);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout fullBleed>
      <div className="relative flex-1 bg-black flex flex-col overflow-hidden">
        
        {/* Camera Area Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-600 text-center opacity-40">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm font-mono tracking-widest">[ CAMERA PREVIEW AREA ]</p>
          </div>
        </div>

        {/* HUD Top Bar */}
        <div className="relative z-10 w-full p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center justify-between text-white">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/60">남은 거리</p>
              <p className="text-2xl font-black">{distance}m</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-white/60">상태</p>
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                status === '맞는 중' ? 'bg-green-500/80' : 
                status === '틀림' ? 'bg-red-500/80' : 'bg-blue-500/80'
              }`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        {/* AR Navigation Arrow - Floating in center */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div 
            className="transition-transform duration-500 ease-out"
            style={{ transform: `rotate(${arrowRotation}deg)` }}
          >
            {/* SVG Navigation Arrow */}
            <div className="relative flex flex-col items-center">
              <svg 
                viewBox="0 0 100 100" 
                className="w-32 h-32 text-blue-500 filter drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                fill="currentColor"
              >
                <path d="M50 10 L90 85 L50 70 L10 85 Z" />
              </svg>
              {/* Distance label floating near arrow */}
              <div className="mt-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-blue-600 font-bold text-sm shadow-lg">
                목적지 방향
              </div>
            </div>
          </div>
        </div>

        {/* HUD Bottom Controls */}
        <div className="relative z-10 w-full p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-3">
          <button 
            onClick={() => navigate('/ar-nav/arrived')}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all text-lg border border-white/10"
          >
            테스트로 도착 처리
          </button>
          <button 
            onClick={() => navigate('/ar-nav/select')}
            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl backdrop-blur-sm transition-all text-sm border border-white/10"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Run;
