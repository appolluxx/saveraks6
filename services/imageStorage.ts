export class ImageStorage {
  private dbName = 'SaveRaksImages';
  private storeName = 'tempImages';

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(true);
      request.onerror = reject;
    });
  }

  async save(id: string, data: any) {
    const db = await this.getDB();
    const tx = db.transaction(this.storeName, 'readwrite');
    tx.objectStore(this.storeName).put({ id, ...data, timestamp: Date.now() });
  }

  async delete(id: string) {
    const db = await this.getDB();
    const tx = db.transaction(this.storeName, 'readwrite');
    tx.objectStore(this.storeName).delete(id);
  }

  private getDB(): Promise<IDBDatabase> {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

export const imageStorage = new ImageStorage();