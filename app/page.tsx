"use client";

import { useState, useEffect } from 'react';
import './lasto.css';

// --- IKONY (Z klasami CSS) ---
const IconDownload = () => (
  <svg className="icon-small icon-stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
);
const IconUpload = () => (
  <svg className="icon-small icon-stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
);
const RuneArrowLeft = () => (
  <svg className="icon-medium" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 4l-10 8 10 8" /></svg>
);
const RuneArrowRight = () => (
  <svg className="icon-medium" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 4l10 8-10 8" /></svg>
);
const TrashIcon = () => (
  <svg className="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
);

export default function LastoWeb() {
  // ... (Stany i funkcje bez zmian jak w poprzednich wersjach) ...

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
              <button onClick={loadFromCloud} className={`btn-action-base ${pobierzState ? 'btn-status-success' : 'btn-pobierz'}`}>
                {!pobierzState && <IconDownload />}
                <span>{pobierzState ? 'Pobrano' : 'Pobierz'}</span>
              </button>
              <button onClick={saveToCloud} className={`btn-action-base ${wyslijState ? 'btn-status-success' : 'btn-wyslij'}`}>
                {!wyslijState && <IconUpload />}
                <span>{wyslijState ? 'Wysłano' : 'Wyślij'}</span>
              </button>
          </div>

          <div className="archive-list">
            {history.map((item) => (
              <button key={item.id} onClick={() => { setSelectedItem(item); if (window.innerWidth < 768) setIsSidebarOpen(false); }} className={`archive-item ${selectedItem?.id === item.id ? 'archive-item-active' : ''}`}>
                <div onClick={(e) => { e.stopPropagation(); confirmDelete(item.id); }} className="archive-delete-btn">Usuń</div>
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
          {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)}><RuneArrowRight /></button>}
          {selectedItem && <button onClick={() => setSelectedItem(null)} className="hero-title text-2xl">Lasto</button>}
          <button onClick={() => setIsSettingsOpen(true)}>Ustawienia</button>
        </div>

        <div className="workspace-area">
          {!selectedItem ? (
            <div className="hero-container">
              <div className="hero-title">Lasto</div>
              <div className="hero-subtitle">Słuchaj ᛟ Nagraj ᛟ Pisz</div>
              <label className={`btn-import ${isDragging ? 'btn-import-dragging' : ''}`} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDrop={handleDrop}>
                {isDragging ? 'Upuść tutaj' : 'Importuj nagranie'}
                <input type="file" className="hidden" onChange={handleFileInput} />
              </label>
            </div>
          ) : (
            <div className="editor-container">
              <div className="editor-header">
                <h1 className="title-display">{selectedItem.title}</h1>
                <button onClick={saveToCloud} className="btn-action-base btn-pobierz w-auto px-6">Zapisz</button>
              </div>
              <div className="speaker-grid">
                  <input className="speaker-input" value={getSpeakerName(selectedItem, 'A')} onChange={(e) => handleSpeakerNameChange('A', e.target.value)} />
                  <input className="speaker-input" value={getSpeakerName(selectedItem, 'B')} onChange={(e) => handleSpeakerNameChange('B', e.target.value)} />
              </div>
              <textarea className="transcript-area" value={getDisplayText(selectedItem)} readOnly />
              <button onClick={copyToClipboard} className="btn-copy">Kopiuj tekst</button>
            </div>
          )}
        </div>
      </div>

      {/* MODALE - Przykład uproszczenia */}
      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Usunąć nagranie?</h3>
            <div className="flex space-x-2 mt-4">
              <button className="btn-action-base btn-wyslij" onClick={() => setIsDeleteModalOpen(false)}>Anuluj</button>
              <button className="btn-action-base bg-red-600 text-white" onClick={executeDelete}>Usuń</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}