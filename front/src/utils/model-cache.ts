/**
 * ONNX 모델과 같은 대용량 이진 데이터를 위한 IndexedDB 기반 캐시 유틸리티
 */
const DB_NAME = 'ONNX_MODELS_CACHE';
const STORE_NAME = 'models';
const DB_VERSION = 1;

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const modelCache = {
  /**
   * 캐시된 데이터 가져오기 (Blob 대응)
   */
  get: async (key: string): Promise<ArrayBuffer | string | null> => {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = async () => {
          const result = request.result;
          if (!result) return resolve(null);

          // 저장된 데이터가 Blob인 경우 ArrayBuffer로 변환하여 반환
          if (result instanceof Blob) {
            const buffer = await result.arrayBuffer();
            resolve(buffer);
          } else {
            resolve(result);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB Get Error:', error);
      return null;
    }
  },

  /**
   * 데이터 캐싱하기 (대용량 대응을 위해 Blob으로 변환하여 저장 권장)
   */
  set: async (key: string, data: ArrayBuffer | string): Promise<void> => {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // 🚀 대용량 ArrayBuffer는 Blob으로 감싸서 저장하는 것이 브라우저 최적화에 유리함
        const dataToSave = data instanceof ArrayBuffer ? new Blob([data]) : data;

        const request = store.put(dataToSave, key);
        request.onsuccess = () => {
          console.log(`✅ 캐시 저장 성공: ${key}`);
          resolve();
        };
        request.onerror = () => {
          console.error(`❌ 캐시 저장 실패: ${key}`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.warn('IndexedDB Set Error:', error);
    }
  },

  clear: async (): Promise<void> => {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).clear();
  },
};
