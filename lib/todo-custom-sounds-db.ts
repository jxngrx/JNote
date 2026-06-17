'use client';

export type TodoCustomSoundSlot = 'complete' | 'move';

const DB_NAME = 'noterx-todo-sounds-v1';
const STORE_NAME = 'sounds';
const DB_VERSION = 1;

type StoredSound = {
  slot: TodoCustomSoundSlot;
  name: string;
  mimeType: string;
  blob: Blob;
  updatedAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'slot' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const request = handler(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(request.error ?? new Error('IndexedDB transaction failed'));

        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          reject(tx.error ?? new Error('IndexedDB transaction failed'));
          db.close();
        };
      })
  );
}

export async function saveTodoCustomSound(
  slot: TodoCustomSoundSlot,
  file: File
): Promise<void> {
  const record: StoredSound = {
    slot,
    name: file.name,
    mimeType: file.type || 'audio/mpeg',
    blob: file,
    updatedAt: Date.now(),
  };

  await runTransaction('readwrite', (store) => store.put(record));
}

export async function getTodoCustomSound(
  slot: TodoCustomSoundSlot
): Promise<StoredSound | null> {
  try {
    const result = await runTransaction<StoredSound | undefined>(
      'readonly',
      (store) => store.get(slot)
    );
    return result ?? null;
  } catch {
    return null;
  }
}

export async function deleteTodoCustomSound(
  slot: TodoCustomSoundSlot
): Promise<void> {
  await runTransaction('readwrite', (store) => store.delete(slot));
}

export async function playTodoCustomSound(
  slot: TodoCustomSoundSlot,
  volume = 0.9
): Promise<void> {
  const record = await getTodoCustomSound(slot);
  if (!record) return;

  const url = URL.createObjectURL(record.blob);
  const audio = new Audio(url);
  audio.volume = volume;

  try {
    await audio.play();
    audio.addEventListener(
      'ended',
      () => {
        URL.revokeObjectURL(url);
      },
      { once: true }
    );
  } catch {
    URL.revokeObjectURL(url);
  }
}
