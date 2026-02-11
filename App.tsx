import React, { useState, useEffect, useMemo } from 'react';
import { Chapter, BookContent, Message } from './types';
import ChatInterface from './components/ChatInterface';
import { contentService } from './services/contentService';

// --- HLUTI SEM SÉR UM AÐ RENDER-A ÓLÍKAR EININGAR ÚR JSON ---
const ContentRenderer: React.FC<{ elements: any[], darkMode: boolean, highlightActive?: boolean, phrases?: string[], activePhrase?: string }> = ({ elements, darkMode, highlightActive, phrases, activePhrase }) => {
  if (!elements) return null;

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');

  const renderHighlighted = (text: string, idxBase: number) => {
    if (!highlightActive || !phrases || phrases.length === 0) return text;
    const matchList = activePhrase ? [activePhrase] : phrases;
    const pattern = matchList.map(escapeRegExp).join('|');
    if (!pattern) return text;
    const re = new RegExp(pattern, 'gi');
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let counter = 0;
    while ((match = re.exec(text)) !== null) {
      const start = match.index;
      const matchText = match[0];
      if (start > lastIndex) parts.push(text.slice(lastIndex, start));
      const isActiveMatch = activePhrase && matchText.toLowerCase() === activePhrase.toLowerCase();
      parts.push(
        <mark key={`h-${idxBase}-${counter}`} className={`bg-yellow-200 text-gray-900 font-semibold px-1 rounded inline-block ${isActiveMatch ? 'animate-pulse scale-105' : ''}`}>
          {matchText}
        </mark>
      );
      counter += 1;
      lastIndex = start + matchText.length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
  };

  return (
    <>
      {elements.map((el, i) => {
        switch (el.type) {
          case 'story':
            return (
              <p key={i} className={`text-lg md:text-xl italic mb-6 md:mb-10 border-l-4 border-indigo-500 pl-4 md:pl-6 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                {typeof el.value === 'string' ? renderHighlighted(el.value, i) : el.value}
              </p>
            );
          case 'text':
            return <p key={i} className="mb-4 md:mb-6 leading-relaxed text-base md:text-lg">{typeof el.value === 'string' ? renderHighlighted(el.value, i) : el.value}</p>;
          case 'table':
            return (
              <div key={i} className="overflow-x-auto rounded-xl border border-gray-200 my-6 md:my-8 shadow-sm">
                <table className={`w-full text-left border-collapse text-sm md:text-base ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                  <thead>
                    <tr className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
                      {el.headers.map((h: string) => <th key={h} className="p-3 md:p-4 font-bold border-b border-gray-200">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {el.rows.map((row: string[], ri: number) => (
                      <tr key={ri} className="border-b border-gray-100 last:border-0">
                        {row.map((cell, ci) => <td key={ci} className="p-3 md:p-4 font-mono text-xs md:text-sm">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'chat-example':
            return (
              <div key={i} className={`my-6 md:my-8 rounded-2xl overflow-hidden border ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-gray-200 bg-gray-900'}`}>
                <div className="p-3 md:p-4 border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-widest">Dæmi um svörun</div>
                <div className="p-4 md:p-6 flex flex-col gap-3 md:gap-4 font-mono text-xs md:text-sm">
                  <div className="flex gap-3 text-blue-400">
                    <span className="opacity-50 shrink-0">Notandi:</span>
                    <span>{el.prompt}</span>
                  </div>
                  <div className="flex gap-3 text-red-400">
                    <span className="opacity-50 shrink-0">Gervigreind:</span>
                    <span>{el.response}</span>
                  </div>
                </div>
              </div>
            );
          case 'highlight':
            return (
              <div key={i} className={`p-4 md:p-6 rounded-2xl border-l-8 mb-6 md:mb-8 ${darkMode ? 'bg-indigo-900/20 border-indigo-500 text-slate-200' : 'bg-indigo-50 border-indigo-600 text-indigo-900'}`}>
                <p className="text-base md:text-lg font-medium leading-relaxed">{el.value}</p>
              </div>
            );
          case 'note':
            return (
              <div key={i} className={`p-4 md:p-6 rounded-2xl border mb-4 md:mb-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                <h4 className="text-indigo-500 font-bold mb-2 uppercase text-xs tracking-tighter">{el.title}</h4>
                <p className={`text-sm md:text-base ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{el.value}</p>
              </div>
            );
          case 'image':
            return (
              <div key={i} className="my-6 md:my-10 text-center">
                <img src={el.src} alt={el.caption} className="mx-auto rounded-xl shadow-lg max-h-80 md:max-h-96 w-full object-contain" />
                {el.caption && <p className="mt-2 md:mt-3 text-xs md:text-sm text-gray-500 italic">{el.caption}</p>}
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
  const [showChatModal, setShowChatModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const raw = localStorage.getItem('chat_messages');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [highlightActive, setHighlightActive] = useState(false);
  const [activePhrase, setActivePhrase] = useState<string | null>(null);

  // Key phrases for the first chapter (try-out)
  const chapterOnePhrases = [
    'Hefæstos',
    'Pandóra',
    'vélmenni',
    'gervigreind',
    'aðstoðarfólk'
  ];

  useEffect(() => {
    try {
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    } catch {}
  }, [messages]);

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
          <div className="p-4 md:p-6 border-b shrink-0">
            <h2 className="text-xl md:text-2xl font-bold text-indigo-600">{book.title}</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mt-1">{book.author}</p>
          </div>
          <div className="px-4 md:px-6 py-3 md:py-4 shrink-0">
            <input 
              type="text" 
              placeholder="Leita í köflum..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className={`w-full p-2 md:p-3 rounded-lg text-sm outline-none border transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:border-indigo-500' : 'bg-gray-100 border-transparent focus:bg-white focus:border-indigo-300'}`} 
            />
          </div>
          <nav className="flex-1 overflow-y-auto">
            {(() => {
              const part1 = filteredChapters.filter(c => c.part === 1);
              const part2 = filteredChapters.filter(c => c.part === 2);
              const part3 = filteredChapters.filter(c => c.part === 3);

              const renderPart = (chapters: Chapter[], partNum: number, partTitle: string, color: string) => (
                <div key={`part-${partNum}`}>
                  <div className={`px-4 md:px-6 py-2 md:py-3 text-xs font-bold uppercase tracking-widest ${color} sticky top-0 z-10 backdrop-blur-sm`}>
                    {partNum}. {partTitle}
                  </div>
                  {chapters.map((chapter) => (
                    <button 
                      key={chapter.id} 
                      onClick={() => { setCurrentChapter(chapter); setSidebarOpen(false); }} 
                      className={`w-full text-left px-4 md:px-6 py-2 md:py-3 flex flex-col gap-1 transition-colors border-l-4 ${currentChapter.id === chapter.id ? 'bg-indigo-600 text-white border-indigo-600' : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-700'} ${darkMode && currentChapter.id !== chapter.id ? 'dark:border-slate-600' : ''}`}
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
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* MIDDLE SCROLLABLE SECTION */}
          <section id="main-scroll-area" className={`flex-1 overflow-y-auto px-4 py-6 md:px-8 lg:px-16 md:py-10 lg:py-20 scroll-smooth ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
            <div className="max-w-2xl lg:max-w-3xl mx-auto">
              <div className="mb-8 md:mb-12">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold mb-4">Kafli {currentIndex + 1}</span>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 leading-tight">{currentChapter.title}</h1>
                  </div>
                  {/* Key icon only for chapter 1 */}
                  {currentChapter.id === 'ancient-robots-and-pandora' && (
                    <div className="shrink-0 mt-1">
                      <button onClick={() => { setHighlightActive(!highlightActive); if (!highlightActive) setActivePhrase(null); }} className="p-3 rounded-full bg-yellow-100 text-yellow-800 shadow-md">
                        🔑
                      </button>
                    </div>
                  )}
                </div>

                {/* Phrase selector / legend for chapter 1 */}
                {currentChapter.id === 'ancient-robots-and-pandora' && highlightActive && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {chapterOnePhrases.map(p => (
                      <button key={p} onClick={() => setActivePhrase(activePhrase === p ? null : p)} className={`px-3 py-1 rounded-full text-sm font-medium ${activePhrase === p ? 'bg-yellow-300 text-gray-900' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {p}
                      </button>
                    ))}
                    <button onClick={() => { setHighlightActive(false); setActivePhrase(null); }} className="ml-2 px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">Ljúka</button>
                  </div>
                )}

                {/* Summary paragraph for chapter 1 shown when highlights active */}
                {currentChapter.id === 'ancient-robots-and-pandora' && highlightActive && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-lg prose-sm text-sm text-gray-800 transition-opacity duration-300">
                    <p>
                      Kaflinn fjallar um Hefæstos, fatlaðan son gyðjunnar Heru sem reiddi sig á hugvit sitt og smíðaði ýmis tæki og sjálfvirka aðstoðarmenn sem minna á fornar hugmyndir um vélmenni og gervigreind. Frægasta sköpunarverk hans var Pandóra, kona mótuð úr leir að beiðni guðsins Seifs. Pandóra fékk margvíslegar „gjafir“ frá hinum guðunum en Seifur notaði hana í raun sem tæki til að hefna sín á mannkyninu. Forvitni Pandóru varð til þess að hún opnaði innsiglaða krús og hleypti út illsku heimsins—hungri, stríði, veikindum og fleiru—en eftir í krúsinni sat einungis vonin. Föst inni.
                    </p>
                  </div>
                )}
              </div>

              <div className={`prose prose-sm md:prose-base lg:prose-lg max-w-none ${darkMode ? 'prose-invert' : ''}`}>
                <ContentRenderer elements={(currentChapter as any).elements} darkMode={darkMode} highlightActive={highlightActive && currentChapter.id === 'ancient-robots-and-pandora'} phrases={chapterOnePhrases} activePhrase={activePhrase || undefined} />
              </div>

              {/* Navigation buttons */}
              <div className="mt-16 md:mt-24 pt-8 md:pt-12 border-t flex justify-between items-center border-gray-100 dark:border-slate-800 gap-4">
                {currentIndex > 0 ? (
                  <button onClick={() => setCurrentChapter(book.chapters[currentIndex - 1])} className="flex items-center gap-2 font-semibold hover:text-indigo-600 transition-colors text-sm md:text-base">
                    ← Fyrri
                  </button>
                ) : <div />}
                <div className="text-xs md:text-sm font-mono text-gray-400">{currentIndex + 1} / {book.chapters.length}</div>
                {currentIndex < book.chapters.length - 1 ? (
                  <button onClick={() => setCurrentChapter(book.chapters[currentIndex + 1])} className="flex items-center gap-2 font-semibold hover:text-indigo-600 transition-colors text-sm md:text-base">
                    Næsti →
                  </button>
                ) : <span className="text-green-500 font-bold text-sm md:text-base">🎉 Bók lokið!</span>}
              </div>
            </div>
          </section>

          {/* AI HELPER SIDEBAR - Desktop: beside content. Mobile: hidden (use footer trigger). */}
          <aside className={`hidden lg:flex w-[380px] xl:w-[440px] border-l flex-col shrink-0 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50'}`}>
            <div className="flex-1 overflow-hidden">
              <ChatInterface currentChapter={currentChapter} messages={messages} setMessages={setMessages} />
            </div>
          </aside>

          {/* Mobile footer chat trigger */}
          <div className="lg:hidden">
            <button
              onClick={() => { setShowChatModal(true); setTimeout(() => setModalVisible(true), 20); }}
              aria-label="Opna gervigreindarkennara"
              className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-3 rounded-full shadow-xl flex items-center gap-3"
            >
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="font-semibold">Gervigreindarkennarinn</span>
            </button>
          </div>

          {/* Chat modal (mobile) */}
          {/* Modal with enter/exit animation */}
          {showChatModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => {
                setModalVisible(false);
                setTimeout(() => setShowChatModal(false), 300);
              }} />
              <div className={`relative w-[95%] max-w-xl mx-auto rounded-2xl overflow-hidden ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white'}`}>
                <div className={`transform transition-all duration-300 ${modalVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-6'}`}>
                  <div className="p-3 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <h3 className="font-semibold">Gervigreindarkennarinn</h3>
                    </div>
                    <button onClick={() => {
                      setModalVisible(false);
                      setTimeout(() => setShowChatModal(false), 300);
                    }} className="p-2 text-gray-500 hover:text-gray-700">Loka</button>
                  </div>
                  <div className="p-4 h-[70vh]">
                    <ChatInterface currentChapter={currentChapter} messages={messages} setMessages={setMessages} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;