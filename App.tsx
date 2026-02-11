import React, { useState, useEffect, useMemo } from 'react';
import { Chapter, BookContent } from './types';
import ChatInterface from './components/ChatInterface';
import { contentService } from './services/contentService';

// --- HLUTI SEM SÉR UM AÐ RENDER-A ÓLÍKAR EININGAR ÚR JSON ---
const ContentRenderer: React.FC<{ elements: any[], darkMode: boolean }> = ({ elements, darkMode }) => {
  if (!elements) return null;

  return (
    <>
      {elements.map((el, i) => {
        switch (el.type) {
          case 'story':
            return (
              <p key={i} className={`text-xl italic mb-10 border-l-4 border-indigo-500 pl-6 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                {el.value}
              </p>
            );
          case 'text':
            return <p key={i} className="mb-6 leading-relaxed text-lg">{el.value}</p>;
          case 'table':
            return (
              <div key={i} className="overflow-x-auto rounded-xl border border-gray-200 my-8 shadow-sm">
                <table className={`w-full text-left border-collapse ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                  <thead>
                    <tr className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
                      {el.headers.map((h: string) => <th key={h} className="p-4 font-bold border-b border-gray-200">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {el.rows.map((row: string[], ri: number) => (
                      <tr key={ri} className="border-b border-gray-100 last:border-0">
                        {row.map((cell, ci) => <td key={ci} className="p-4 font-mono">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'chat-example':
            return (
              <div key={i} className={`my-8 rounded-2xl overflow-hidden border ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-gray-200 bg-gray-900'}`}>
                <div className="p-4 border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-widest">Dæmi um svörun</div>
                <div className="p-6 flex flex-col gap-4 font-mono text-sm">
                  <div className="flex gap-3 text-blue-400">
                    <span className="opacity-50">Notandi:</span>
                    <span>{el.prompt}</span>
                  </div>
                  <div className="flex gap-3 text-red-400">
                    <span className="opacity-50">Gervigreind:</span>
                    <span>{el.response}</span>
                  </div>
                </div>
              </div>
            );
          case 'highlight':
            return (
              <div key={i} className={`p-6 rounded-2xl border-l-8 mb-8 ${darkMode ? 'bg-indigo-900/20 border-indigo-500 text-slate-200' : 'bg-indigo-50 border-indigo-600 text-indigo-900'}`}>
                <p className="text-lg font-medium leading-relaxed">{el.value}</p>
              </div>
            );
          case 'note':
            return (
              <div key={i} className={`p-6 rounded-2xl border mb-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                <h4 className="text-indigo-500 font-bold mb-2 uppercase text-xs tracking-tighter">{el.title}</h4>
                <p className={darkMode ? 'text-slate-300' : 'text-gray-700'}>{el.value}</p>
              </div>
            );
          case 'image':
            return (
              <div key={i} className="my-10 text-center">
                <img src={el.src} alt={el.caption} className="mx-auto rounded-xl shadow-lg max-h-96" />
                {el.caption && <p className="mt-3 text-sm text-gray-500 italic">{el.caption}</p>}
              </div>
            );
          default:
            return null;
        }
      })}
    </>
  );
};

const App: React.FC = () => {
  const [book, setBook] = useState<BookContent | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    contentService.getBookData()
      .then(data => {
        setBook(data);
        setCurrentChapter(data.chapters[0]);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Fatal error loading book:', err);
        setError(`Ekki tókst að hlaða bókinni: ${err.message}`);
        setIsLoading(false);
      });
  }, []);

  const currentIndex = useMemo(() => {
    if (!book || !currentChapter) return 0;
    return book.chapters.findIndex(c => c.id === currentChapter.id);
  }, [book, currentChapter]);

  const filteredChapters = useMemo(() => {
    if (!book) return [];
    return book.chapters.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.summary.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [book, searchQuery]);

  // Nú skrollum við aðeins miðjusvæðinu þegar skipt er um kafla
  useEffect(() => {
    const mainContent = document.getElementById('main-scroll-area');
    if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentChapter]);

  if (isLoading || !book || !currentChapter) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        {error ? (
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Villa!</h2>
            <p className="text-gray-700">{error}</p>
          </div>
        ) : (
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>
    );
  }

  const progress = ((currentIndex + 1) / book.chapters.length) * 100;

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 z-[60] bg-gray-200">
        <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Mobile Header */}
      <header className={`lg:hidden border-b px-4 py-3 shrink-0 z-50 flex items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-indigo-500">Gervigreindarbókin</h1>
        <button onClick={() => setDarkMode(!darkMode)} className="p-2">{darkMode ? '☀️' : '🌙'}</button>
      </header>

      {/* Main Layout Wrapper */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
        )}

        {/* Sidebar - Fixed and Scrollable */}
        <aside className={`fixed inset-y-0 left-0 w-80 border-r z-50 transform transition-all duration-300 lg:translate-x-0 lg:static flex flex-col shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white shadow-xl lg:shadow-none'}`}>
          <div className="p-6 border-b shrink-0">
            <h2 className="text-2xl font-bold text-indigo-600">{book.title}</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">{book.author}</p>
          </div>
          <div className="px-6 py-4 shrink-0">
            <input 
              type="text" 
              placeholder="Leita í köflum..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className={`w-full p-2 rounded-lg text-sm outline-none border transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:border-indigo-500' : 'bg-gray-100 border-transparent focus:bg-white focus:border-indigo-300'}`} 
            />
          </div>
          <nav className="flex-1 overflow-y-auto">
            {(() => {
              const part1 = filteredChapters.filter(c => c.part === 1);
              const part2 = filteredChapters.filter(c => c.part === 2);
              const part3 = filteredChapters.filter(c => c.part === 3);

              const renderPart = (chapters: Chapter[], partNum: number, partTitle: string, color: string) => (
                <div key={`part-${partNum}`}>
                  <div className={`px-6 py-3 text-xs font-bold uppercase tracking-widest ${color} sticky top-0 z-10 backdrop-blur-sm`}>
                    {partNum}. {partTitle}
                  </div>
                  {chapters.map((chapter) => (
                    <button 
                      key={chapter.id} 
                      onClick={() => { setCurrentChapter(chapter); setSidebarOpen(false); }} 
                      className={`w-full text-left px-6 py-3 flex flex-col gap-1 transition-colors border-l-4 ${currentChapter.id === chapter.id ? 'bg-indigo-600 text-white border-indigo-600' : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-700'} ${darkMode && currentChapter.id !== chapter.id ? 'dark:border-slate-600' : ''}`}
                    >
                      <span className="text-sm font-semibold">{chapter.title}</span>
                      <span className={`text-xs opacity-70 line-clamp-1 ${currentChapter.id === chapter.id ? 'text-indigo-100' : 'text-gray-500'}`}>{chapter.summary}</span>
                    </button>
                  ))}
                </div>
              );

              return (
                <>
                  {part1.length > 0 && renderPart(part1, 1, 'Hugmyndir og upphaf', `${darkMode ? 'bg-slate-700 text-slate-200' : 'bg-blue-50 text-blue-700'}`)}
                  {part2.length > 0 && renderPart(part2, 2, 'Innviðir og undirstöður', `${darkMode ? 'bg-slate-700 text-slate-200' : 'bg-purple-50 text-purple-700'}`)}
                  {part3.length > 0 && renderPart(part3, 3, 'Þróun, vitund og vandi', `${darkMode ? 'bg-slate-700 text-slate-200' : 'bg-amber-50 text-amber-700'}`)}
                </>
              );
            })()}
          </nav>
        </aside>

        {/* Main Content Area - Only the middle part scrolls */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* MIDDLE SCROLLABLE SECTION */}
          <section id="main-scroll-area" className={`flex-1 overflow-y-auto px-6 py-10 md:px-16 md:py-20 scroll-smooth ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
            <div className="max-w-3xl mx-auto">
              <div className="mb-12">
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold mb-4">Kafli {currentIndex + 1}</span>
                <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">{currentChapter.title}</h1>
              </div>

              <div className={`prose prose-lg max-w-none ${darkMode ? 'prose-invert' : ''}`}>
                <ContentRenderer elements={(currentChapter as any).elements} darkMode={darkMode} />
              </div>

              {/* Navigation buttons */}
              <div className="mt-24 pt-12 border-t flex justify-between items-center border-gray-100 dark:border-slate-800">
                {currentIndex > 0 ? (
                  <button onClick={() => setCurrentChapter(book.chapters[currentIndex - 1])} className="flex items-center gap-2 font-semibold hover:text-indigo-600 transition-colors">
                    ← Fyrri
                  </button>
                ) : <div />}
                <div className="text-sm font-mono text-gray-400">{currentIndex + 1} / {book.chapters.length}</div>
                {currentIndex < book.chapters.length - 1 ? (
                  <button onClick={() => setCurrentChapter(book.chapters[currentIndex + 1])} className="flex items-center gap-2 font-semibold hover:text-indigo-600 transition-colors">
                    Næsti →
                  </button>
                ) : <span className="text-green-500 font-bold">🎉 Bók lokið!</span>}
              </div>
            </div>
          </section>

          {/* AI HELPER SIDEBAR - Fixed on desktop, scrollable height on mobile */}
          <aside className={`w-full md:w-[380px] lg:w-[440px] border-l flex flex-col shrink-0 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50'}`}>
            <div className="flex-1 overflow-hidden h-[400px] md:h-auto">
              <ChatInterface currentChapter={currentChapter} />
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default App;