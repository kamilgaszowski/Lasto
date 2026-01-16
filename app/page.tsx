"use client";

import { useState, useEffect } from 'react';

// --- MODELE DANYCH ---
interface Utterance {
  speaker: string;
  text: string;
}

// Mapa imion: np. { "A": "Marek", "B": "Kasia" }
interface SpeakerMap {
  [key: string]: string;
}

interface HistoryItem {
  id: string;
  title: string;
  date: string;
  content: string;
  utterances?: Utterance[];
  speakerNames?: SpeakerMap;
}

// --- IKONY ---

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Edycja & Motyw
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // --- 1. ODCZYT DANYCH (Z AUTO-NAPRAWĄ DUPLIKATÓW) ---
  useEffect(() => {
    const savedKey = localStorage.getItem('assemblyAIKey') || '';
    const savedHistoryRaw = localStorage.getItem('lastoHistory');
    
    setApiKey(savedKey);

    if (savedHistoryRaw) {
        try {
            const parsed = JSON.parse(savedHistoryRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Filtrujemy duplikaty ID
                const uniqueHistory = parsed.filter((item, index, self) => 
                    index === self.findIndex((t) => (
                        t.id === item.id
                    ))
                );
                
                setHistory(uniqueHistory);
                
                if (uniqueHistory.length !== parsed.length) {
                    console.log("LASTO: Usunięto zduplikowane wpisy z historii.");
                }
            }
        } catch(e) { console.error(e); }
    }

    const savedTheme = localStorage.getItem('lastoTheme') as 'light' | 'dark' | null;
    if (savedTheme) setTheme(savedTheme);
    else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
  
  if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then((granted) => {
            if (granted) {
                console.log("Storage will not be cleared except by explicit user action");
            } else {
                console.log("Storage may be cleared by the UA under storage pressure.");
            }
        });
    }
  }, []);

  // --- 2. ZAPISYWANIE DANYCH (Z CZYSZCZENIEM PRZY BRAKU MIEJSCA) ---
  useEffect(() => {
    if (history.length === 0) return;

    try {
        localStorage.setItem('lastoHistory', JSON.stringify(history));
    } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            console.warn("Pełna pamięć! Usuwam najstarsze nagranie.");
            const newHistory = [...history];
            newHistory.pop(); 
            setHistory(newHistory);
        } else {
            console.error("Błąd zapisu:", e);
        }
    }
  }, [history]);

  // --- 3. MOTYW ---
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('lastoTheme', theme);
  }, [theme]);

  // --- FUNKCJE LOGICZNE ---

  const getSpeakerName = (item: HistoryItem, speakerKey: string): string => {
    const defaults: {[key: string]: string} = { "A": "Rozmówca A", "B": "Rozmówca B" };
    if (item.speakerNames && item.speakerNames[speakerKey] !== undefined) {
        return item.speakerNames[speakerKey];
    }
    return defaults[speakerKey] || `Rozmówca ${speakerKey}`;
  };

  const handleSpeakerNameChange = (speakerKey: string, newName: string) => {
    if (!selectedItem) return;

    const updatedItem = {
        ...selectedItem,
        speakerNames: {
            ...selectedItem.speakerNames,
            [speakerKey]: newName
        }
    };

    setHistory(prev => prev.map(item => item.id === selectedItem.id ? updatedItem : item));
    setSelectedItem(updatedItem);
  };

 // 1. Ta funkcja tylko otwiera okno z pytaniem
  const confirmDelete = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // 2. Ta funkcja faktycznie usuwa (podpięta pod przycisk "Usuń" w modalu)
  const executeDelete = () => {
    if (!itemToDelete) return;

    setHistory(prev => prev.filter(item => item.id !== itemToDelete));
    
    if (selectedItem?.id === itemToDelete) {
      setSelectedItem(null);
    }
    
    // Resetujemy stan i zamykamy okno
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const saveNewTitle = () => {
    if (!selectedItem || !editedTitle.trim()) { setIsEditingTitle(false); return; }
    const updatedItem = { ...selectedItem, title: editedTitle };
    setHistory(prev => prev.map(item => item.id === selectedItem.id ? updatedItem : item));
    setSelectedItem(updatedItem);
    setIsEditingTitle(false);
  };

  const checkStatus = async (id: string, fileName: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, { headers: { 'Authorization': apiKey } });
        if (!res.ok) return;
        const result = await res.json();

        if (result.status === 'completed') {
          clearInterval(interval);
          const newItem: HistoryItem = {
            id: id,
            title: fileName,
            date: new Date().toISOString(),
            content: result.text,
            utterances: result.utterances,
            speakerNames: { "A": "Rozmówca A", "B": "Rozmówca B" } 
          };
          setHistory(prev => {
             if (prev.some(item => item.id === newItem.id)) {
                 return prev;
             }
             return [newItem, ...prev];
          });
          setSelectedItem(newItem);
          setIsProcessing(false);
          setStatus('');
        } else if (result.status === 'error') {
          clearInterval(interval);
          setStatus('Błąd');
          setIsProcessing(false);
        }
      } catch (err) { clearInterval(interval); setIsProcessing(false); }
    }, 3000);
  };
  
  // --- NOWA LOGIKA UPLOADU (OBSŁUGUJE INPUT I DRAG & DROP) ---
  
  const processFile = async (file: File) => {
    if (!apiKey) {
        alert("Wprowadź najpierw klucz API w ustawieniach.");
        setIsSettingsOpen(true);
        return;
    }
    
    setIsProcessing(true);
    setStatus('Wysyłanie...');

    try {
      const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', { 
        method: 'POST', 
        headers: { 'Authorization': apiKey }, 
        body: file 
      });
      
      const { upload_url } = await uploadRes.json();
      
      setStatus('Przetwarzanie AI...');
      
      const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST', 
        headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_url: upload_url, language_code: 'pl', speaker_labels: true })
      });

      const { id } = await transcriptRes.json();
      checkStatus(id, file.name);
    } catch (e) { 
        setStatus('Błąd połączenia'); 
        setTimeout(() => setIsProcessing(false), 3000);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };


  const getDisplayText = (item: HistoryItem) => {
    if (!item.utterances || item.utterances.length === 0) return item.content;

    // Funkcja identyczna jak w Swift: isJunk(_ text: String, index: Int) -> Bool
    const isJunk = (text: string, index: number) => {
        const badWords = ["prosimy", "poczekać", "zawiesił", "połączenie", "kontynuować", "wkrótce", "rozmowę", "będziesz", "mógł", "oczekiwanie"];
        const lowerText = text.toLowerCase();

        // Zasada 1: Pierwsze 2 linie (index < 2) - usuń jeśli mają jakiekolwiek złe słowo
        if (index < 2) {
            return badWords.some(word => lowerText.includes(word));
        }

        // Zasada 2: Reszta linii - usuń jeśli mają 3 lub więcej złych słów (duże zagęszczenie)
        let hitCount = 0;
        badWords.forEach(word => {
            if (lowerText.includes(word)) hitCount++;
        });
        
        return hitCount >= 3;
    };

    // Filtrujemy i mapujemy
    return item.utterances
        .filter((u, index) => !isJunk(u.text, index)) // Usuń śmieci
        .map(u => {
            const speakerKey = (u.speaker === 'A' || u.speaker === '1') ? 'A' : 'B';
            const name = getSpeakerName(item, speakerKey);
            return `${name.toUpperCase()}:\n${u.text}\n`;
        })
        .join('\n');
  };

  return (
    <main className="flex h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden font-sans transition-colors duration-300">
      
      {/* SIDEBAR */}
      <div 
        className={`flex flex-col bg-gray-50/50 dark:bg-gray-900/50 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 ${isSidebarOpen ? 'w-80' : 'w-0'}`}
      >
        <div className={`flex flex-col h-full overflow-hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
          <div className="p-8 flex justify-between items-center whitespace-nowrap">
            <h2 onClick={() => setIsSidebarOpen(false)} className="text-2xl font-light tracking-tight cursor-pointer">Archiwum</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-300 hover:text-black dark:hover:text-white  cursor-pointer transition-colors">
              <RuneArrowLeft />
            </button>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto px-4 space-y-1">
            {history.map((item) => (
              <button 
                key={item.id}
                onClick={() => setSelectedItem(item)}
                // Dodano klasę 'group' i 'relative' do rodzica
                className={`w-full text-left p-4 rounded-xl transition-all relative group ${
                  selectedItem?.id === item.id ? 'bg-white dark:bg-gray-800 shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
                }`}
              >
                {/* PRZYCISK USUWANIA (X) - Widoczny po najechaniu (group-hover) */}
                <div 
                  onClick={(e) => { 
                    e.stopPropagation(); // Ważne! Żeby nie otwierało nagrania przy klikaniu w X
                   confirmDelete(item.id);
                  }}
                  className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all z-10"
                >
                  <CloseIcon /> 
                </div>

                <div className="font-medium truncate text-sm pr-6">{item.title}</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">
                  {new Date(item.date).toLocaleString('pl-PL', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GŁÓWNY PANEL */}
      <div className="flex-1 flex flex-col relative bg-white dark:bg-gray-950 min-w-0 transition-colors duration-300">
        
        {/* TOP BAR */}
        <div className="p-8 flex justify-between items-start z-10">
          <div className="flex items-center">
             {!isSidebarOpen && (
               <button onClick={() => setIsSidebarOpen(true)} className="text-gray-300 hover:text-black dark:hover:text-white mr-6 transition-colors cursor-pointer">
                 <RuneArrowRight />
               </button>
             )}
             {selectedItem && (
               <button onClick={() => setSelectedItem(null)} className="text-5xl font-thin tracking-tighter text-gray-900 dark:text-white transition-colors cursor-pointer">Lasto</button>
             )}
          </div>

          <div className="flex flex-col items-end space-y-2">
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
                    <span>Twórz</span>
                </div>
              </div>
              
             <div className="flex flex-col space-y-4 items-center pt-8 min-h-[100px]">
                {isProcessing ? (
                  /* 1. Co pokazać, gdy przycisk zniknie? (np. pulsujący tekst) */
                  <div className="flex flex-col items-center space-y-2 animate-in fade-in zoom-in duration-300">
                     <div className="w-6 h-6 border-2 border-gray-300 border-t-black dark:border-gray-700 dark:border-t-white rounded-full animate-spin"/>
                     <span className="text-xs uppercase tracking-[0.2em] text-gray-400 animate-pulse">Przetwarzanie...</span>
                  </div>
                ) : !apiKey ? (
                  /* NOWY STAN: BRAK KLUCZA -> PRZYCISK PROWADZĄCY DO USTAWIEŃ */
                  <div className="flex flex-col items-center space-y-4">
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="bg-black dark:bg-white dark:text-black text-white px-10 py-5 rounded-full transition-all hover:scale-105 shadow-xl font-medium animate-bounce-slow"
                    >
                        Dodaj pierwsze nagranie
                    </button>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400">
                        Wymagana konfiguracja
                    </p>
                  </div>
                ) : (
                  /* STAN NORMALNY: JEST KLUCZ -> PRZYCISK UPLOADU */
                  <>
                    <label 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`group relative cursor-pointer px-12 py-5 rounded-full transition-all shadow-xl flex flex-col items-center justify-center border-2 
                        ${isDragging 
                            ? 'bg-gray-800 text-white scale-110 border-white border-dashed' 
                            : 'bg-black dark:bg-white dark:text-black text-white border-transparent hover:scale-105 active:scale-95'
                        }`}
                    >
                      {isDragging ? 'Upuść tutaj!' : 'Importuj nagranie'}
                      <input type="file" className="hidden" accept="audio/*" onChange={handleFileInput} />
                    </label>
                    <p className="text-[10px] uppercase tracking-widest text-gray-300 dark:text-gray-600 mt-4">
                        {isDragging ? '...' : 'WAV • MP3 • M4A'}
                    </p>
                  </>
                )}
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
                  <div className="flex items-center w-full group">
                    
                    {/* NOWA IKONA ŚMIETNIKA PO LEWEJ */}
                    <button 
                     onClick={() => confirmDelete(selectedItem.id)}
                      className="mr-4 text-gray-300 hover:text-red-500 transition-colors p-2"
                      title="Usuń nagranie"
                    >
                      <TrashIcon />
                    </button>

                    <div className="flex items-center w-full cursor-pointer" onClick={() => { setEditedTitle(selectedItem.title); setIsEditingTitle(true); }}>
                        <h1 className="text-4xl font-thin tracking-tight truncate max-w-2xl dark:text-white">{selectedItem.title}</h1>
                        <span className="ml-4 opacity-30 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-300">
                        <EditIcon />
                        </span>
                    </div>
                  </div>
                )}
              </div>

              {/* POLA EDYCJI ROZMÓWCÓW */}
              <div className="flex space-x-4 animate-in fade-in duration-300">
                  <input 
                    className="flex-1 bg-gray-100 dark:bg-gray-900 dark:text-white border-none rounded-lg p-3 text-xs focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-gray-400" 
                    value={getSpeakerName(selectedItem, 'A')} 
                    onChange={(e) => handleSpeakerNameChange('A', e.target.value)} 
                    placeholder="Osoba A" 
                  />
                  <input 
                    className="flex-1 bg-gray-100 dark:bg-gray-900 dark:text-white border-none rounded-lg p-3 text-xs focus:ring-1 focus:ring-black dark:focus:ring-white placeholder-gray-400" 
                    value={getSpeakerName(selectedItem, 'B')} 
                    onChange={(e) => handleSpeakerNameChange('B', e.target.value)} 
                    placeholder="Osoba B" 
                  />
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
        {/* NOWA STOPKA (FOOTER) */}
        <div className="absolute bottom-6 right-8 text-[10px] text-gray-200 dark:text-gray-800 uppercase tracking-widest flex items-center space-x-3 pointer-events-none select-none z-0">
            <span className="italic font-serif">Lasto beth nîn</span>
            <span className="text-xs opacity-50">ᛟ</span>
            <span>developed by Kamil Gąszowski</span>
            <span className="text-xs opacity-50">ᛟ</span>
            <span>{new Date().getFullYear()}</span>
        </div>
      </div>

     {/* MODAL USTAWIEŃ */}
      {isSettingsOpen && (
        <div 
            className="fixed inset-0 bg-white/60 dark:bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-in fade-in duration-300"
            onClick={() => setIsSettingsOpen(false)}
        >
          <div 
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md space-y-8 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()} 
          >
            <button 
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-8 right-8 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
                <CloseIcon />
            </button>

            <h3 className="text-3xl font-thin text-center dark:text-white">Ustawienia</h3>
            
            <div className="space-y-8">
                {/* INSTRUKCJA DLA NOWYCH UŻYTKOWNIKÓW */}
                {!apiKey && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 text-sm space-y-3">
                        <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-500 font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                            </svg>
                            <span>Jak zacząć?</span>
                        </div>
                        <ol className="list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-1 leading-relaxed">
                            <li>Wejdź na stronę <a href="https://www.assemblyai.com/dashboard" target="_blank" className="underline text-black dark:text-white font-medium">AssemblyAI</a>.</li>
                            <li>Zarejestruj się (jest darmowe).</li>
                            <li>Skopiuj klucz z sekcji <b>API Keys</b>.</li>
                            <li>Wklej go w polu poniżej.</li>
                        </ol>
                    </div>
                )}

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                        Klucz API <a href="https://www.assemblyai.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-black dark:hover:text-white transition-colors">AssemblyAI</a>
                    </label>
                   <form 
                    className="space-y-3"
                    onSubmit={(e) => { e.preventDefault(); document.getElementById('save-btn')?.click(); }}
                >
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                        Klucz API <a href="https://www.assemblyai.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-black dark:hover:text-white transition-colors">AssemblyAI</a>
                    </label>
                    
                    {/* Trik dla menedżera haseł: Ukryte pole username */}
                    <input type="text" name="username" value="LastoUser" autoComplete="username" className="hidden" readOnly />

                    <div className="relative">
                        <input 
                            type="password" 
                            name="password" // Przeglądarka potraktuje to jako hasło
                            autoComplete="current-password"
                            className="w-full bg-gray-100 dark:bg-gray-800 dark:text-white border-none rounded-xl p-4 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all placeholder-gray-400 pr-10" 
                            value={apiKey} 
                            onChange={(e) => { setApiKey(e.target.value); localStorage.setItem('assemblyAIKey', e.target.value); }} 
                            placeholder="Wklej klucz..." 
                        />
                        {/* Ikona kłódki sugerująca bezpieczeństwo */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-[9px] text-gray-400 leading-tight">
                        Wskazówka: Zezwól przeglądarce na zapisanie tego klucza jako hasła, aby nie wpisywać go ponownie po czyszczeniu historii.
                    </p>
                </form>
                </div>

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

              
            </div>

<button 
                id="save-btn" // Dodane ID
                onClick={() => setIsSettingsOpen(false)} 
                className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
            >
                Gotowe
            </button>  
                    </div>
        </div>
      )}
      {/* MODAL POTWIERDZENIA USUWANIA */}
      {isDeleteModalOpen && (
        <div 
            className="fixed inset-0 bg-white/60 dark:bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-in fade-in duration-300"
            onClick={() => setIsDeleteModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-[2rem] shadow-2xl w-full max-w-sm space-y-6 text-center"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-500 mb-4">
               <TrashIcon />
            </div>
            
            <div className="space-y-2">
                <h3 className="text-xl font-medium dark:text-white">Usunąć nagranie?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tej operacji nie można cofnąć. Nagranie zostanie trwale usunięte z pamięci przeglądarki.
                </p>
            </div>

            <div className="flex space-x-3 pt-2">
                <button 
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                    Anuluj
                </button>
                <button 
                    onClick={executeDelete}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium shadow-lg shadow-red-600/20"
                >
                    Usuń
                </button>
            </div>
          </div>

       
        </div>
      )}
    </main>
  );
}