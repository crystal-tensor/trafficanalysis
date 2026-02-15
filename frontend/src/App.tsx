import { useState } from 'react';
import axios from 'axios';

interface UploaderInfo {
  name: string;
  face: string;
  sign: string;
  follower: number;
  fans?: number; // Added to match backend
}

interface VideoInfo {
  title: string;
  desc?: string;
  pic: string;
  stat: {
    view: number;
    danmaku: number;
    reply: number;
    favorite: number;
    coin: number;
    share: number;
    like: number;
  };
  pubdate?: number;
}

interface Competitor {
  mid: number;
  name: string;
  face: string;
  follower: number;
  video_title: string;
  video_view: number;
  link?: string;
}

interface AnalysisResult {
  platform: string;
  target_uploader: {
    info: UploaderInfo;
    stats: any;
    current_video: VideoInfo;
  };
  competitors: Competitor[];
}

function formatNumber(num: number) {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿';
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
}

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [compUrl, setCompUrl] = useState('');
  const [addingComp, setAddingComp] = useState(false);
  const [compError, setCompError] = useState('');

  const handleAnalyze = async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const response = await axios.post('http://localhost:8000/analyze', { url });
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompetitor = () => {
    setAddingComp(true);
    setCompUrl('');
    setCompError('');
  };

  const submitCompetitor = async () => {
    if (!compUrl) return;
    // Don't set main loading to true to avoid full page skeleton, maybe just local loading?
    // But for simplicity using existing loading state is fine, or I can just rely on button disabled state if I want.
    // Let's use a local loading indication if possible, but 'loading' state affects the main search button too.
    // It is fine to block main search while adding competitor.
    setLoading(true); 
    setCompError('');
    try {
      const response = await axios.post('http://localhost:8000/analyze', { url: compUrl });
      const newData = response.data;
      
      // Construct link based on input or result
      let link = compUrl.startsWith('http') ? compUrl : undefined;
      if (!link) {
          if (newData.platform === 'bilibili') {
              // We might not have the MID easily if input was name, but let's try
              // Actually newData doesn't explicitly return the URL. 
              // But that's fine, we can leave link undefined or try to guess.
          }
      }

      const newCompetitor: Competitor = {
        mid: 0, 
        name: newData.target_uploader.info.name,
        face: newData.target_uploader.info.face,
        follower: newData.target_uploader.info.follower,
        video_title: newData.target_uploader.current_video.title,
        video_view: newData.target_uploader.current_video.stat.view,
        link: link
      };
      
      if (data) {
        setData({
          ...data,
          competitors: [newCompetitor, ...data.competitors]
        });
      }
      setAddingComp(false);
      setCompUrl('');
    } catch (err: any) {
      setCompError(err.response?.data?.detail || 'Failed to add competitor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f2f3] flex flex-col font-sans text-slate-800">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

            
            {/* Simple User Menu */}
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full border border-gray-300"></div>
            </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-6">
        
        {/* Search Section - Always visible but smaller when data exists */}
        <div className={`transition-all duration-500 ease-in-out ${data ? 'py-4' : 'py-20 text-center'}`}>
            {!data && (
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Content Creator Analysis</h1>
            )}
            <div className={`relative max-w-3xl ${!data ? 'mx-auto' : ''}`}>
                <input 
                  type="text" 
                  className="w-full bg-white border border-gray-200 rounded-lg px-6 py-3 focus:outline-none focus:ring-2 focus:ring-[#00aeec] focus:border-transparent shadow-sm transition-all"
                  placeholder="Paste URL, or enter YouTube Name / Bilibili ID..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                />
                <button 
                    className="absolute right-2 top-2 bg-[#00aeec] text-white px-6 py-1.5 rounded-md font-medium hover:bg-[#009cd3] transition disabled:opacity-50"
                    onClick={handleAnalyze}
                    disabled={loading}
                >
                    {loading ? 'Analyzing...' : 'Search'}
                </button>
            </div>
        </div>

        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6" role="alert">
                <p>{error}</p>
            </div>
        )}

        {data && (
          <div className="space-y-6 animate-fade-in">
            {/* Profile Header Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50"></div>
                <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 pt-4">
                    <div className="flex-1 text-center md:text-left z-10 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">{data.target_uploader.info.name}</h2>
                        <p className="text-gray-500 text-sm mt-1 line-clamp-1 max-w-xl">{data.target_uploader.info.sign || "No bio available"}</p>
                    </div>
                    
                    <div className="flex gap-8 z-10 bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-gray-100 shadow-sm">
                        <div className="text-center">
                            <div className="text-xs text-gray-500 font-bold uppercase">Followers</div>
                            <div className="text-xl font-bold text-gray-900">{formatNumber(data.target_uploader.info.follower)}</div>
                        </div>
                        <div className="text-center border-l border-gray-200 pl-8">
                            <div className="text-xs text-gray-500 font-bold uppercase">Total Views</div>
                            <div className="text-xl font-bold text-gray-900">{formatNumber(data.target_uploader.stats.archive_view || 0)}</div>
                        </div>
                        <div className="text-center border-l border-gray-200 pl-8">
                            <div className="text-xs text-gray-500 font-bold uppercase">Total Likes</div>
                            <div className="text-xl font-bold text-gray-900">{formatNumber(data.target_uploader.stats.likes || 0)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Latest Video Analysis */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 h-full">
                        <h3 className="font-bold text-gray-800 mb-4">Latest Video</h3>
                        <img 
                            src={data.target_uploader.current_video.pic} 
                            alt="Thumbnail" 
                            className="w-full rounded-lg mb-4 aspect-video object-cover"
                            referrerPolicy="no-referrer"
                        />
                        <h4 className="font-medium text-gray-900 leading-snug mb-3 line-clamp-2 hover:text-[#00aeec] cursor-pointer">
                            {data.target_uploader.current_video.title}
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <span className="text-gray-500">Views</span>
                                <span className="font-bold">{formatNumber(data.target_uploader.current_video.stat.view)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <span className="text-gray-500">Likes</span>
                                <span className="font-bold">{formatNumber(data.target_uploader.current_video.stat.like)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <span className="text-gray-500">Comments</span>
                                <span className="font-bold">{formatNumber(data.target_uploader.current_video.stat.reply)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <span className="text-gray-500">Coins</span>
                                <span className="font-bold">{formatNumber(data.target_uploader.current_video.stat.coin)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Competitor List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800">Competitors Analysis</h3>
                            <button 
                                className="text-sm text-[#00aeec] font-medium hover:underline"
                                onClick={handleAddCompetitor}
                            >
                                + Add New
                            </button>
                        </div>
                        
                        {addingComp && (
                            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex gap-2 items-center animate-fade-in">
                                <input 
                                    type="text" 
                                    className="flex-1 border border-blue-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#00aeec] bg-white"
                                    placeholder="Enter URL, Name or ID..."
                                    value={compUrl}
                                    onChange={(e) => setCompUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && submitCompetitor()}
                                    autoFocus
                                />
                                <button 
                                    onClick={submitCompetitor}
                                    disabled={loading}
                                    className="bg-[#00aeec] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#009cd3] disabled:opacity-50"
                                >
                                    Add
                                </button>
                                <button 
                                    onClick={() => setAddingComp(false)}
                                    className="text-gray-500 hover:text-gray-700 px-2"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                        {compError && (
                            <div className="px-6 py-2 bg-red-50 text-red-600 text-xs border-b border-red-100">
                                {compError}
                            </div>
                        )}
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Channel</th>
                                        <th className="px-6 py-3 font-medium">Followers</th>
                                        <th className="px-6 py-3 font-medium">Top Video</th>
                                        <th className="px-6 py-3 font-medium text-right">Views</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.competitors.map((comp, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {comp.link ? (
                                                        <a href={comp.link} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 hover:text-[#00aeec]">{comp.name}</a>
                                                    ) : (
                                                        <span className="font-medium text-gray-900">{comp.name}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {formatNumber(comp.follower)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={comp.video_title}>
                                                {comp.video_title}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                {formatNumber(comp.video_view)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {data.competitors.length === 0 && (
                                <div className="p-8 text-center text-gray-400">No competitors found</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
