
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const Arrived: React.FC = () => {
  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="mb-6 relative">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-2 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full border-4 border-white animate-pulse"></div>
        </div>

        <h2 className="text-3xl font-black text-gray-900 mb-2">도착했습니다!</h2>
        <p className="text-gray-500 mb-10 leading-relaxed px-4">
          AR 네비가 목적지까지 성공적으로 안내했습니다.<br/>즐거운 시간 되세요!
        </p>

        {/* Feedback Section */}
        <div className="bg-gray-50 rounded-2xl p-6 w-full mb-10 border border-gray-100">
          <p className="text-sm font-bold text-gray-700 mb-4">안내가 만족스러웠나요?</p>
          <div className="flex justify-center gap-8">
            <button className="flex flex-col items-center gap-2 group">
              <span className="text-4xl grayscale group-hover:grayscale-0 transition-all transform group-active:scale-125">😃</span>
              <span className="text-xs text-gray-500 font-medium">좋아요</span>
            </button>
            <button className="flex flex-col items-center gap-2 group">
              <span className="text-4xl grayscale group-hover:grayscale-0 transition-all transform group-active:scale-125">😐</span>
              <span className="text-xs text-gray-500 font-medium">그저그래요</span>
            </button>
          </div>
        </div>

        <div className="w-full space-y-3">
          <Link 
            to="/ar-nav/select" 
            className="block w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            다시 안내 받기
          </Link>
          <Link 
            to="/ar-nav" 
            className="block w-full py-4 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-all active:scale-95"
          >
            처음으로
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Arrived;
