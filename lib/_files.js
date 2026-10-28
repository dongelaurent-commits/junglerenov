/* JungleRenov — couche IndexedDB pour stocker le contenu binaire des pièces téléversées.
   localStorage est limité à ~5 Mo total et ne supporte que des strings ; IndexedDB
   accepte les Blobs et offre plusieurs centaines de Mo. Le code reste 100% client-side,
   compatible avec la V1 statique. */
(function(){
  const DB_NAME = 'junglerenov';
  const STORE   = 'files';
  const VERSION = 1;
  let _dbPromise = null;

  function openDB(){
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)){
          const os = db.createObjectStore(STORE, { keyPath: 'id' });
          os.createIndex('clientId', 'clientId', { unique: false });
          os.createIndex('pieceId',  'pieceId',  { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
    return _dbPromise;
  }

  function tx(mode){
    return openDB().then(db => db.transaction(STORE, mode).objectStore(STORE));
  }

  /* Enregistre un fichier (File ou Blob) sous une clé unique.
     `id` = identifiant logique de la pièce (ex: "avis-impot", "devis-combles").
     Retourne la metadata enregistrée. */
  async function saveFile({ id, clientId, pieceId, file, label }){
    const store = await tx('readwrite');
    const record = {
      id: id || ('file-' + Date.now() + '-' + Math.random().toString(36).slice(2,8)),
      clientId: clientId || 'anonymous',
      pieceId: pieceId || null,
      label: label || (file && file.name) || 'document',
      name: file && file.name,
      size: file && file.size,
      mime: file && file.type,
      blob: file,
      uploadedAt: new Date().toISOString(),
    };
    return new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror   = () => reject(req.error);
    });
  }

  /* Récupère le record complet (avec blob) par son id logique. */
  async function getFile(id){
    const store = await tx('readonly');
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror   = () => reject(req.error);
    });
  }

  /* Récupère uniquement la metadata (sans le blob, pour économiser la mémoire). */
  async function getMeta(id){
    const r = await getFile(id);
    if (!r) return null;
    const { blob, ...meta } = r;
    return meta;
  }

  /* Liste tous les fichiers stockés (metadata seulement). */
  async function listAll(){
    const store = await tx('readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const out = (req.result || []).map(r => { const { blob, ...m } = r; return m; });
        resolve(out);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /* Supprime un fichier par son id logique. */
  async function deleteFile(id){
    const store = await tx('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror   = () => reject(req.error);
    });
  }

  /* Déclenche un download via Blob URL : récupère le fichier puis simule un clic. */
  async function downloadFile(id){
    const r = await getFile(id);
    if (!r || !r.blob){
      throw new Error('Fichier introuvable : ' + id);
    }
    const url = URL.createObjectURL(r.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = r.name || (r.label + '.bin');
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 200);
    return r;
  }

  /* Ouvre le fichier dans un nouvel onglet (preview natif PDF / image). */
  async function previewFile(id){
    const r = await getFile(id);
    if (!r || !r.blob) throw new Error('Fichier introuvable : ' + id);
    const url = URL.createObjectURL(r.blob);
    window.open(url, '_blank', 'noopener');
    // L'URL est révoquée par le browser quand la fenêtre est fermée.
    return r;
  }

  // Expose globalement
  window.RFFiles = { saveFile, getFile, getMeta, listAll, deleteFile, downloadFile, previewFile };
})();
