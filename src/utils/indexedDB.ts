import { DEFAULT_SHIFT_COMBINATIONS } from '../constants';

interface DBSchema {
  schedule: {
    key: string;
    value: {
      date: string;
      shifts: string[];
    };
  };
  specialDates: {
    key: string;
    value: {
      date: string;
      isSpecial: boolean;
    };
  };
  settings: {
    key: string;
    value: any;
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: any;
    };
  };
  monthlySalaries: {
    key: string;
    value: {
      monthKey: string;
      salary: number;
    };
  };
  dateNotes: {
    key: string;
    value: {
      date: string;
      note: string;
    };
  };
  userSessions: {
    key: string;
    value: {
      userId: string;
      idNumber: string;
      surname?: string;
      name?: string;
      isAdmin: boolean;
    };
  };
}

class WorkScheduleDB {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'WorkScheduleDB';
  private readonly version = 7; // Incremented to apply new schedule saving fix
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if IndexedDB is available (important for iPhone)
      if (!window.indexedDB) {

        reject(new Error('IndexedDB not supported'));
        return;
      }
      
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {

        reject(new Error(`Failed to open database: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;

        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;


        // Create object stores
        if (!db.objectStoreNames.contains('schedule')) {
          db.createObjectStore('schedule', { keyPath: 'date' });
        }

        if (!db.objectStoreNames.contains('specialDates')) {
          db.createObjectStore('specialDates', { keyPath: 'date' });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('monthlySalaries')) {
          db.createObjectStore('monthlySalaries', { keyPath: 'monthKey' });
        }

        if (!db.objectStoreNames.contains('dateNotes')) {
          db.createObjectStore('dateNotes', { keyPath: 'date' });
        }

        if (!db.objectStoreNames.contains('userSessions')) {
          db.createObjectStore('userSessions', { keyPath: 'userId' });
        }
      };
      
      // Add timeout for iPhone compatibility
      setTimeout(() => {
        if (!this.db) {

          reject(new Error('Database initialization timeout'));
        }
      }, 10000); // 10 second timeout
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      // Database is not initialized, need to reopen

      this.db = null;
      this.initPromise = null;
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  async getSchedule(): Promise<Record<string, string[]>> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['schedule'], 'readonly');
      const store = transaction.objectStore('schedule');
      const request = store.getAll();

      request.onsuccess = () => {
        const result: Record<string, string[]> = {};
        request.result.forEach((item: { date: string; shifts: string[] }) => {
          result[item.date] = item.shifts;
        });
        resolve(result);
      };

      request.onerror = () => {
        reject(new Error('Failed to get schedule'));
      };
    });
  }

  async setSchedule(schedule: Record<string, string[]>): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['schedule'], 'readwrite');
      const store = transaction.objectStore('schedule');

      // Add transaction error handling
      transaction.onerror = () => {
        reject(new Error(`Transaction failed: ${transaction.error}`));
      };
      
      transaction.oncomplete = () => {
        resolve();
      };

      // First, get all existing keys to remove any that are no longer in the schedule
      const getAllRequest = store.getAllKeys();
      
      getAllRequest.onsuccess = () => {
        const existingKeys = getAllRequest.result;
        const newKeys = Object.keys(schedule).filter(key => schedule[key].length > 0);
        
        // Remove keys that are no longer in the schedule
        const keysToRemove = existingKeys.filter(key => !newKeys.includes(key as string));
        
        let pendingOperations = 0;
        let completedOperations = 0;
        let hasError = false;
        
        const checkCompletion = () => {
          completedOperations++;
          if (completedOperations === pendingOperations && !hasError) {
            // All operations completed successfully
          }
        };
        
        // Remove old entries
        keysToRemove.forEach(key => {
          pendingOperations++;
          const deleteRequest = store.delete(key);
          deleteRequest.onsuccess = checkCompletion;
          deleteRequest.onerror = () => {
            if (!hasError) {
              hasError = true;
              reject(new Error(`Failed to delete schedule for ${key}: ${deleteRequest.error}`));
            }
          };
        });
        
        // Add or update new entries
        Object.entries(schedule).forEach(([date, shifts]) => {
          if (shifts.length > 0) {
            pendingOperations++;
            const putRequest = store.put({ date, shifts });
            putRequest.onsuccess = checkCompletion;
            putRequest.onerror = () => {
              if (!hasError) {
                hasError = true;
                reject(new Error(`Failed to add schedule for ${date}: ${putRequest.error}`));
              }
            };
          }
        });
        
        // If no operations needed, transaction will complete normally
        if (pendingOperations === 0) {
          // No changes needed
        }
      };

      getAllRequest.onerror = () => {
        reject(new Error(`Failed to get existing schedule keys: ${getAllRequest.error}`));
      };
    });
  }

  async getSpecialDates(): Promise<Record<string, boolean>> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['specialDates'], 'readonly');
      const store = transaction.objectStore('specialDates');
      const request = store.getAll();

      request.onsuccess = () => {
        const result: Record<string, boolean> = {};
        request.result.forEach((item: { date: string; isSpecial: boolean }) => {
          result[item.date] = item.isSpecial;
        });
        resolve(result);
      };

      request.onerror = () => {
        reject(new Error('Failed to get special dates'));
      };
    });
  }

  async setSpecialDates(specialDates: Record<string, boolean>): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['specialDates'], 'readwrite');
      const store = transaction.objectStore('specialDates');

      // Add transaction error handling
      transaction.onerror = () => {
        reject(new Error(`Transaction failed: ${transaction.error}`));
      };
      
      transaction.oncomplete = () => {
        resolve();
      };

      // First, get all existing keys to remove any that are no longer special
      const getAllRequest = store.getAllKeys();
      
      getAllRequest.onsuccess = () => {
        const existingKeys = getAllRequest.result;
        const newKeys = Object.keys(specialDates).filter(key => specialDates[key] === true);
        
        // Remove keys that are no longer special dates
        const keysToRemove = existingKeys.filter(key => !newKeys.includes(key as string));
        
        let pendingOperations = 0;
        let completedOperations = 0;
        let hasError = false;
        
        const checkCompletion = () => {
          completedOperations++;
          if (completedOperations === pendingOperations && !hasError) {
            // All operations completed successfully
          }
        };
        
        // Remove old entries
        keysToRemove.forEach(key => {
          pendingOperations++;
          const deleteRequest = store.delete(key);
          deleteRequest.onsuccess = checkCompletion;
          deleteRequest.onerror = () => {
            if (!hasError) {
              hasError = true;
              reject(new Error(`Failed to delete special date for ${key}: ${deleteRequest.error}`));
            }
          };
        });
        
        // Add or update new entries
        Object.entries(specialDates).forEach(([date, isSpecial]) => {
          if (isSpecial) {
            pendingOperations++;
            const putRequest = store.put({ date, isSpecial });
            putRequest.onsuccess = checkCompletion;
            putRequest.onerror = () => {
              if (!hasError) {
                hasError = true;
                reject(new Error(`Failed to add special date for ${date}: ${putRequest.error}`));
              }
            };
          }
        });
        
        // If no operations needed, transaction will complete normally
        if (pendingOperations === 0) {
          // No changes needed
        }
      };

      getAllRequest.onerror = () => {
        reject(new Error(`Failed to get existing special dates keys: ${getAllRequest.error}`));
      };
    });
  }

  async getSetting<T>(key: string): Promise<T | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result ? request.result.value : null;
        
        // Special handling for workSettings to ensure shift combinations are present
        if (key === 'workSettings' && result && typeof result === 'object') {
          if (!result.shiftCombinations || result.shiftCombinations.length === 0) {
            const fixedResult = {
              ...result,
              shiftCombinations: DEFAULT_SHIFT_COMBINATIONS
            };
            
            // Save the fixed version back to the database
            this.setSetting(key, fixedResult).catch(err => {
              // Error handling
            });
            
            resolve(fixedResult);
            return;
          }
        }
        
        resolve(result);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get setting: ${key}`));
      };
    });
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      
      // Add transaction error handling
      transaction.onerror = () => {

        reject(new Error(`Transaction failed: ${transaction.error}`));
      };
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      const request = store.put({ key, value });

      request.onsuccess = () => {
        // Success
      };

      request.onerror = () => {

        reject(new Error(`Failed to set setting: ${key} - ${request.error}`));
      };
    });
  }

  async getMetadata<T>(key: string): Promise<T | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get metadata: ${key}`));
      };
    });
  }

  async setMetadata<T>(key: string, value: T): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      
      transaction.onerror = () => {

        reject(new Error(`Transaction failed: ${transaction.error}`));
      };
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      const request = store.put({ key, value });

      request.onsuccess = () => {
        // Success
      };

      request.onerror = () => {

        reject(new Error(`Failed to set metadata: ${key} - ${request.error}`));
      };
    });
  }

  async getDateNotes(): Promise<Record<string, string>> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['dateNotes'], 'readonly');
      const store = transaction.objectStore('dateNotes');
      const request = store.getAll();

      request.onsuccess = () => {
        const result: Record<string, string> = {};
        request.result.forEach((item: { date: string; note: string }) => {
          result[item.date] = item.note;
        });
        resolve(result);
      };

      request.onerror = () => {
        reject(new Error('Failed to get date notes'));
      };
    });
  }

  async setDateNotes(dateNotes: Record<string, string>): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['dateNotes'], 'readwrite');
      const store = transaction.objectStore('dateNotes');

      transaction.onerror = () => {
        reject(new Error(`Transaction failed: ${transaction.error}`));
      };
      
      transaction.oncomplete = () => {
        resolve();
      };

      // First, get all existing keys to remove any that are no longer in dateNotes
      const getAllRequest = store.getAllKeys();
      
      getAllRequest.onsuccess = () => {
        const existingKeys = getAllRequest.result;
        const newKeys = Object.keys(dateNotes).filter(key => dateNotes[key] && dateNotes[key].trim() !== '');
        
        // Remove keys that are no longer in dateNotes
        const keysToRemove = existingKeys.filter(key => !newKeys.includes(key as string));
        
        let pendingOperations = 0;
        let completedOperations = 0;
        let hasError = false;
        
        const checkCompletion = () => {
          completedOperations++;
          if (completedOperations === pendingOperations && !hasError) {
            // All operations completed successfully
          }
        };
        
        // Remove old entries
        keysToRemove.forEach(key => {
          pendingOperations++;
          const deleteRequest = store.delete(key);
          deleteRequest.onsuccess = checkCompletion;
          deleteRequest.onerror = () => {
            if (!hasError) {
              hasError = true;
              reject(new Error(`Failed to delete date note for ${key}: ${deleteRequest.error}`));
            }
          };
        });
        
        // Add or update new entries
        Object.entries(dateNotes).forEach(([date, note]) => {
          if (note) {
            pendingOperations++;
            const putRequest = store.put({ date, note });
            putRequest.onsuccess = checkCompletion;
            putRequest.onerror = () => {
              if (!hasError) {
                hasError = true;
                reject(new Error(`Failed to add date note for ${date}: ${putRequest.error}`));
              }
            };
          }
        });
        
        // If no operations needed, transaction will complete normally
        if (pendingOperations === 0) {
          // No changes needed
        }
      };

      getAllRequest.onerror = () => {
        reject(new Error(`Failed to get existing date notes keys: ${getAllRequest.error}`));
      };
    });
  }

  async saveUserSession(session: { userId: string; idNumber: string; surname?: string; name?: string; isAdmin: boolean }): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['userSessions'], 'readwrite');
      const store = transaction.objectStore('userSessions');
      
      transaction.onerror = () => {

        reject(new Error(`Transaction failed: ${transaction.error}`));
      };
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      const request = store.put(session);
      
      request.onsuccess = () => {
        // Success
      };
      
      request.onerror = () => {

        reject(new Error(`Failed to save user session: ${request.error}`));
      };
    });
  }

  async getUserSession(): Promise<{ userId: string; idNumber: string; surname?: string; name?: string; isAdmin: boolean } | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['userSessions'], 'readonly');
      const store = transaction.objectStore('userSessions');
      const request = store.get('staff_session');
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {

        reject(new Error(`Failed to get user session: ${request.error}`));
      };
    });
  }

  async removeUserSession(): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['userSessions'], 'readwrite');
      const store = transaction.objectStore('userSessions');
      const request = store.delete('staff_session');
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {

        reject(new Error(`Failed to remove user session: ${request.error}`));
      };
    });
  }

  async saveLastUsedIdNumber(idNumber: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['userSessions'], 'readwrite');
      const store = transaction.objectStore('userSessions');
      
      const request = store.put({ 
        userId: '_lastUsedIdNumber', 
        idNumber,
        isAdmin: false 
      });
      
      request.onsuccess = () => {
        // Success
      };
      
      request.onerror = () => {

        reject(new Error(`Failed to save ID number: ${request.error}`));
      };
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = () => {

        reject(new Error(`Transaction failed: ${transaction.error}`));
      };
    });
  }

  async getLastUsedIdNumber(): Promise<string | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['userSessions'], 'readonly');
      const store = transaction.objectStore('userSessions');
      const request = store.get('_lastUsedIdNumber');
      
      request.onsuccess = () => {
        const result = request.result?.idNumber || null;
        resolve(result);
      };
      
      request.onerror = () => {

        reject(new Error(`Failed to get last used ID number: ${request.error}`));
      };
    });
  }
}

export const workScheduleDB = new WorkScheduleDB();

// Convenience export functions for user session management
export const saveUserSession = async (session: { 
  userId: string; 
  idNumber: string; 
  surname?: string; 
  name?: string; 
  isAdmin: boolean 
}) => {
  await workScheduleDB.saveUserSession(session);
};

export const getUserSession = async () => {
  return await workScheduleDB.getUserSession();
};

export const removeUserSession = async () => {
  await workScheduleDB.removeUserSession();
};

export const saveLastUsedIdNumber = async (idNumber: string) => {
  await workScheduleDB.saveLastUsedIdNumber(idNumber);
};

export const getLastUsedIdNumber = async () => {
  return await workScheduleDB.getLastUsedIdNumber();
};

// Legacy functions for backward compatibility
export const initDB = (): Promise<IDBDatabase> => {
  return workScheduleDB.init().then(() => (workScheduleDB as any).db);
};
