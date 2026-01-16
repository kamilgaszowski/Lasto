"use client";

import { useState, useEffect } from 'react';

// --- MODELE DANYCH ---
interface Utterance {
  speaker: string;
  text: string;
}

interface HistoryItem {
  id: string;
  title: string;
  date: string;
  content: string;
  utterances?: Utterance[];
}

// --- IKONY (SVG) ---
const RuneArrowLeft = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
    <path d="M16 4l-10 8 10 8" />
  </svg>
);

const RuneArrowRight = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
    <path d="M8 4l10 8-10 8" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.1} stroke="currentColor" className="w-10 h-10">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378.138.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
);

export default function LastoWeb() {
  // --- STAN APLIKACJI ---
  const [apiKey, setApiKey] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // --- KLUCZOWA POPRAWKA: BEZPIECZNIK ---
  // Ta zmienna mówi nam, czy stare dane zostały już wczytane.
  // Zanim nie zmieni się na 'true', blokujemy zapisywanie.
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Stan paska bocznego
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  // Stan edycji
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [speakerAName, setSpeakerAName] = useState('Rozmówca A');
  const [speakerBName, setSpeakerBName] = useState('Rozmówca B');

  // Stan motywu (Dark Mode)
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // --- EFEKTY ---

  // 1. ŁADOWANIE DANYCH (tylko raz przy starcie)
  useEffect(() => {
    // Ładowanie klucza
    const savedKey = localStorage.getItem('assemblyAIKey') || '';
    setApiKey(savedKey);

    // Ładowanie historii z zabezpieczeniem (try/catch)
    try {
        const savedHistoryRaw = localStorage.getItem('lastoHistory');
        if (savedHistoryRaw) {
            const parsed = JSON.parse(savedHistoryRaw);
            setHistory(parsed);
        }
    } catch (e) {
        console.error("Błąd odczytu historii - dane mogą być uszkodzone", e);
    }

    // Ładowanie motywu
    const savedTheme = localStorage.getItem('lastoTheme') as 'light' | 'dark' | null;
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
    }

    // --- ODBEZPIECZENIE ZAPISU ---
    // Dopiero teraz pozwalamy na nadpisywanie localStorage
    setIsLoaded(true);
  }, []);

  // 2. APLIKOWANIE MOTYWU
  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    // Zapisujemy motyw tylko jeśli aplikacja jest załadowana
    if (isLoaded) {
        localStorage.setItem('lastoTheme', theme);
    }
  }, [theme, isLoaded]);

  // 3. ZAPISYWANIE HISTORII (Działa tylko gdy isLoaded === true)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('lastoHistory', JSON.stringify(history));
    }
  }, [history, isLoaded]);

  // Obsługa zmiany rozmiaru paska
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(240, Math.min(800, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; 
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // --- FUNKCJE LOGIKI ---

  const startResizing = () => setIsResizing(true);

  const saveNewTitle = () => {
    if (!selectedItem || !editedTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    const updatedItem = { ...selectedItem, title: editedTitle };
    setHistory(prev => prev.map(item => item.id === selectedItem.id ? updatedItem : item));
    setSelectedItem(updatedItem);
    setIsEditingTitle(false);
  };

  const checkStatus = async (id: string, fileName: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
          headers: { 'Authorization': apiKey }
        });
        
        if (!res.ok) {
            console.error("Błąd API:", res.statusText);
            return;
        }

        const result = await res.json();

        if (result.status === 'completed') {
          clearInterval(interval);
          
          const newItem: HistoryItem = {
            id: id,
            title: fileName,
            date: new Date().toISOString(),
            content: result.text,
            utterances: result.utterances
          };

          // Dodajemy nowy element na początek listy
          setHistory(prev => {
             // Sprawdź czy już takiego nie ma (zabezpieczenie)
             if (prev.some(item => item.id === newItem.id)) return prev;
             return [newItem, ...prev];
          });

          setSelectedItem(newItem);
          setIsProcessing(false);
          setStatus('');
        } else if (result.status === 'error') {
          clearInterval(interval);
          setStatus('Błąd transkrypcji');
          console.error("Błąd transkrypcji AssemblyAI:", result.error);
          setIsProcessing(false);
        }
      } catch (err) { 
        console.error("Błąd połączenia w pętli:", err);
        clearInterval(interval); 
        setIsProcessing(false); 
      }
    }, 3000);
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !apiKey) return;
    setIsProcessing(true);
    setStatus('Wysyłanie...');
    try {
      const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST', headers: { 'Authorization': apiKey }, body: file
      });
      
      if (!uploadRes.ok) throw new Error("Błąd uploadu");
      
      const { upload_url } = await uploadRes.json();
      
      setStatus('Przetwarzanie AI...');
      const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_url: upload_url, language_code: 'pl', speaker_labels: true })
      });

      if (!transcriptRes.ok) throw new Error("Błąd startu transkrypcji");

      const { id } = await transcriptRes.json();
      checkStatus(id, file.name);
    } catch (e) { 
        console.error(e);
        setStatus('Błąd połączenia'); 
        setIsProcessing(false); 
    }
  };

  const getDisplayText = (item: HistoryItem) => {
    if (item.utterances && item.utterances.length > 0) {
      return item.utterances.map(u => {
        const name = (u.speaker === 'A' || u.speaker === '1') ? speakerAName : speakerBName;
        return `${name.toUpperCase()}:\n${u.text}\n`;
      }).join('\n');
    }
    return item.content;
  };

  return (
    <main className="flex h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden font-sans transition-colors duration-300">
      
      {/* SIDEBAR */}
      <div 
        className="flex flex-col bg-gray-50/50 dark:bg-gray-900/50 relative group"
        style={{ 
          width: isSidebarOpen ? sidebarWidth : 0,
          transition: isResizing ? 'none' : 'width 300ms ease-in-out',
          opacity: isSidebarOpen ? 1 : 0
        }}
      >
        <div className={`flex flex-col h-full overflow-hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 border-r border-gray-100 dark:border-gray-800`}>
          <div className="p-8 flex justify-between items-center whitespace-nowrap">
            <h2 className="text-2xl font-light tracking-tight">Archiwum</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-300 hover:text-black dark:hover:text-white transition-colors">
              <RuneArrowLeft />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 space-y-1 whitespace-nowrap">
            {history.map((item) => (
              <button 
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  selectedItem?.id === item.id ? 'bg-white dark:bg-gray-800 shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
                }`}
              >
                <div className="font-medium truncate text-sm">{item.title}</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">
                  {new Date(item.date).toLocaleDateString('pl-PL')}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* UCHWYT ZMIANY ROZMIARU */}
        {isSidebarOpen && (
          <div 
            onMouseDown={startResizing}
            className="absolute right-0 top-0 bottom-0 w-2 translate-x-1/2 cursor-col-resize z-50 flex items-center justify-center group/handle"
          >
             <div className="w-[1px] h-full bg-gray-200 dark:bg-gray-800 group-hover/handle:bg-gray-400 transition-colors" />
             <div className="absolute w-1 h-8 rounded-full bg-gray-300 dark:bg-gray-700 group-hover/handle:bg-black dark:group-hover/handle:bg-white transition-colors" />
          </div>
        )}
      </div>

      {/* GŁÓWNY PANEL */}
      <div className="flex-1 flex flex-col relative bg-white dark:bg-gray-950 min-w-0 transition-colors duration-300">
        
        {/* TOP BAR */}
        <div className="p-8 flex justify-between items-start z-10">
          <div className="flex items-center">
             {!isSidebarOpen && (
               <button onClick={() => setIsSidebarOpen(true)} className="text-gray-300 hover:text-black dark:hover:text-white mr-6 transition-colors">
                 <RuneArrowRight />
               </button>
             )}
             {selectedItem && (
               <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-black dark:hover:text-white text-xl font-light transition-colors">Wróć</button>
             )}
          </div>

          <div className="flex flex-col items-end space-y-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-300 italic">Lasto beth nîn</span>
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="text-gray-300 hover:text-black dark:hover:text-white transition-transform hover:rotate-12 duration-300"
            >
                <SettingsIcon />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-12 pb-12 overflow-hidden">
          {!selectedItem ? (
            /* EKRAN POWITALNY */
            <div className="text-center space-y-12 animate-in fade-in zoom-in duration-700">
              <div className="space-y-6">
                <div className="text-9xl font-thin tracking-tighter text-gray-900 dark:text-white transition-colors">Lasto</div>
                <div className="flex items-center justify-center space-x-6 text-xl font-light text-gray-400">
                    <span>Słuchaj</span> <span className="text-2xl text-gray-200 dark:text-gray-700 pb-1">ᛟ</span>
                    <span>Nagraj</span> <span className="text-2xl text-gray-200 dark:text-gray-700 pb-1">ᛟ</span>
                    <span>Pisz</span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-4 items-center pt-8">
                <label className={`group relative cursor-pointer bg-black dark:bg-white dark:text-black text-white px-12 py-5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                  {isProcessing ? 'Przetwarzanie...' : 'Importuj nagranie'}
                  <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} disabled={isProcessing} />
                </label>
                <p className="text-[10px] uppercase tracking-widest text-gray-300 dark:text-gray-600">WAV • MP3 • M4A</p>
              </div>
            </div>
          ) : (
            /* WIDOK EDYCJI */
            <div className="w-full max-w-5xl h-full flex flex-col space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* EDYTOWALNY TYTUŁ */}
              <div className="flex items-end justify-between border-b border-gray-50 dark:border-gray-800 pb-6 min-h-[80px]">
                {isEditingTitle ? (
                  <div className="flex items-center w-full space-x-4">
                    <input 
                      className="w-full text-4xl font-thin tracking-tight bg-gray-50 dark:bg-gray-900 p-2 rounded focus:ring-1 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveNewTitle()}
                      autoFocus
                    />
                    <button onClick={saveNewTitle} className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
                      <CheckIcon />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center w-full group cursor-pointer" onClick={() => { setEditedTitle(selectedItem.title); setIsEditingTitle(true); }}>
                    <h1 className="text-4xl font-thin tracking-tight truncate max-w-2xl dark:text-white">{selectedItem.title}</h1>
                    <span className="ml-4 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-300">
                      <EditIcon />
                    </span>
                  </div>
                )}
              </div>

              <div className="flex space-x-4 animate-in fade-in duration-300">
                  <input className="flex-1 bg-gray-100 dark:bg-gray-900 dark:text-white border-none rounded-lg p-3 text-xs focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-gray-400" value={speakerAName} onChange={(e) => setSpeakerAName(e.target.value)} placeholder="Osoba A" />
                  <input className="flex-1 bg-gray-100 dark:bg-gray-900 dark:text-white border-none rounded-lg p-3 text-xs focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-gray-400" value={speakerBName} onChange={(e) => setSpeakerBName(e.target.value)} placeholder="Osoba B" />
              </div>

              <textarea className="flex-1 w-full p-8 bg-gray-100/40 dark:bg-gray-900/40 dark:text-gray-200 rounded-2xl font-mono text-sm leading-relaxed border-none focus:ring-0 resize-none selection:bg-blue-50 dark:selection:bg-blue-900" value={getDisplayText(selectedItem)} readOnly />
              
              <div className="flex items-center">
                <button onClick={() => { navigator.clipboard.writeText(getDisplayText(selectedItem)); alert('Skopiowano!'); }} className="w-fit px-5 py-2 border border-gray-200 dark:border-gray-800 text-gray-400 text-[10px] uppercase tracking-widest rounded hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white transition-all">
                    Kopiuj tekst
                </button>
              </div>
            </div>
          )}
        </div>

        {/* STATUS BAR */}
        {status && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-full text-[10px] tracking-[0.2em] uppercase shadow-2xl animate-pulse">
            {status}
          </div>
        )}
      </div>

      {/* MODAL USTAWIEŃ */}
      {isSettingsOpen && (
        <div 
            className="fixed inset-0 bg-white/60 dark:bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-in fade-in duration-300"
            onClick={() => setIsSettingsOpen(false)}
        >
          <div 
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md space-y-8 relative"
            onClick={(e) => e.stopPropagation()} 
          >
            <button 
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-8 right-8 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
                <CloseIcon />
            </button>

            <h3 className="text-3xl font-thin text-center dark:text-white">Ustawienia</h3>
            
            <div className="space-y-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Motyw</label>
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        <button 
                            onClick={() => setTheme('light')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg text-xs font-medium transition-all ${theme === 'light' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            <SunIcon />
                            <span>Jasny</span>
                        </button>
                        <button 
                            onClick={() => setTheme('dark')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg text-xs font-medium transition-all ${theme === 'dark' ? 'bg-gray-700 shadow-sm text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            <MoonIcon />
                            <span>Ciemny</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Klucz API AssemblyAI</label>
                    <input 
                        type="password" 
                        className="w-full bg-gray-100 dark:bg-gray-800 dark:text-white border-none rounded-xl p-4 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all placeholder-gray-400" 
                        value={apiKey} 
                        onChange={(e) => { setApiKey(e.target.value); localStorage.setItem('assemblyAIKey', e.target.value); }} 
                        placeholder="Wklej klucz..." 
                    />
                </div>
            </div>

            <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium">Gotowe</button>
          </div>
        </div>
      )}
    </main>
  );
}