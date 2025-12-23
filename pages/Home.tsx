
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const Home: React.FC = () => {
  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <div className="space-y-2">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">ARWay Lite</h1>
          <p className="text-gray-500 max-w-[240px] mx-auto text-sm leading-relaxed">
            도보 전용 AR 네비게이션 실험용 MVP입니다.
          </p>
        </div>

        <div className="w-full pt-8 space-y-4">
          <Link 
            to="/ar-nav/select" 
            className="block w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 text-lg"
          >
            도보 AR 네비 시작
          </Link>
          
          <Link 
            to="/tmap-nav" 
            className="block w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 text-lg"
          >
            🗺️ TMAP 네비게이션 (신규)
          </Link>
          
          <p className="mt-4 text-xs text-gray-400">
            * MVP 버전으로 카메라 권한이 필요할 수 있습니다.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
