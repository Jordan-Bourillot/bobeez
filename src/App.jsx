import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import FolderTree from './components/FolderTree.jsx';
import Grid from './components/Grid.jsx';
import Viewer from './components/Viewer.jsx';
import Editor from './components/Editor.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import Toolbar from './components/Toolbar.jsx';
import StatusBar from './components/StatusBar.jsx';
import Toaster from './components/Toaster.jsx';
import Dialog from './components/Dialog.jsx';
import ContextMenu, { useContextMenu } from './components/ContextMenu.jsx';
import HelpOverlay from './components/HelpOverlay.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import TriageMode from './components/TriageMode.jsx';
import HoverPreview from './components/HoverPreview.jsx';
import UpdateBanner from './components/UpdateBanner.jsx';
import BetaBanner from './components/BetaBanner.jsx';
import CompareMode from './components/CompareMode.jsx';
import CalendarView from './components/CalendarView.jsx';
import MapView from './components/MapView.jsx';
import BatchExport from './components/BatchExport.jsx';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import MascotReactions from './components/MascotReactions.jsx';
import Icon from './components/Icon.jsx';
import { react as mascotReact } from './lib/mascotReact.js';
import { M } from './mascot.js';
import { toast, toastSuccess, toastError, toastInfo } from './lib/toast.js';
import { confirm, prompt as dialogPrompt } from './lib/dialog.js';

const TABS = ['Gérer', 'Afficher', 'Éditer'];

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [currentDir, setCurrentDir] = useState(null);
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [lastSelected, setLastSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [thumbSize, setThumbSize] = useState(180);
  const [favorites, setFavorites] = useState([]);
  const [recentFolders, setRecentFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [infoCollapsed, setInfoCollapsed] = useState(false);
  const [filter, setFilter] = useState({ minRating: 0 });

  const [showHelp, setShowHelp] = useState(false);
  const [showCmdK, setShowCmdK] = useState(false);
  const [triageActive, setTriageActive] = useState(false);
  const [compareActive, setCompareActive] = useState(false);
  const [showBatchExport, setShowBatchExport] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [gridView, setGridView] = useState('grid'); // grid | calendar | map

  const [hover, setHover] = useState(null); // { file, anchor }
  const hoverTimerRef = useRef(null);

  const ctxMenu = useContextMenu();

  // Folder history
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const filtered = useMemo(() => {
    let list = files;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        (f.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    if (filter.minRating > 0) {
      list = list.filter(f => (f.rating || 0) >= filter.minRating);
    }
    list = [...list];
    switch (sortBy) {
      case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': list.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'date': list.sort((a, b) => b.mtime - a.mtime); break;
      case 'date-asc': list.sort((a, b) => a.mtime - b.mtime); break;
      case 'size': list.sort((a, b) => b.size - a.size); break;
      case 'rating': list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    }
    return list;
  }, [files, search, sortBy, filter]);

  // ----- Folder loading -----
  const loadFolder = useCallback(async (dirPath, opts = {}) => {
    if (!dirPath) return;
    setLoading(true);
    setError(null);
    setSelected(new Set());
    setLastSelected(null);
    try {
      const r = await window.bobeez.listDir(dirPath);
      if (r.error) {
        setError(r.error);
        toastError('Impossible d\'ouvrir : ' + r.error);
      }
      const enriched = await Promise.all((r.files || []).map(async f => {
        try {
          const s = await window.bobeez.getSidecar(f.path);
          return { ...f, rating: s.rating || 0, tags: s.tags || [], label: s.label };
        } catch { return f; }
      }));
      setFiles(enriched);
      setCurrentDir(dirPath);
      window.bobeez.setState({ lastFolder: dirPath });
      const recent = await window.bobeez.addRecent(dirPath);
      setRecentFolders(recent);

      if (!opts.skipHistory) {
        setHistory(h => {
          const newHist = h.slice(0, historyIdx + 1);
          newHist.push(dirPath);
          return newHist;
        });
        setHistoryIdx(i => i + 1);
      }
    } catch (e) {
      setError(e.message);
      toastError(e.message);
    } finally {
      setLoading(false);
    }
  }, [historyIdx]);

  const navigateBack = () => {
    if (historyIdx > 0) {
      const target = history[historyIdx - 1];
      setHistoryIdx(historyIdx - 1);
      loadFolder(target, { skipHistory: true });
    }
  };
  const navigateForward = () => {
    if (historyIdx < history.length - 1) {
      const target = history[historyIdx + 1];
      setHistoryIdx(historyIdx + 1);
      loadFolder(target, { skipHistory: true });
    }
  };
  const navigateUp = () => {
    if (!currentDir) return;
    const isWin = /^[A-Z]:[\\/]/i.test(currentDir);
    const sep = isWin ? '\\' : '/';
    const parts = currentDir.split(/[\\/]/).filter(Boolean);
    if (parts.length <= 1) return;
    const head = parts.slice(0, -1);
    let parent;
    if (isWin) {
      parent = head.length === 1 && /^[A-Z]:$/i.test(head[0])
        ? head[0] + sep
        : head[0] + sep + head.slice(1).join(sep);
    } else {
      parent = '/' + head.join('/');
    }
    if (parent && parent !== currentDir) loadFolder(parent);
  };

  // ----- Init: restore state -----
  useEffect(() => {
    (async () => {
      const [favs, recent, state] = await Promise.all([
        window.bobeez.getFavorites(),
        window.bobeez.getRecent(),
        window.bobeez.getState(),
      ]);
      setFavorites(favs || []);
      setRecentFolders(recent || []);
      if (state.thumbSize) setThumbSize(state.thumbSize);
      if (state.sortBy) setSortBy(state.sortBy);
      if (state.sidebarCollapsed) setSidebarCollapsed(true);
      if (state.infoCollapsed) setInfoCollapsed(true);

      if (!state.skipWelcome) {
        setShowWelcome(true);
      }
      const start = state.lastFolder || (await window.bobeez.homeDirs()).pictures;
      if (start) loadFolder(start);
    })();
  }, []); // eslint-disable-line

  useEffect(() => { window.bobeez.setState({ thumbSize }); }, [thumbSize]);
  useEffect(() => { window.bobeez.setState({ sortBy }); }, [sortBy]);
  useEffect(() => { window.bobeez.setState({ sidebarCollapsed }); }, [sidebarCollapsed]);
  useEffect(() => { window.bobeez.setState({ infoCollapsed }); }, [infoCollapsed]);

  // ----- Selection -----
  const onSelect = (idx, e) => {
    if (e?.shiftKey && lastSelected != null) {
      const [a, b] = [Math.min(lastSelected, idx), Math.max(lastSelected, idx)];
      const s = new Set(selected);
      for (let i = a; i <= b; i++) s.add(i);
      setSelected(s);
    } else if (e?.ctrlKey || e?.metaKey) {
      const s = new Set(selected);
      if (s.has(idx)) s.delete(idx); else s.add(idx);
      setSelected(s);
    } else {
      setSelected(new Set([idx]));
    }
    setLastSelected(idx);
  };

  const onOpen = (idx) => {
    setViewerIndex(idx);
    setActiveTab(1);
  };

  const setRating = useCallback(async (idxOrFile, rating) => {
    const f = typeof idxOrFile === 'number' ? filtered[idxOrFile] : idxOrFile;
    if (!f) return;
    const s = await window.bobeez.getSidecar(f.path);
    s.rating = rating;
    await window.bobeez.setSidecar(f.path, s);
    setFiles(prev => prev.map(x => x.path === f.path ? { ...x, rating } : x));
    if (rating >= 4) mascotReact('happy', { text: rating === 5 ? '★★★★★ !' : 'Top !' });
    else if (rating === 0) mascotReact('pensive', { text: 'Note retirée' });
  }, [filtered]);

  const renameFile = async (file) => {
    const newName = await dialogPrompt(`Renommer "${file.name}"`, {
      title: 'Renommer le fichier',
      defaultValue: file.name,
      okLabel: 'Renommer',
      icon: 'notebook',
      validate: v => !v?.trim() ? 'Le nom ne peut pas être vide' : null,
    });
    if (!newName || newName === file.name) return;
    const r = await window.bobeez.rename(file.path, newName);
    if (r.ok) {
      toastSuccess('Renommé en "' + newName + '"');
      loadFolder(currentDir, { skipHistory: true });
    } else {
      toastError('Échec : ' + r.error);
    }
  };

  const deleteFiles = async (filesToDelete) => {
    if (!filesToDelete.length) return;
    const ok = await confirm(
      filesToDelete.length === 1
        ? `Mettre "${filesToDelete[0].name}" à la corbeille ?`
        : `Mettre ${filesToDelete.length} fichiers à la corbeille ?`,
      { title: 'Confirmer la suppression', okLabel: 'Mettre à la corbeille', danger: true, icon: 'shocked2' }
    );
    if (!ok) return;
    let success = 0, fail = 0;
    for (const f of filesToDelete) {
      const r = await window.bobeez.trash(f.path);
      if (r.ok) success++; else fail++;
    }
    if (success) {
      toastSuccess(`${success} fichier${success>1?'s':''} déplacé${success>1?'s':''} à la corbeille`);
      mascotReact('shocked2', { text: 'Hop, à la poubelle !' });
    }
    if (fail) toastError(`${fail} échec${fail>1?'s':''}`);
    loadFolder(currentDir, { skipHistory: true });
  };

  const rotateFiles = async (filesToRotate, deg) => {
    if (!filesToRotate.length) return;
    let ok = 0, ko = 0;
    for (const f of filesToRotate) {
      try { await window.bobeez.rotate(f.path, deg); ok++; }
      catch { ko++; }
    }
    if (ok) toastSuccess(`Rotation appliquée à ${ok} fichier${ok>1?'s':''}`);
    if (ko) toastError(`${ko} échec${ko>1?'s':''}`);
    loadFolder(currentDir, { skipHistory: true });
  };

  const deleteSelected = () => deleteFiles([...selected].map(i => filtered[i]).filter(Boolean));
  const rotateSelected = (deg) => rotateFiles([...selected].map(i => filtered[i]).filter(Boolean), deg);

  const toggleFavorite = async (path) => {
    const next = favorites.some(f => f.path === path)
      ? favorites.filter(f => f.path !== path)
      : [...favorites, { path, name: path.split(/[\\/]/).pop() }];
    setFavorites(next);
    await window.bobeez.setFavorites(next);
    toastInfo(favorites.some(f => f.path === path) ? 'Retiré des favoris' : 'Ajouté aux favoris ⭐');
  };

  const copyPath = async (file) => {
    await window.bobeez.copyText(file.path);
    toastSuccess('Chemin copié');
  };

  // ----- Hover preview -----
  const onHoverThumb = (file, anchor) => {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHover({ file, anchor }), 600);
  };
  const onLeaveThumb = () => {
    clearTimeout(hoverTimerRef.current);
    setHover(null);
  };

  // ----- Context menu items for a file -----
  const fileContextItems = (file, idx) => [
    { label: 'Ouvrir', icon: 'play', onClick: () => onOpen(idx), shortcut: 'Entrée' },
    { label: 'Éditer', icon: 'edit', onClick: () => { setSelected(new Set([idx])); setActiveTab(2); } },
    '-',
    { label: 'Renommer…', icon: 'rename', onClick: () => renameFile(file), shortcut: 'F2' },
    { label: 'Rotation droite', icon: 'rotateRight', onClick: () => rotateFiles([file], 90) },
    { label: 'Rotation gauche', icon: 'rotateLeft', onClick: () => rotateFiles([file], -90) },
    '-',
    { label: 'Mettre à 5 ★', icon: 'star', onClick: () => setRating(idx, 5) },
    { label: 'Retirer la note', onClick: () => setRating(idx, 0) },
    '-',
    { label: 'Copier le chemin', icon: 'copy', onClick: () => copyPath(file) },
    { label: 'Localiser dans l\'explorateur', icon: 'reveal', onClick: () => window.bobeez.reveal(file.path) },
    { label: 'Ouvrir avec…', icon: 'external', onClick: () => window.bobeez.openExternal(file.path) },
    '-',
    { label: 'Mettre à la corbeille', icon: 'trash', onClick: () => deleteFiles([file]), danger: true, shortcut: 'Suppr' },
  ];

  // ----- Drag & drop on window -----
  const [dragOver, setDragOver] = useState(false);
  useEffect(() => {
    const onDragOver = (e) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setDragOver(true);
      }
    };
    const onDragLeave = (e) => {
      if (e.relatedTarget == null || e.relatedTarget.nodeName === 'HTML') {
        setDragOver(false);
      }
    };
    const onDrop = async (e) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files || []);
      if (!files.length) return;
      const first = files[0];
      // Electron sets `path` on File. Detect file vs dir by trying to list it.
      const p = first.path;
      if (!p) {
        toastError('Impossible de lire le chemin du fichier déposé');
        return;
      }
      // try loading as directory first
      const r = await window.bobeez.listDir(p);
      if (!r.error && (r.dirs?.length || r.files?.length)) {
        loadFolder(p);
        toastInfo('📁 ' + (p.split(/[\\/]/).pop() || p));
      } else {
        // file → load parent
        const parent = p.replace(/[\\/][^\\/]+$/, '');
        if (parent) {
          loadFolder(parent);
          toastInfo('📁 ' + (parent.split(/[\\/]/).pop() || parent));
        }
      }
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [loadFolder]);

  // ----- Keyboard shortcuts -----
  useEffect(() => {
    const onKey = (e) => {
      const inInput = e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA';

      // Global shortcuts (work even in inputs)
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCmdK(true);
        return;
      }

      if (inInput) return;

      // Navigation
      if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); navigateBack(); return; }
      if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); navigateForward(); return; }
      if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); navigateUp(); return; }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) { e.preventDefault(); setShowHelp(true); return; }
      if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.altKey) {
        if (filtered.length > 0) {
          e.preventDefault();
          setTriageActive(true);
        }
        return;
      }

      // Grid actions
      if (e.key === 'Delete') { e.preventDefault(); deleteSelected(); }
      else if (e.key === 'F2') {
        const idx = [...selected][0];
        const f = filtered[idx];
        if (f) renameFile(f);
      }
      else if (e.key === 'Enter') {
        const idx = [...selected][0];
        if (idx != null) onOpen(idx);
      }
      else if (e.ctrlKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelected(new Set(filtered.map((_, i) => i)));
      }
      else if (e.key >= '0' && e.key <= '5' && !e.ctrlKey && !e.altKey) {
        const idx = [...selected][0];
        if (idx != null) setRating(idx, parseInt(e.key));
      }
      else if (e.key === 'F5') { e.preventDefault(); loadFolder(currentDir, { skipHistory: true }); }
      else if (e.key === 'Escape') {
        if (triageActive) setTriageActive(false);
        else if (showCmdK) setShowCmdK(false);
        else if (showHelp) setShowHelp(false);
        else if (viewerIndex != null) setViewerIndex(null);
        else setSelected(new Set());
      }
      else if (e.key === '+' || e.key === '=') setThumbSize(s => Math.min(400, s + 20));
      else if (e.key === '-') setThumbSize(s => Math.max(80, s - 20));
      // Arrow nav in grid
      else if (activeTab === 0 && (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        const cols = Math.max(1, Math.floor((document.querySelector('.grid')?.clientWidth || 800) / (thumbSize + 10)));
        const cur = lastSelected ?? -1;
        let next = cur;
        if (e.key === 'ArrowRight') next = Math.min(filtered.length - 1, cur + 1);
        else if (e.key === 'ArrowLeft') next = Math.max(0, cur - 1);
        else if (e.key === 'ArrowDown') next = Math.min(filtered.length - 1, cur + cols);
        else if (e.key === 'ArrowUp') next = Math.max(0, cur - cols);
        if (next !== cur && next >= 0) {
          if (e.shiftKey && lastSelected != null) {
            const [a, b] = [Math.min(lastSelected, next), Math.max(lastSelected, next)];
            const s = new Set();
            for (let i = a; i <= b; i++) s.add(i);
            setSelected(s);
          } else {
            setSelected(new Set([next]));
          }
          setLastSelected(next);
          // scroll into view
          requestAnimationFrame(() => {
            const el = document.querySelector(`.thumb[data-idx="${next}"]`);
            el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, filtered, currentDir, viewerIndex, loadFolder, lastSelected, thumbSize, activeTab, triageActive, showCmdK, showHelp]);

  const selectedFile = useMemo(() => {
    const idx = [...selected][0];
    return idx != null ? filtered[idx] : null;
  }, [selected, filtered]);

  // ----- Command Palette commands -----
  const commands = useMemo(() => {
    const sel = [...selected].map(i => filtered[i]).filter(Boolean);
    const cmds = [
      { id: 'open', label: 'Ouvrir un dossier…', icon: 'folder', section: 'Fichier', shortcut: 'Ctrl+O', run: async () => { const p = await window.bobeez.openFolder(); if (p) loadFolder(p); } },
      { id: 'refresh', label: 'Rafraîchir', icon: 'refresh', section: 'Fichier', shortcut: 'F5', run: () => loadFolder(currentDir, { skipHistory: true }) },
      { id: 'back', label: 'Précédent', icon: 'back', section: 'Navigation', shortcut: 'Alt+←', run: navigateBack },
      { id: 'forward', label: 'Suivant', icon: 'forward', section: 'Navigation', shortcut: 'Alt+→', run: navigateForward },
      { id: 'up', label: 'Dossier parent', icon: 'up', section: 'Navigation', shortcut: 'Alt+↑', run: navigateUp },
      { id: 'tab-manage', label: 'Vue : Gérer', icon: 'grid', section: 'Vues', run: () => setActiveTab(0) },
      { id: 'tab-view', label: 'Vue : Afficher', icon: 'fit', section: 'Vues', run: () => setActiveTab(1) },
      { id: 'tab-edit', label: 'Vue : Éditer', icon: 'edit', section: 'Vues', run: () => setActiveTab(2) },
      { id: 'triage', label: 'Mode triage rapide', icon: 'compare', section: 'Vues', shortcut: 'T', hint: 'Tinder pour photos', run: () => filtered.length > 0 ? setTriageActive(true) : toastInfo('Aucune photo à trier') },
      { id: 'sidebar', label: sidebarCollapsed ? 'Afficher le panneau gauche' : 'Masquer le panneau gauche', icon: 'panelLeft', section: 'Vues', run: () => setSidebarCollapsed(v => !v) },
      { id: 'info', label: infoCollapsed ? 'Afficher le panneau d\'info' : 'Masquer le panneau d\'info', icon: 'panelRight', section: 'Vues', run: () => setInfoCollapsed(v => !v) },
      { id: 'select-all', label: 'Tout sélectionner', section: 'Sélection', shortcut: 'Ctrl+A', run: () => setSelected(new Set(filtered.map((_, i) => i))) },
      { id: 'clear-sel', label: 'Tout désélectionner', section: 'Sélection', shortcut: 'Esc', run: () => setSelected(new Set()) },
      { id: 'rotate-r', label: `Rotation droite${sel.length>1?` (${sel.length} photos)`:''}`, icon: 'rotateRight', section: 'Édition', run: () => rotateSelected(90), hint: sel.length===0 ? 'aucune sélection' : '' },
      { id: 'rotate-l', label: `Rotation gauche${sel.length>1?` (${sel.length} photos)`:''}`, icon: 'rotateLeft', section: 'Édition', run: () => rotateSelected(-90) },
      { id: 'delete', label: `Supprimer la sélection${sel.length>1?` (${sel.length})`:''}`, icon: 'trash', section: 'Édition', shortcut: 'Suppr', run: deleteSelected },
      { id: 'help', label: 'Afficher les raccourcis clavier', icon: 'help', section: 'Aide', shortcut: '?', run: () => setShowHelp(true) },
      { id: 'settings', label: 'Paramètres', icon: 'settings', section: 'Aide', run: () => setShowSettings(true) },
      { id: 'compare', label: `Comparer la sélection${selected.size>=2?` (${selected.size})`:''}`, icon: 'compare', section: 'Vues', hint: selected.size<2 ? 'Sélectionne 2 photos' : '', run: () => selected.size>=2 ? setCompareActive(true) : toastInfo('Sélectionne au moins 2 photos') },
      { id: 'batch-export', label: `Exporter la sélection${selected.size>0?` (${selected.size})`:''}`, icon: 'download', section: 'Édition', hint: selected.size===0 ? 'Sélectionne au moins 1 photo' : '', run: () => selected.size>0 ? setShowBatchExport(true) : toastInfo('Sélectionne au moins 1 photo') },
      { id: 'view-grid', label: 'Vue : Grille', icon: 'grid', section: 'Vues', run: () => { setActiveTab(0); setGridView('grid'); } },
      { id: 'view-cal', label: 'Vue : Calendrier', icon: 'history', section: 'Vues', run: () => { setActiveTab(0); setGridView('calendar'); } },
      { id: 'view-map', label: 'Vue : Carte (GPS)', icon: 'reveal', section: 'Vues', run: () => { setActiveTab(0); setGridView('map'); } },
      { id: 'thumb-bigger', label: 'Miniatures plus grandes', icon: 'plus', section: 'Vues', shortcut: '+', run: () => setThumbSize(s => Math.min(400, s + 40)) },
      { id: 'thumb-smaller', label: 'Miniatures plus petites', icon: 'minus', section: 'Vues', shortcut: '−', run: () => setThumbSize(s => Math.max(80, s - 40)) },
    ];
    if (currentDir && !favorites.some(f => f.path === currentDir)) {
      cmds.push({ id: 'fav-add', label: 'Ajouter ce dossier aux favoris', icon: 'star', section: 'Favoris', run: () => toggleFavorite(currentDir) });
    } else if (currentDir) {
      cmds.push({ id: 'fav-rm', label: 'Retirer ce dossier des favoris', section: 'Favoris', run: () => toggleFavorite(currentDir) });
    }
    // Recent folders as commands
    for (const r of recentFolders.slice(0, 8)) {
      if (r.path !== currentDir) {
        cmds.push({ id: 'recent-' + r.path, label: 'Ouvrir : ' + r.name, icon: 'folder', section: 'Récents', hint: r.path, run: () => loadFolder(r.path), keywords: r.path });
      }
    }
    // Favorites
    for (const f of favorites) {
      if (f.path !== currentDir) {
        cmds.push({ id: 'fav-' + f.path, label: 'Favori : ' + f.name, icon: 'star', section: 'Favoris', hint: f.path, run: () => loadFolder(f.path), keywords: f.path });
      }
    }
    // First 10 files in selection / view
    for (let i = 0; i < Math.min(10, filtered.length); i++) {
      const ff = filtered[i];
      cmds.push({ id: 'file-' + ff.path, label: ff.name, icon: 'photos', section: 'Photos', run: () => onOpen(i), keywords: ff.tags?.join(' ') || '' });
    }
    return cmds;
  }, [filtered, selected, currentDir, recentFolders, favorites, sidebarCollapsed, infoCollapsed]);

  return (
    <div className="app">
      <BetaBanner />
      <UpdateBanner />
      <Toolbar
        tabs={TABS}
        activeTab={activeTab}
        onTab={setActiveTab}
        onOpen={async () => { const p = await window.bobeez.openFolder(); if (p) loadFolder(p); }}
        onRefresh={() => loadFolder(currentDir, { skipHistory: true })}
        currentDir={currentDir}
        history={history}
        historyIndex={historyIdx}
        onBack={navigateBack}
        onForward={navigateForward}
        onUp={navigateUp}
        recentFolders={recentFolders}
        onPickRecent={loadFolder}
        onNavigate={loadFolder}
        search={search}
        onSearch={setSearch}
        sortBy={sortBy}
        onSort={setSortBy}
        thumbSize={thumbSize}
        onThumbSize={setThumbSize}
        filter={filter}
        onFilter={setFilter}
        selectedCount={selected.size}
        onRotate={rotateSelected}
        onDelete={deleteSelected}
        onTriage={() => filtered.length > 0 && setTriageActive(true)}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(v => !v)}
        infoCollapsed={infoCollapsed}
        onToggleInfo={() => setInfoCollapsed(v => !v)}
        onCmdK={() => setShowCmdK(true)}
        onHelp={() => setShowHelp(true)}
      />

      <div className="main">
        {!sidebarCollapsed && (
          <aside className="sidebar">
            <FolderTree
              currentDir={currentDir}
              onSelectDir={loadFolder}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              recentFolders={recentFolders}
            />
          </aside>
        )}

        <section className="center">
          {activeTab === 0 && (
            <>
              <div className="view-switcher">
                <button className={'vs-btn ' + (gridView === 'grid' ? 'active' : '')} onClick={() => setGridView('grid')} title="Grille">
                  <Icon name="grid" size={16} /> Grille
                </button>
                <button className={'vs-btn ' + (gridView === 'calendar' ? 'active' : '')} onClick={() => setGridView('calendar')} title="Calendrier">
                  <Icon name="history" size={16} /> Calendrier
                </button>
                <button className={'vs-btn ' + (gridView === 'map' ? 'active' : '')} onClick={() => setGridView('map')} title="Carte">
                  <Icon name="reveal" size={16} /> Carte
                </button>
                <div className="spacer" />
                {selected.size >= 2 && (
                  <button className="btn ghost" onClick={() => setCompareActive(true)}>
                    <Icon name="compare" size={14} /> Comparer
                  </button>
                )}
                {selected.size >= 1 && (
                  <button className="btn ghost" onClick={() => setShowBatchExport(true)}>
                    <Icon name="download" size={14} /> Exporter ({selected.size})
                  </button>
                )}
              </div>
              {gridView === 'grid' && (
                <Grid
                  files={filtered}
                  selected={selected}
                  onSelect={onSelect}
                  onOpen={onOpen}
                  thumbSize={thumbSize}
                  loading={loading}
                  error={error}
                  onSetRating={setRating}
                  onContextMenu={(e, idx) => ctxMenu.open(e, fileContextItems(filtered[idx], idx))}
                  onHover={onHoverThumb}
                  onLeave={onLeaveThumb}
                />
              )}
              {gridView === 'calendar' && (
                <CalendarView
                  files={filtered}
                  onOpen={(f) => {
                    const idx = filtered.findIndex(x => x.path === f.path);
                    if (idx >= 0) onOpen(idx);
                  }}
                />
              )}
              {gridView === 'map' && (
                <MapView
                  files={filtered}
                  onOpen={(f) => {
                    const idx = filtered.findIndex(x => x.path === f.path);
                    if (idx >= 0) onOpen(idx);
                  }}
                />
              )}
            </>
          )}
          {activeTab === 1 && (
            <Viewer
              files={filtered}
              index={viewerIndex ?? [...selected][0] ?? 0}
              onIndex={setViewerIndex}
              onClose={() => setActiveTab(0)}
            />
          )}
          {activeTab === 2 && (
            <Editor
              file={selectedFile}
              onSaved={() => loadFolder(currentDir, { skipHistory: true })}
            />
          )}
        </section>

        {!infoCollapsed && (
          <aside className="info-panel">
            <InfoPanel
              file={selectedFile}
              onSetRating={async (r) => {
                const idx = [...selected][0];
                if (idx != null) await setRating(idx, r);
              }}
            />
          </aside>
        )}
      </div>

      <StatusBar
        currentDir={currentDir}
        total={files.length}
        filtered={filtered.length}
        selected={selected.size}
        onCmdK={() => setShowCmdK(true)}
        onHelp={() => setShowHelp(true)}
        onSettings={() => setShowSettings(true)}
      />

      {/* Overlays */}
      <ContextMenu state={ctxMenu.state} onClose={ctxMenu.close} />
      <Toaster />
      <Dialog />
      {hover && <HoverPreview file={hover.file} anchor={hover.anchor} />}
      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
      <CommandPalette open={showCmdK} commands={commands} onClose={() => setShowCmdK(false)} />
      {triageActive && (
        <TriageMode
          files={filtered}
          startIndex={[...selected][0] || 0}
          onClose={() => { setTriageActive(false); loadFolder(currentDir, { skipHistory: true }); }}
          onTrash={async (f) => { await window.bobeez.trash(f.path); }}
          onRate={(f, n) => setRating(f, n)}
        />
      )}
      {compareActive && (
        <CompareMode
          files={[...selected].slice(0, 2).map(i => filtered[i]).filter(Boolean)}
          onClose={() => setCompareActive(false)}
        />
      )}
      {showBatchExport && (
        <BatchExport
          files={[...selected].map(i => filtered[i]).filter(Boolean)}
          onClose={() => setShowBatchExport(false)}
        />
      )}
      {showWelcome && (
        <WelcomeScreen
          onClose={() => setShowWelcome(false)}
          onPickFolder={async () => {
            setShowWelcome(false);
            const p = await window.bobeez.openFolder();
            if (p) loadFolder(p);
          }}
        />
      )}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      <MascotReactions />
      {dragOver && (
        <div className="dragover-overlay">
          <img src={M.folder} alt="" />
          <h2>Dépose ton dossier ici</h2>
          <p>Bobeez va l'ouvrir directement</p>
        </div>
      )}
    </div>
  );
}
