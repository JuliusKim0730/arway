
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import Layout from '../components/Layout';
import { Destination } from '../types';

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Destination[]>([]);
  const [mapPlaceholder, setMapPlaceholder] = useState(true);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Attempting to get user location for more relevant search
      let locationData = { latitude: 37.5665, longitude: 126.9780 }; // Default Seoul
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => 
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        locationData = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      } catch (err) {
        console.warn("Location access denied or timed out, using default.");
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Find places near me matching: "${query}". Return as a list of places with their name and a very short description.`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: locationData
            }
          }
        },
      });

      // Extract info from grounding metadata if available, or text
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      if (chunks && chunks.length > 0) {
        const mappedResults: Destination[] = chunks
          .filter(chunk => chunk.maps)
          .map((chunk, idx) => ({
            id: `search-${idx}-${Date.now()}`,
            name: chunk.maps.title || "Unknown Place",
            description: `Google Maps 검색 결과: ${chunk.maps.uri}`,
            distance: Math.floor(Math.random() * 500) + 100 // Mocked distance
          }));
        setResults(mappedResults);
      } else {
        // Fallback: Parse response text if grounding chunks aren't formatted as objects
        // In a real app, you'd use a responseSchema, but googleMaps tool prohibits it.
        // For MVP, we'll just show the text or a placeholder if nothing found.
        console.log("No specific map chunks found, using text response.");
      }
      
      setMapPlaceholder(false);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const addDestination = (dest: Destination) => {
    navigate('/ar-nav/select', { state: { newDest: dest } });
  };

  return (
    <Layout fullBleed>
      <div className="flex flex-col h-screen bg-gray-100">
        {/* Search Bar Header */}
        <header className="p-4 bg-white shadow-sm z-20">
          <form onSubmit={handleSearch} className="relative flex items-center gap-2">
            <button 
              type="button"
              onClick={() => navigate('/ar-nav/select')}
              className="p-2 text-gray-500 hover:text-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="relative flex-1">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="장소, 주소, 카페 검색..." 
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button 
              disabled={loading}
              className={`px-4 py-3 rounded-2xl font-bold transition-all ${loading ? 'bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}`}
            >
              {loading ? '...' : '검색'}
            </button>
          </form>
        </header>

        {/* Map View Area */}
        <div className="flex-1 relative overflow-hidden bg-gray-200">
          {/* Mock Map Background */}
          <div className="absolute inset-0 opacity-50 pointer-events-none">
             <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Centered Map Indicator */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full animate-ping absolute -inset-0"></div>
              <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white relative"></div>
            </div>
          </div>

          {/* Search Result Markers (Mocked) */}
          {!loading && results.map((res, i) => (
            <div 
              key={res.id} 
              className="absolute animate-fade-in"
              style={{ 
                top: `${30 + (i * 15) % 40}%`, 
                left: `${20 + (i * 25) % 60}%` 
              }}
            >
               <div className="flex flex-col items-center">
                  <div className="bg-white px-2 py-1 rounded-lg shadow-md text-[10px] font-bold mb-1 border border-blue-200 truncate max-w-[80px]">
                    {res.name}
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
               </div>
            </div>
          ))}

          {loading && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10">
              <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium text-gray-700">장소를 찾는 중...</span>
              </div>
            </div>
          )}
        </div>

        {/* Results Sheet */}
        <div className={`transition-all duration-300 ease-in-out bg-white rounded-t-3xl shadow-[0_-10px_25px_rgba(0,0,0,0.05)] z-30 ${results.length > 0 ? 'h-2/5' : 'h-0 overflow-hidden'}`}>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3"></div>
          <div className="px-6 overflow-y-auto h-full pb-10">
            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">검색 결과</h3>
            <div className="space-y-4">
              {results.map(res => (
                <div key={res.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{res.name}</h4>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{res.description}</p>
                  </div>
                  <button 
                    onClick={() => addDestination(res)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    추가
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Helper text when no results */}
        {!loading && results.length === 0 && !mapPlaceholder && (
          <div className="absolute bottom-10 left-6 right-6 p-4 bg-white/90 backdrop-blur rounded-2xl text-center shadow-lg border border-gray-100 z-10">
            <p className="text-gray-600 text-sm italic">결과가 없습니다. 다른 검색어를 입력해보세요.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Search;
