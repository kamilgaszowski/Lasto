"use client";

import { useState, useEffect } from 'react';
import './lasto.css';

// --- MODELE DANYCH ---
interface Utterance {
  speaker: string;
  text: string;
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
    tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const dbGetAll = async (): Promise<HistoryItem[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const dbDelete = async (id: string) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// --- KOMPRESJA DANYCH (DLA PANTRY) ---
const compressHistory = (history: HistoryItem[]) => {
    return history.map(item => ({
        id: item.id, ti: item.title, da: item.date, sn: item.speakerNames,
        u: item.utterances?.map(u => ({ s: u.speaker, t: u.text })) || [] 
    }));
};

const decompressHistory = (compressed: any[]): HistoryItem[] => {
    return compressed.map(item => {
        const utterances = item.u?.map((u: any) => ({ speaker: u.s, text: u.t })) || [];
        return {
            id: item.id, title: item.ti, date: item.da,
            content: utterances.map((u: any) => u.text).join('\n'),
            utterances, speakerNames: item.sn
        };
    });
};

// --- IKONY (SVG KOMPONENTY) ---
const IconDownload = () => <svg className="icon-small icon-stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
const IconUpload = () => <svg className="icon-small icon-stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;
const RuneArrowLeft = () => <svg className="icon-medium" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 4l-10 8 10 8" /></svg>;
const RuneArrowRight = () => <svg className="icon-medium" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 4l10 8-10 8" /></svg>;
const TrashIcon = () => <svg className="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const CheckIcon = () => <svg className="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M4.5 12.75l6 6 9-13.5" /></svg>;
const CloseIcon = () => <svg className="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M6 18L18 6M6 6l12 12" /></svg>;
const SettingsIcon = () => <svg className="icon-large" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.1"><path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378.138.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const EditIcon = () => <svg className="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>;

export default function LastoWeb() {
  // --- STANY DANYCH ---
  const [apiKey, setApiKey] = useState('');
  const [pantryId, setPantryId] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  // --- STANY UI ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // --- STANY EDYCJI ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  // --- FEEDBACK BUTTONS ---
  const [copyState, setCopyState] = useState(false);
  const [saveState, setSaveState] = useState(false);
  const [pobierzState, setPobierzState] = useState(false);
  const [wyslijState, setWyslijState] = useState(false);

  // --- INICJALIZACJA ---
  useEffect(() => {
    setApiKey(localStorage.getItem('assemblyAIKey') || '');
    setPantryId(localStorage.getItem('pantryId') || '');
    const initData = async () => {
        try {
            const items = await dbGetAll();
            setHistory(items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (e) { console.error("IndexedDB load error", e); }
    };
    initData();
    const savedTheme = localStorage.getItem('lastoTheme') as 'light' | 'dark' | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('lastoTheme', theme);
  }, [theme]);

  // --- LOGIKA BIZNESOWA ---
  const getSpeakerName = (item: HistoryItem, speakerKey: string): string => {
    return item.speakerNames?.[speakerKey] || (speakerKey === "A" ? "Rozmówca A" : "Rozmówca B");
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

  const saveNewTitle = async () => {
    if (!selectedItem || !editedTitle.trim()) { setIsEditingTitle(false); return; }
    const updatedItem = { ...selectedItem, title: editedTitle };
    setHistory(prev => prev.map(item => item.id === selectedItem.id ? updatedItem : item));
    setSelectedItem(updatedItem);
    setIsEditingTitle(false);
    await dbSave(updatedItem);
  };

  const confirmDelete = (id: string) => { setItemToDelete(id); setIsDeleteModalOpen(true); };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    await dbDelete(itemToDelete);
    const updatedHistory = history.filter(item => item.id !== itemToDelete);
    setHistory(updatedHistory);
    if (selectedItem?.id === itemToDelete) setSelectedItem(null);
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  // --- PANTRY CLOUD ---
  const saveToCloudWithData = async (dataToSave: HistoryItem[]) => {
    if (!pantryId) return;
    try {
        const compressed = compressHistory(dataToSave);
        await fetch(`https://getpantry.cloud/apiv1/pantry/${pantryId.trim()}/basket/lastoHistory`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                chunk_0: compressed.slice(0, 50), 
                manifest: { totalChunks: Math.ceil(compressed.length / 50), timestamp: Date.now() } 
            })
        });
    } catch (e) { console.error("Cloud Save Error", e); }
  };

  const saveToCloud = async () => {
    if (!pantryId) return;
    setIsProcessing(true);
    try {
        await saveToCloudWithData(history);
        setWyslijState(true); setSaveState(true);
        setTimeout(() => { setWyslijState(false); setSaveState(false); }, 2000);
    } finally { setIsProcessing(false); }
  };

  const loadFromCloud = async () => {
    if (!pantryId) return;
    setIsProcessing(true);
    try {
        const res = await fetch(`https://getpantry.cloud/apiv1/pantry/${pantryId.trim()}/basket/lastoHistory`);
        if (!res.ok) throw new Error("Cloud empty");
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
                newItems.forEach(async (item) => await dbSave(item));
                setPobierzState(true); setTimeout(() => setPobierzState(false), 2000);
                return [...newItems, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
        }
    } catch (e) { console.error("Cloud load error", e); } finally { setIsProcessing(false); }
  };

  // --- TRANSKRYPCJA (ASSEMBLY AI) ---
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
          const uniqueId = `${id}-${Date.now()}`;
          const newItem: HistoryItem = {
            id: uniqueId, title: fileName, date: new Date().toISOString(), content: result.text, 
            utterances: result.utterances, speakerNames: { "A": "Rozmówca A", "B": "Rozmówca B" } 
          };
          await dbSave(newItem);
          setHistory(prev => {
             if (prev.some(item => item.id.startsWith(id))) return prev;
             const updated = [newItem, ...prev];
             setTimeout(() => saveToCloudWithData(updated), 500);
             return updated;
          });
          setSelectedItem(newItem);
          setIsProcessing(false); setStatus('');
        }
      } catch (err) { clearInterval(interval); setIsProcessing(false); }
    }, 3000);
  };
  
  const processFile = async (file: File) => {
    if (!apiKey) return;
    setIsProcessing(true); setStatus('Wysyłanie...');
    try {
      const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', { 
        method: 'POST', headers: { 'Authorization': apiKey }, body: file 
      });
      const { upload_url } = await uploadRes.json();
      setStatus('Przetwarzanie AI...');
      const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST', headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_url: upload_url, language_code: 'pl', speaker_labels: true })
      });
      const { id } = await transcriptRes.json();
      checkStatus(id, file.name);
    } catch (e) { setStatus('Błąd'); setTimeout(() => setIsProcessing(false), 3000); }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) processFile(e.target.files[0]); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]); };

  const getDisplayText = (item: HistoryItem) => {
    if (!item.utterances || item.utterances.length === 0) return item.content;
    return item.utterances.map(u => {
        const speakerKey = (u.speaker === 'A' || u.speaker === '1') ? 'A' : 'B';
        return `${getSpeakerName(item, speakerKey).toUpperCase()}:\n${u.text}\n`;
    }).join('\n');
  };

  const copyToClipboard = () => {
    if (!selectedItem) return;
    navigator.clipboard.writeText(getDisplayText(selectedItem));
    setCopyState(true); setTimeout(() => setCopyState(false), 2000);
  };

  return (
    <main className="flex h-screen overflow-hidden">
      
      {/* SIDEBAR */}
      <div className={`lasto-sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <h2 onClick={() => setIsSidebarOpen(false)}>Archiwum</h2>
            <button onClick={() => setIsSidebarOpen(false)}><RuneArrowLeft /></button>
          </div>

          <div className="sidebar-actions-grid">
              <button onClick={loadFromCloud} disabled={!pantryId || isProcessing} className={`btn-action-base ${pobierzState ? 'btn-status-success' : 'btn-pobierz'}`}>
                {!pobierzState && <IconDownload />}
                <span>{pobierzState ? 'Pobrano' : 'Pobierz'}</span>
              </button>
              <button onClick={saveToCloud} disabled={!pantryId || isProcessing} className={`btn-action-base ${wyslijState ? 'btn-status-success' : 'btn-wyslij'}`}>
                {!wyslijState && <IconUpload />}
                <span>{wyslijState ? 'Wysłano' : 'Wyślij'}</span>
              </button>
          </div>

          <div className="archive-list">
            {history.map((item) => (
              <button 
                key={item.id} 
                onClick={() => { setSelectedItem(item); if (window.innerWidth < 768) setIsSidebarOpen(false); }} 
                className={`archive-item ${selectedItem?.id === item.id ? 'archive-item-active' : ''}`}
              >
                <div onClick={(e) => { e.stopPropagation(); confirmDelete(item.id); }} className="archive-delete-btn"><CloseIcon /></div>
                <div className="archive-item-title">{item.title}</div>
                <div className="archive-item-date">{new Date(item.date).toLocaleDateString()}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GŁÓWNY PANEL */}
      <div className={`lasto-main-panel ${isSidebarOpen ? 'panel-shifted' : ''}`}>
        <div className="top-bar">
          <div className="flex items-center space-x-6">
             {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="text-gray-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"><RuneArrowRight /></button>}
             {selectedItem && <button onClick={() => setSelectedItem(null)} className="btn-logo">Lasto</button>}
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="text-gray-300 hover:text-black dark:hover:text-white transition-transform hover:rotate-12 duration-300"><SettingsIcon /></button>
        </div>

        <div className="workspace-area">
          {!selectedItem ? (
            <div className="hero-container">
              <div className="hero-title">Lasto</div>
              <div className="hero-subtitle"><span>Słuchaj</span> <span>ᛟ</span> <span>Nagraj</span> <span>ᛟ</span> <span>Pisz</span></div>
              <div className="import-zone">
                {isProcessing ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="loader-spin" />
                    <span className="text-[10px] uppercase tracking-widest text-gray-400">{status}</span>
                  </div>
                ) : (
                  <label className={`btn-import ${isDragging ? 'btn-import-dragging' : ''}`} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}>
                    <input type="file" className="hidden" accept="audio/*" onChange={handleFileInput} />
                    {isDragging ? 'Upuść tutaj!' : 'Importuj nagranie'}
                  </label>
                )}
              </div>
            </div>
          ) : (
            <div className="editor-container">
              <div className="editor-header">
                {isEditingTitle ? (
                  <div className="flex items-center w-full space-x-4">
                    <input className="speaker-input text-xl md:text-2xl" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveNewTitle()} autoFocus />
                    <button onClick={saveNewTitle} className="text-green-600"><CheckIcon /></button>
                  </div>
                ) : (
                  <div className="flex items-center w-full group relative">
                    <button onClick={() => confirmDelete(selectedItem.id)} className="mr-4 text-gray-300 hover:text-red-500"><TrashIcon /></button>
                    <div className="flex items-center flex-1 cursor-pointer overflow-hidden" onClick={() => { setEditedTitle(selectedItem.title); setIsEditingTitle(true); }}>
                        <h1 className="title-display">{selectedItem.title}</h1>
                        <span className="ml-4 opacity-30 hover:opacity-100 transition-all"><EditIcon /></span>
                    </div>
                    <button onClick={saveToCloud} className={`btn-save-cloud ${saveState ? 'btn-status-success' : 'btn-pobierz'}`}>
                        <span>{saveState ? 'Zapisano' : 'Zapisz'}</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="speaker-grid">
                  <div className="speaker-field">
                    <label className="speaker-label">Osoba A</label>
                    <input className="speaker-input" value={getSpeakerName(selectedItem, 'A')} onChange={(e) => handleSpeakerNameChange('A', e.target.value)} />
                  </div>
                  <div className="speaker-field">
                    <label className="speaker-label">Osoba B</label>
                    <input className="speaker-input" value={getSpeakerName(selectedItem, 'B')} onChange={(e) => handleSpeakerNameChange('B', e.target.value)} />
                  </div>
              </div>
              <textarea className="transcript-area" value={getDisplayText(selectedItem)} readOnly />
              <div className="flex justify-end pt-2">
                <button onClick={copyToClipboard} className={`btn-copy ${copyState ? 'btn-status-success' : ''}`}>
                    <span>{copyState ? 'Skopiowano' : 'Kopiuj tekst'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="footer-credits">
            <div className="flex items-center space-x-1.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div><span className="text-[9px] uppercase tracking-widest text-gray-400">Auto-save on</span></div>
            <div className="text-[10px] uppercase tracking-widest hidden md:block text-gray-400">Lasto beth nîn ᛟ {new Date().getFullYear()}</div>
        </div>
      </div>

      {/* MODAL USUWANIA */}
      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-medium mb-4 dark:text-white">Usunąć nagranie?</h3>
            <div className="flex space-x-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="btn-action-base btn-wyslij py-3">Anuluj</button>
              <button onClick={executeDelete} className="btn-action-base bg-red-600 text-white py-3">Usuń</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL USTAWIEŃ */}
      {isSettingsOpen && (
        <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-6 right-8 text-gray-400"><CloseIcon /></button>
            <h3 className="text-3xl font-thin text-center mb-8 dark:text-white">Ustawienia</h3>
            <div className="space-y-6">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                  <button onClick={() => setTheme('light')} className={`flex-1 py-2 rounded-lg text-xs ${theme === 'light' ? 'bg-white shadow text-black' : 'text-gray-400'}`}>Jasny</button>
                  <button onClick={() => setTheme('dark')} className={`flex-1 py-2 rounded-lg text-xs ${theme === 'dark' ? 'bg-gray-700 shadow text-white' : 'text-gray-400'}`}>Ciemny</button>
                </div>
                <div className="text-left space-y-2">
                  <label className="speaker-label">AssemblyAI Key</label>
                  <input type="password" className="speaker-input" value={apiKey} onChange={(e) => { setApiKey(e.target.value); localStorage.setItem('assemblyAIKey', e.target.value); }} />
                </div>
                <div className="text-left space-y-2">
                  <label className="speaker-label">Pantry ID</label>
                  <input type="password" className="speaker-input" value={pantryId} onChange={(e) => { setPantryId(e.target.value); localStorage.setItem('pantryId', e.target.value); }} />
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="btn-action-base btn-status-success py-4 w-full">Gotowe</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}