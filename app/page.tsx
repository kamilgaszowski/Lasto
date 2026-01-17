"use client";

import { useState, useEffect, useRef } from 'react';
import './lasto.css';

import { 
  RuneArrowLeft, RuneArrowRight, SettingsIcon, EditIcon, 
  CheckIcon, CloseIcon, TrashIcon, SunIcon, MoonIcon, InfoIcon,
  IconUpload, IconCopy 
} from './components/Icons';

// --- MODELE DANYCH ---
interface Utterance {
  speaker: string;
  text: string;
  [key: string]: any; 
}

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
  [key: string]: any;
}

// --- INDEXED DB UTILITIES ---
const DB_NAME = 'LastoDB';
const STORE_NAME = 'recordings';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  if (typeof window === 'undefined') return Promise.reject("Server side");
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const dbSave = async (item: HistoryItem) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const dbGetAll = async (): Promise<HistoryItem[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const dbDelete = async (id: string) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// --- KOMPRESJA DANYCH ---
const compressHistory = (history: HistoryItem[]) => {
    return history.map(item => ({
        id: item.id,
        ti: item.title,
        da: item.date,
        sn: item.speakerNames,
        u: item.utterances?.map(u => ({ s: u.speaker, t: u.text })) || [] 
    }));
};

const decompressHistory = (compressed: any[]): HistoryItem[] => {
    return compressed.map(item => {
        const utterances = item.u?.map((u: any) => ({ speaker: u.s, text: u.t })) || [];
        const content = utterances.map((u: any) => u.text).join('\n');
        return {
            id: item.id,
            title: item.ti,
            date: item.da,
            content: item.c || content,
            utterances: utterances,
            speakerNames: item.sn
        };
    });
};



export default function LastoWeb() {
  const [apiKey, setApiKey] = useState('');
  const [pantryId, setPantryId] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>(''); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Stany chwilowych zmian przycisków
  const [copyState, setCopyState] = useState(false);
  const [saveState, setSaveState] = useState(false);
  const [pobierzState, setPobierzState] = useState(false);
  const [wyslijState, setWyslijState] = useState(false);

  const deleteModalRef = useRef<HTMLDivElement>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const deleteAllModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setApiKey(localStorage.getItem('assemblyAIKey') || '');
    setPantryId(localStorage.getItem('pantryId') || '');
    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then((granted) => console.log("Storage persistent:", granted));
    }
    const initData = async () => {
        try {
            const oldHistoryRaw = localStorage.getItem('lastoHistory');
            if (oldHistoryRaw) {
                try {
                    const parsed = JSON.parse(oldHistoryRaw);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        for (const item of parsed) await dbSave(item);
                    }
                } catch(e) {}
                localStorage.removeItem('lastoHistory');
            }
            const items = await dbGetAll();
            const sorted = items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setHistory(sorted);
        } catch (e) { console.error("Błąd bazy danych:", e); }
    };
    initData();
    const savedTheme = localStorage.getItem('lastoTheme') as 'light' | 'dark' | null;
    if (savedTheme) setTheme(savedTheme);
    else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
  }, []);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('lastoTheme', theme);
  }, [theme]);

  useEffect(() => {
    if (isDeleteModalOpen) deleteModalRef.current?.focus();
    if (isDeleteAllModalOpen) deleteAllModalRef.current?.focus();
  }, [isDeleteModalOpen, isDeleteAllModalOpen]);

  // --- FUNKCJE LOGICZNE ---
  const getSpeakerName = (item: HistoryItem, speakerKey: string): string => {
    const defaults: {[key: string]: string} = { "A": "Rozmówca A", "B": "Rozmówca B" };
    if (item.speakerNames && item.speakerNames[speakerKey] !== undefined) return item.speakerNames[speakerKey];
    return defaults[speakerKey] || `Rozmówca ${speakerKey}`;
  };

  const handleSpeakerNameChange = async (speakerKey: string, newName: string) => {
    if (!selectedItem) return;
    const updatedItem = {
        ...selectedItem,
        speakerNames: { ...selectedItem.speakerNames, [speakerKey]: newName }
    };
    setHistory(prev => prev.map(item => item.id === selectedItem.id ? updatedItem : item));
    setSelectedItem(updatedItem);
    await dbSave(updatedItem);
  };

  const confirmDelete = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setIsProcessing(true);
    try {
        await dbDelete(itemToDelete);
        const updatedHistory = history.filter(item => item.id !== itemToDelete);
        setHistory(updatedHistory);
        if (selectedItem?.id === itemToDelete) setSelectedItem(null);
        setIsDeleteModalOpen(false);
        setItemToDelete(null);

        if (pantryId) {
            const compressed = compressHistory(updatedHistory);
            await fetch(`https://getpantry.cloud/apiv1/pantry/${pantryId.trim()}/basket/lastoHistory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    chunk_0: compressed.slice(0, 50),
                    manifest: { totalChunks: Math.ceil(compressed.length / 50), timestamp: Date.now() }
                })
            });
        }
    } catch (e) { console.error(e); } 
    finally { setIsProcessing(false); }
  };

  const executeDeleteAll = async () => {
    setIsProcessing(true);
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        setHistory([]);
        setSelectedItem(null);
        setIsDeleteAllModalOpen(false);

        if (pantryId) {
            await fetch(`https://getpantry.cloud/apiv1/pantry/${pantryId.trim()}/basket/lastoHistory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chunk_0: [], manifest: { totalChunks: 0, timestamp: Date.now() } })
            });
        }
        setInfoModal({ isOpen: true, title: 'Gotowe', message: 'Wszystkie nagrania zostały usunięte.' });
    } catch (e) { console.error(e); } 
    finally { setIsProcessing(false); }
  };

  const saveNewTitle = async () => {
    if (!selectedItem || !editedTitle.trim()) { setIsEditingTitle(false); return; }
    const updatedItem = { ...selectedItem, title: editedTitle };
    setHistory(prev => prev.map(item => item.id === selectedItem.id ? updatedItem : item));
    setSelectedItem(updatedItem);
    setIsEditingTitle(false);
    await dbSave(updatedItem);
  };

  // --- AUTOMATYKA PANTRY ---
  const saveToCloudWithData = async (dataToSave: HistoryItem[]) => {
    if (!pantryId) return;
    try {
        const compressed = compressHistory(dataToSave);
        await fetch(`https://getpantry.cloud/apiv1/pantry/${pantryId.trim()}/basket/lastoHistory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                chunk_0: compressed.slice(0, 50), 
                manifest: { totalChunks: Math.ceil(compressed.length / 50), timestamp: Date.now() } 
            })
        });
    } catch (e) { console.error("Auto-backup failed", e); }
  };

  // --- UPLOAD (ASSEMBLY AI) ---
const checkStatus = async (id: string, fileName: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, { 
          headers: { 'Authorization': apiKey } 
        });
        if (!res.ok) return;
        const result = await res.json();

        if (result.status === 'completed') {
          clearInterval(interval);
          
          // Tworzymy unikalne ID
          const uniqueId = `${id}-${Date.now()}`;

          const newItem: HistoryItem = {
            id: uniqueId, 
            title: fileName, 
            date: new Date().toISOString(), 
            content: result.text, 
            utterances: result.utterances, 
            speakerNames: { "A": "Rozmówca A", "B": "Rozmówca B" } 
          };
          
          await dbSave(newItem);

          // POPRAWKA: Strażnik przed duplikatami w stanie Reacta
          setHistory(prev => {
             // Sprawdzamy, czy nagranie o tym ID już istnieje w aktualnej liście (prev)
             // result.id to oryginalne ID z AssemblyAI, newItem.id to nasze unikalne
             // Ale dla pewności sprawdzamy oba warianty
             const exists = prev.some(item => item.id === uniqueId || item.id.startsWith(id));
             
             if (exists) return prev; // Jeśli już jest, nic nie zmieniaj

             const updated = [newItem, ...prev];
             // Backup w chmurze robimy tylko raz dla nowego elementu
             setTimeout(() => saveToCloudWithData(updated), 500);
             return updated;
          });

          setSelectedItem(newItem);
          setIsProcessing(false);
          setStatus('');
        } else if (result.status === 'error') { 
          clearInterval(interval); 
          setStatus('Błąd AI'); 
          setIsProcessing(false); 
        }
      } catch (err) { 
        clearInterval(interval); 
        setIsProcessing(false); 
      }
    }, 3000);
  };

  const processFile = async (file: File) => {
    if (!apiKey) return;
    setIsProcessing(true);
    setStatus('Wysyłanie...');
    try {
      const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', { method: 'POST', headers: { 'Authorization': apiKey }, body: file });
      const { upload_url } = await uploadRes.json();
      setStatus('Przetwarzanie AI...');
      const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST', headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_url: upload_url, language_code: 'pl', speaker_labels: true })
      });
      const { id } = await transcriptRes.json();
      checkStatus(id, file.name);
    } catch (e) { setStatus('Błąd połączenia'); setTimeout(() => setIsProcessing(false), 3000); }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && apiKey) processFile(file);
  };

  // --- MANUALNA SYNCHRONIZACJA ---
  const saveToCloud = async () => {
    if (!pantryId || !apiKey) {
        setInfoModal({ isOpen: true, title: 'Brak kluczy', message: 'Upewnij się, że wpisałeś oba klucze w ustawieniach.' });
        return;
    }
    setIsProcessing(true);
    try {
        const compressedHistory = compressHistory(history);
        const CHUNK_SIZE = 50;
        for (let i = 0; i < compressedHistory.length; i += CHUNK_SIZE) {
            await fetch(`https://getpantry.cloud/apiv1/pantry/${pantryId.trim()}/basket/lastoHistory`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [`chunk_${Math.floor(i/CHUNK_SIZE)}`]: compressedHistory.slice(i, i + CHUNK_SIZE), manifest: { totalChunks: Math.ceil(compressedHistory.length/CHUNK_SIZE), timestamp: Date.now() } })
            });
        }
        
        // Zmiana stanów przycisków
        setWyslijState(true);
        setSaveState(true);
        setTimeout(() => {
            setWyslijState(false);
            setSaveState(false);
        }, 2000);

    } catch (e: any) { 
        setInfoModal({ isOpen: true, title: 'Błąd', message: e.message }); 
    }
    finally { setIsProcessing(false); }
  };

  const loadFromCloud = async () => {
    if (!pantryId) return;
    setIsProcessing(true);
    try {
        const res = await fetch(`https://getpantry.cloud/apiv1/pantry/${pantryId.trim()}/basket/lastoHistory`, { method: 'GET' });
        if (!res.ok) throw new Error("Nie znaleziono danych.");
        const data = await res.json();
        let remoteCompressed: any[] = [];
        if (data.manifest) {
            for (let i = 0; i < data.manifest.totalChunks; i++) {
                if (data[`chunk_${i}`]) remoteCompressed = [...remoteCompressed, ...data[`chunk_${i}`]];
            }
        }
        if (remoteCompressed.length > 0) {
             const remoteHistory = decompressHistory(remoteCompressed);
             setHistory(prev => {
                const newItems = remoteHistory.filter(r => !prev.some(l => l.id === r.id));
                
                setPobierzState(true);
                setTimeout(() => setPobierzState(false), 2000);

                if (newItems.length === 0) return prev; 

                newItems.forEach(async (item) => await dbSave(item));
                return [...newItems, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
            setIsSettingsOpen(false);
        }
    } catch (e: any) { setInfoModal({ isOpen: true, title: 'Błąd', message: e.message }); }
    finally { setIsProcessing(false); }
  };

  // --- OBSŁUGA DYSKU ---
  const exportKeys = () => {
    const keys = { assemblyAIKey: apiKey, pantryId: pantryId };
    const blob = new Blob([JSON.stringify(keys, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `lasto_keys_backup.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importKeys = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported.assemblyAIKey || imported.pantryId) {
          if (imported.assemblyAIKey) { setApiKey(imported.assemblyAIKey); localStorage.setItem('assemblyAIKey', imported.assemblyAIKey); }
          if (imported.pantryId) { setPantryId(imported.pantryId); localStorage.setItem('pantryId', imported.pantryId); }
          setInfoModal({ isOpen: true, title: 'Sukces', message: 'Klucze zostały zaimportowane.' });
        }
      } catch (err) { setInfoModal({ isOpen: true, title: 'Błąd', message: 'Nieprawidłowy format pliku.' }); }
    };
    reader.readAsText(file);
  };

  const saveToDisk = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `lasto_backup_${new Date().toISOString().slice(0,10)}.json`;
    link.href = url;
    link.click();
  };

  const loadFromDisk = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target?.result as string);
            if (Array.isArray(imported)) {
                for (const item of imported) await dbSave(item);
                setHistory(prev => {
                    const combined = [...imported, ...prev];
                    const unique = combined.filter((item, index, self) => index === self.findIndex((t) => t.id === item.id));
                    return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                });
                setIsSettingsOpen(false);
                setInfoModal({ isOpen: true, title: 'Sukces', message: 'Wczytano backup.' });
            }
        } catch (err) { setInfoModal({ isOpen: true, title: 'Błąd', message: "Zły format pliku." }); }
    };
    reader.readAsText(file);
  };

  const getDisplayText = (item: HistoryItem) => {
    if (!item.utterances || item.utterances.length === 0) return item.content;
    const isJunk = (text: string, index: number) => {
        const badWords = ["prosimy", "poczekać", "zawiesił", "połączenie", "kontynuować", "wkrótce", "rozmowę", "będziesz", "mógł", "oczekiwanie"];
        const lowerText = text.toLowerCase();
        if (index < 2) return badWords.some(word => lowerText.includes(word));
        let hitCount = 0;
        badWords.forEach(word => { if (lowerText.includes(word)) hitCount++; });
        return hitCount >= 3;
    };
    return item.utterances.filter((u, index) => !isJunk(u.text, index)).map(u => {
        const speakerKey = (u.speaker === 'A' || u.speaker === '1') ? 'A' : 'B';
        return `${getSpeakerName(item, speakerKey).toUpperCase()}:\n${u.text}\n`;
    }).join('\n');
  };

  const copyToClipboard = () => {
    if (!selectedItem) return;
    navigator.clipboard.writeText(getDisplayText(selectedItem));
    setCopyState(true);
    setTimeout(() => setCopyState(false), 2000);
  };

  return (
    <main className="flex h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden font-sans transition-colors duration-300">
      
    {/* SIDEBAR */}
<div className={`lasto-sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
  <div className="sidebar-content">
    
    <div className="sidebar-header">
      <h2 onClick={() => setIsSidebarOpen(false)} className="text-2xl font-light tracking-tight cursor-pointer">
        Archiwum
      </h2>
      <button onClick={() => setIsSidebarOpen(false)} className="text-gray-300 hover:text-black dark:hover:text-white cursor-pointer transition-colors">
        <RuneArrowLeft />
      </button>
    </div>

    <div className="sidebar-actions-grid">
        <button 
          onClick={loadFromCloud} 
          disabled={!pantryId || isProcessing} 
          className={`btn-action-base ${pobierzState ? 'btn-status-success' : 'btn-pobierz'}`}
        >
          {!pobierzState && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>}
          <span>{pobierzState ? 'Pobrano' : 'Pobierz'}</span>
        </button>

        <button 
          onClick={saveToCloud} 
          disabled={!pantryId || isProcessing} 
          className={`btn-action-base ${wyslijState ? 'btn-status-success' : 'btn-wyslij'}`}
        >
          {!wyslijState && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>}
          <span>{wyslijState ? 'Wysłano' : 'Wyślij'}</span>
        </button>
    </div>

    <div className="archive-list">
      {history.map((item) => (
        <button 
          key={item.id} 
          onClick={() => { 
            setSelectedItem(item);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }} 
          className={`archive-item ${selectedItem?.id === item.id ? 'archive-item-active' : ''}`}
        >
          <div 
            onClick={(e) => { e.stopPropagation(); confirmDelete(item.id); }} 
            className="archive-delete-btn"
          >
            <CloseIcon />
          </div>
          <div className="archive-item-title">{item.title}</div>
          <div className="archive-item-date">
            {new Date(item.date).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </button>
      ))}
    </div>

    {history.length > 0 && (
      <div className="sidebar-footer">
          <button onClick={() => setIsDeleteAllModalOpen(true)} className="btn-clear-archive">
            <TrashIcon />
            <span>Wyczyść Archiwum</span>
          </button>
      </div>
    )}
  </div>
</div>

// --- SEKCJA GŁÓWNY PANEL START ---
<div className={`lasto-main-panel ${isSidebarOpen ? 'panel-shifted' : ''}`}>
  
  {/* PASEK GÓRNY */}
  <div className="top-bar">
    <div className="top-bar-left">
      {!isSidebarOpen && (
        <button onClick={() => setIsSidebarOpen(true)} className="icon-button">
          <RuneArrowRight />
        </button>
      )}
      {selectedItem && (
        <button onClick={() => setSelectedItem(null)} className="btn-logo">
          Lasto
        </button>
      )}
    </div>
    <button onClick={() => setIsSettingsOpen(true)} className="settings-trigger">
      <SettingsIcon />
    </button>
  </div>

  {/* OBSZAR ROBOCZY */}
  <div className="workspace-area">
    {!selectedItem ? (
      /* EKRAN POWITALNY (HERO) */
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-title">Lasto</div>
          <div className="hero-subtitle">
            <span>Słuchaj</span> <span className="rune-divider">ᛟ</span>
            <span>Nagraj</span> <span className="rune-divider">ᛟ</span>
            <span>Pisz</span>
          </div>
        </div>

        <div className="import-zone">
          {isProcessing ? (
            <div className="loader-container">
              <div className="loader-spin" />
              <span className="loader-text">
                {uploadStatus || status || 'Przetwarzanie...'}
              </span>
            </div>
          ) : !apiKey ? (
            <button onClick={() => setIsSettingsOpen(true)} className="btn-primary">
              Dodaj pierwsze nagranie
            </button>
          ) : (
            <>
              <label 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} 
                onDragLeave={() => setIsDragging(false)} 
                onDrop={handleDrop} 
                className={`btn-import ${isDragging ? 'import-dragging' : ''}`}
              >
                {isDragging ? 'Upuść tutaj!' : 'Importuj nagranie'}
                <input type="file" className="hidden" accept="audio/*" onChange={handleFileInput} />
              </label>
              <p className="format-hint">WAV • MP3 • M4A</p>
            </>
          )}
        </div>
      </div>
    ) : (
      /* EDYTOR TRANSKRYPCJI */
      <div className="editor-container">
        <div className="editor-header">
          {isEditingTitle ? (
            <div className="title-edit-mode">
              <input 
                className="title-input" 
                value={editedTitle} 
                onChange={(e) => setEditedTitle(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && saveNewTitle()} 
                autoFocus 
              />
              <button onClick={saveNewTitle} className="btn-confirm"><CheckIcon /></button>
            </div>
          ) : (
            <div className="title-view-mode">
              <button onClick={() => confirmDelete(selectedItem.id)} className="btn-delete-record">
                <TrashIcon />
              </button>
              <div className="title-clickable" onClick={() => { setEditedTitle(selectedItem.title); setIsEditingTitle(true); }}>
                <h1 className="title-text">{selectedItem.title}</h1>
                <span className="edit-indicator"><EditIcon /></span>
              </div>
              <button 
                onClick={saveToCloud} 
                disabled={!pantryId || isProcessing} 
                className={`btn-save-cloud ${saveState ? 'btn-status-success' : ''}`}
              >
                {isProcessing ? <div className="loader-spin-xs" /> : !saveState && <IconUpload />}
                <span>{saveState ? 'Zapisano' : 'Zapisz'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="speaker-names-grid">
          <input className="speaker-field" value={getSpeakerName(selectedItem, 'A')} onChange={(e) => handleSpeakerNameChange('A', e.target.value)} placeholder="Osoba A" />
          <input className="speaker-field" value={getSpeakerName(selectedItem, 'B')} onChange={(e) => handleSpeakerNameChange('B', e.target.value)} placeholder="Osoba B" />
        </div>

        <textarea className="transcript-editor" value={getDisplayText(selectedItem)} readOnly />

        <div className="editor-footer">
          <button onClick={copyToClipboard} className={`btn-copy ${copyState ? 'btn-status-success' : ''}`}>
            {!copyState && <IconCopy />}
            <span>{copyState ? 'Skopiowano' : 'Kopiuj tekst'}</span>
          </button>
        </div>
      </div>
    )}
  </div>

  {/* STOPKA PODPISU */}
  <div className="main-footer">
    <div className="auto-save-indicator">
      <div className="status-dot"></div>
      <span>Auto-save on (DB)</span>
    </div>
    <div className="footer-signature">
      <span className="italic">Lasto beth nîn</span>
      <span className="rune-divider">ᛟ</span>
      <span>developed by Kamil Gąszowski</span>
      <span className="rune-divider">ᛟ</span>
      <span>{new Date().getFullYear()}</span>
    </div>
  </div>
</div>
// --- SEKCJA GŁÓWNY PANEL END ---
      {/* MODAL USTAWIEŃ */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-white/60 dark:bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-in fade-in duration-300" onClick={() => setIsSettingsOpen(false)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden relative max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-6 right-8 text-gray-400 hover:text-black dark:hover:text-white transition-colors z-10"><CloseIcon /></button>
            <div className="w-full md:w-1/2 bg-gray-50/50 dark:bg-gray-800/30 p-12 border-r border-gray-100 dark:border-gray-800 overflow-y-auto">
                <h3 className="text-3xl font-light tracking-tight mb-10 dark:text-white">Przewodnik konfiguracji</h3>
                <div className="space-y-12">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4 text-indigo-600 dark:text-indigo-400">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-current text-sm font-bold">1</span>
                            <h4 className="font-bold uppercase tracking-widest text-xs">Transkrypcja (AssemblyAI)</h4>
                        </div>
                        <div className="pl-12 space-y-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                            <p>Klucz API pozwala SI zamienić Twoje nagrania na tekst.</p>
                            <ul className="list-disc space-y-3 pl-4 font-medium">
                                <li>Zarejestruj się na <a href="https://www.assemblyai.com/" target="_blank" className="underline text-indigo-600">assemblyai.com</a></li>
                                <li>Wejdź do <span className="text-black dark:text-white">Dashboard</span> i skopiuj <span className="text-black dark:text-white">Your API Key</span></li>
                            </ul>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4 text-indigo-600 dark:text-indigo-400">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-current text-sm font-bold">2</span>
                            <h4 className="font-bold uppercase tracking-widest text-xs">Synchronizacja (Pantry)</h4>
                        </div>
                        <div className="pl-12 space-y-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                            <p>Pantry ID chroni historię przed wyczyszczeniem danych przeglądarki.</p>
                            <ul className="list-disc space-y-3 pl-4 font-medium">
                                <li>Wejdź na <a href="https://getpantry.cloud/" target="_blank" className="underline text-indigo-600">getpantry.cloud</a></li>
                                <li>ID znajdziesz w Dashboardzie po stworzeniu nowej Spiżarni.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full md:w-1/2 p-12 overflow-y-auto space-y-12">
                <h3 className="text-3xl font-thin text-center dark:text-white">Ustawienia</h3>
                <div className="space-y-12">
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-1">Wygląd</label>
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
                            <button onClick={() => setTheme('light')} className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl text-xs font-medium transition-all ${theme === 'light' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}><SunIcon /><span>Jasny</span></button>
                            <button onClick={() => setTheme('dark')} className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl text-xs font-medium transition-all ${theme === 'dark' ? 'bg-gray-700 shadow-sm text-white' : 'text-gray-400'}`}><MoonIcon /><span>Ciemny</span></button>
                        </div>
                    </div>
                    <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); setIsSettingsOpen(false); }}>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-gray-500 uppercase ml-1">AssemblyAI Key</label>
                                <input type="password" name="assembly-key" autoComplete="current-password" className="w-full bg-gray-50 dark:bg-gray-800 dark:text-white border border-gray-100 dark:border-gray-700 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-black transition-all" value={apiKey} onChange={(e) => { setApiKey(e.target.value); localStorage.setItem('assemblyAIKey', e.target.value); }} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-gray-500 uppercase ml-1">Pantry ID</label>
                                <input type="text" name="username" value="LastoUser" autoComplete="username" className="hidden" readOnly />
                                <input type="password" name="password" autoComplete="current-password" className="w-full bg-gray-50 dark:bg-gray-800 dark:text-white border border-gray-100 dark:border-gray-700 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-black transition-all" value={pantryId} onChange={(e) => { setPantryId(e.target.value); localStorage.setItem('pantryId', e.target.value); }} />
                            </div>
                        </div>
                    </form>
                    <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-1">Backup kluczy</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={exportKeys} className="px-4 py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-black transition-all text-[10px] font-bold uppercase tracking-wider">Zapisz do pliku</button>
                            <label className="px-4 py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-black transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer text-center">Wczytaj plik<input type="file" className="hidden" accept=".json" onChange={importKeys} /></label>
                        </div>
                    </div>
                    <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-[1.5rem] font-bold text-sm shadow-xl active:scale-[0.98]">Gotowe</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL USUWANIA JEDNEGO */}
      {isDeleteModalOpen && (
        <div ref={deleteModalRef} className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-6 outline-none" onClick={() => setIsDeleteModalOpen(false)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); executeDelete(); } if (e.key === 'Escape') setIsDeleteModalOpen(false); }} tabIndex={-1}>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-[2rem] shadow-2xl w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-500 mb-4"><TrashIcon /></div>
            <div className="space-y-2"><h3 className="text-xl font-medium dark:text-white">Usunąć nagranie?</h3><p className="text-sm text-gray-500 dark:text-gray-400">Tej operacji nie można cofnąć.</p></div>
            <div className="flex space-x-3 pt-2"><button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors text-sm font-medium">Anuluj</button><button onClick={executeDelete} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium shadow-lg shadow-red-600/20">Usuń (Enter)</button></div>
          </div>
        </div>
      )}

      {/* MODAL USUWANIA WSZYSTKIEGO */}
      {isDeleteAllModalOpen && (
        <div ref={deleteAllModalRef} className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60] p-6 outline-none" onClick={() => setIsDeleteAllModalOpen(false)} onKeyDown={(e) => { if (e.key === 'Enter') executeDeleteAll(); if (e.key === 'Escape') setIsDeleteAllModalOpen(false); }} tabIndex={-1}>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-[2rem] shadow-2xl w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white mb-4 animate-pulse"><TrashIcon /></div>
            <div className="space-y-2"><h3 className="text-xl font-bold dark:text-white">Usunąć wszystko?</h3><p className="text-sm text-gray-500 dark:text-gray-400">Stracisz bezpowrotnie wszystkie nagrania lokalne i w chmurze Pantry.</p></div>
            <div className="flex flex-col space-y-2 pt-4"><button onClick={executeDeleteAll} className="w-full py-4 rounded-xl bg-red-600 text-white font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors text-sm">Tak, usuń wszystko (Enter)</button><button onClick={() => setIsDeleteAllModalOpen(false)} className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs font-medium">Anuluj (Esc)</button></div>
          </div>
        </div>
      )}

      {/* MODAL INFORMACYJNY */}
      {infoModal.isOpen && (
        <div className="fixed inset-0 bg-white/60 dark:bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-in fade-in duration-300" onClick={() => setInfoModal({ ...infoModal, isOpen: false })}>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-[2rem] shadow-2xl w-full max-w-sm space-y-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-900 dark:text-white mb-4"><InfoIcon /></div>
            <div className="space-y-2"><h3 className="text-xl font-medium dark:text-white">{infoModal.title}</h3><p className="text-sm text-gray-500 dark:text-gray-400">{infoModal.message}</p></div>
            <div className="pt-2"><button onClick={() => setInfoModal({ ...infoModal, isOpen: false })} className="w-full px-4 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 transition-colors text-sm font-medium">OK</button></div>
          </div>
        </div>
      )}
    </main>
  );
}