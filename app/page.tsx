"use client";

import { useState, useEffect, useRef } from 'react';

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

// --- IKONY ---
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

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
);

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
          
          // POPRAWKA: Tworzymy unikalne ID łącząc ID z AssemblyAI i aktualnym czasem
          // Zapobiegnie to duplikatom, które "sklejają" się w UI
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
          setHistory(prev => {
             const updated = [newItem, ...prev];
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
      <div className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-gray-50/95 dark:bg-gray-900/95 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-80 -translate-x-full'}`}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-8 pb-4 flex justify-between items-center whitespace-nowrap">
            <h2 onClick={() => setIsSidebarOpen(false)} className="text-2xl font-light tracking-tight cursor-pointer">Archiwum</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-300 hover:text-black dark:hover:text-white cursor-pointer transition-colors"><RuneArrowLeft /></button>
          </div>

          <div className="px-6 pb-6 flex space-x-2 relative">
              <button 
                onClick={loadFromCloud} 
                disabled={!pantryId || isProcessing} 
                className={`flex-1 py-2 px-3 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all flex items-center justify-center space-x-2 ${
                    pobierzState 
                    ? 'bg-black dark:bg-white text-white dark:text-black' 
                    : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                }`}
              >
                {!pobierzState && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>}
                <span>{pobierzState ? 'Pobrano' : 'Pobierz'}</span>
              </button>

              <button 
                onClick={saveToCloud} 
                disabled={!pantryId || isProcessing} 
                className={`flex-1 py-2 px-3 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all flex items-center justify-center space-x-2 ${
                    wyslijState 
                    ? 'bg-black dark:bg-white text-white dark:text-black' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                {!wyslijState && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>}
                <span>{wyslijState ? 'Wysłano' : 'Wyślij'}</span>
              </button>
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto px-4 space-y-1">
            {history.map((item) => (
              <button key={item.id} onClick={() => { setSelectedItem(item); }} className={`w-full text-left p-4 rounded-xl transition-all relative group ${selectedItem?.id === item.id ? 'bg-white dark:bg-gray-800 shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}>
                <div onClick={(e) => { e.stopPropagation(); confirmDelete(item.id); }} className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all z-10"><CloseIcon /></div>
                <div className="font-medium truncate text-sm pr-6">{item.title}</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">{new Date(item.date).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              </button>
            ))}
          </div>

          {history.length > 0 && (
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 mt-auto bg-gray-50/50 dark:bg-gray-900/50">
                <button onClick={() => setIsDeleteAllModalOpen(true)} className="w-full py-3 text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center space-x-2"><TrashIcon /><span>Wyczyść Archiwum</span></button>
            </div>
          )}
        </div>
      </div>

      {/* GŁÓWNY PANEL */}
      <div className={`flex-1 flex flex-col relative bg-white dark:bg-gray-950 min-w-0 transition-all duration-300 ${isSidebarOpen ? 'ml-80' : 'ml-0'}`}>
        
        <div className="p-8 flex justify-between items-start z-10">
          <div className="flex items-center space-x-6">
             {!isSidebarOpen && (
               <button onClick={() => setIsSidebarOpen(true)} className="text-gray-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"><RuneArrowRight /></button>
             )}
             {selectedItem && (
               <button onClick={() => setSelectedItem(null)} className={`relative z-40 text-3xl font-thin tracking-tighter transition-all duration-300 text-gray-400 hover:text-black dark:hover:text-white`}>Lasto</button>
             )}
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="text-gray-300 hover:text-black dark:hover:text-white transition-transform hover:rotate-12 duration-300"><SettingsIcon /></button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-12 pb-12 overflow-hidden">
          {!selectedItem ? (
            <div className="text-center space-y-12 animate-in fade-in zoom-in duration-700">
              <div className="space-y-6">
                <div className="text-9xl font-thin tracking-tighter text-gray-900 dark:text-white transition-colors">Lasto</div>
                <div className="flex items-center justify-center space-x-6 text-xl font-light text-gray-400">
                    <span>Słuchaj</span> <span className="text-2xl text-gray-200 dark:text-gray-700 pb-1">ᛟ</span>
                    <span>Nagraj</span> <span className="text-2xl text-gray-200 dark:text-gray-700 pb-1">ᛟ</span>
                    <span>Pisz</span>
                </div>
              </div>
              <div className="flex flex-col space-y-4 items-center pt-8 min-h-[100px]">
                {isProcessing ? (
                  <div className="flex flex-col items-center space-y-3 animate-in fade-in zoom-in duration-300">
                     <div className="w-6 h-6 border-2 border-gray-300 border-t-black dark:border-gray-700 dark:border-t-white rounded-full animate-spin"/>
                     <span className="text-xs uppercase tracking-[0.2em] text-gray-400 animate-pulse">{uploadStatus || status || 'Przetwarzanie...'}</span>
                  </div>
                ) : !apiKey ? (
                  <div className="flex flex-col items-center space-y-4">
                    <button onClick={() => setIsSettingsOpen(true)} className="bg-black dark:bg-white dark:text-black text-white px-10 py-5 rounded-full transition-all hover:scale-105 shadow-xl font-medium">Dodaj pierwsze nagranie</button>
                  </div>
                ) : (
                  <>
                    <label onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`group relative cursor-pointer px-12 py-5 rounded-full transition-all shadow-xl flex flex-col items-center justify-center border-2 ${isDragging ? 'bg-gray-800 text-white scale-110 border-white border-dashed' : 'bg-black dark:bg-white dark:text-black text-white border-transparent hover:scale-105 active:scale-95'}`}>{isDragging ? 'Upuść tutaj!' : 'Importuj nagranie'}<input type="file" className="hidden" accept="audio/*" onChange={handleFileInput} /></label>
                    <p className="text-[10px] uppercase tracking-widest text-gray-300 dark:text-gray-600 mt-4">WAV • MP3 • M4A</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-5xl h-full flex flex-col space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-end justify-between border-b border-gray-50 dark:border-gray-800 pb-6 min-h-[80px]">
                {isEditingTitle ? (
                  <div className="flex items-center w-full space-x-4">
                    <input className="w-full text-4xl font-thin tracking-tight bg-gray-50 dark:bg-gray-900 p-2 rounded focus:ring-1 focus:ring-black dark:focus:ring-white outline-none dark:text-white" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveNewTitle()} autoFocus />
                    <button onClick={saveNewTitle} className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"><CheckIcon /></button>
                  </div>
                ) : (
                  <div className="flex items-center w-full group relative">
                    <button onClick={() => confirmDelete(selectedItem.id)} className="mr-4 text-gray-300 hover:text-red-500 transition-colors p-2" title="Usuń nagranie"><TrashIcon /></button>
                    <div className="flex items-center w-full cursor-pointer" onClick={() => { setEditedTitle(selectedItem.title); setIsEditingTitle(true); }}>
                        <h1 className="text-4xl font-thin tracking-tight truncate max-w-2xl dark:text-white">{selectedItem.title}</h1>
                        <span className="ml-4 opacity-30 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-300"><EditIcon /></span>
                    </div>
                    
                    <div className="relative ml-auto">
                        <button 
                            onClick={saveToCloud} 
                            disabled={!pantryId || isProcessing} 
                            className={`px-5 py-3 rounded-xl text-[10px] uppercase tracking-widest font-bold flex items-center space-x-2 transition-all ${
                                saveState 
                                ? 'bg-black dark:bg-white text-white dark:text-black' 
                                : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                            }`}
                        >
                            {isProcessing ? (
                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : !saveState && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" /></svg>
                            )}
                            <span>{saveState ? 'Zapisano' : 'Zapisz'}</span>
                        </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex space-x-4 animate-in fade-in duration-300">
                  <input className="flex-1 bg-gray-100 dark:bg-gray-900 dark:text-white border-none rounded-lg p-3 text-xs focus:ring-1 focus:ring-black dark:focus:ring-white" value={getSpeakerName(selectedItem, 'A')} onChange={(e) => handleSpeakerNameChange('A', e.target.value)} placeholder="Osoba A" />
                  <input className="flex-1 bg-gray-100 dark:bg-gray-900 dark:text-white border-none rounded-lg p-3 text-xs focus:ring-1 focus:ring-black dark:focus:ring-white" value={getSpeakerName(selectedItem, 'B')} onChange={(e) => handleSpeakerNameChange('B', e.target.value)} placeholder="Osoba B" />
              </div>
              <textarea className="flex-1 w-full p-8 bg-gray-100/40 dark:bg-gray-900/40 dark:text-gray-200 rounded-2xl font-mono text-sm leading-relaxed border-none focus:ring-0 resize-none selection:bg-blue-50 dark:selection:bg-blue-900" value={getDisplayText(selectedItem)} readOnly />
              <div className="flex items-center justify-end pt-2 relative">
                <button 
                    onClick={copyToClipboard} 
                    className={`px-5 py-3 rounded-xl border transition-all text-[10px] uppercase tracking-widest font-medium flex items-center space-x-2 ${
                        copyState 
                        ? 'bg-black dark:bg-white text-white dark:text-black border-transparent' 
                        : 'border-gray-200 dark:border-gray-800 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50'
                    }`}
                >
                    {!copyState && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>}
                    <span>{copyState ? 'Skopiowano' : 'Kopiuj tekst'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-6 right-8 flex items-center space-x-4 pointer-events-none select-none z-0">
            <div className="flex items-center space-x-1.5 opacity-40">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-medium">Auto-save on (DB)</span>
            </div>
            <div className="text-[10px] text-gray-200 dark:text-gray-800 uppercase tracking-widest flex items-center space-x-3">
                <span className="italic font-serif">Lasto beth nîn</span>
                <span className="text-xs opacity-50">ᛟ</span>
                <span>developed by Kamil Gąszowski</span>
                <span className="text-xs opacity-50">ᛟ</span>
                <span>{new Date().getFullYear()}</span>
            </div>
        </div>
      </div>

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