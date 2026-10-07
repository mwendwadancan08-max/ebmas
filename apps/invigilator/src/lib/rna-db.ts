export type LocalSittingStatus =
  | "DOWNLOADED"
  | "IN_PROGRESS"
  | "ENDED"
  | "TRANSFERRED";

export interface LocalDevice {
  id: string;
  deviceKey: string;
  name: string;
  schoolId: string | null;
  departmentId: string | null;
  registered: boolean;
  createdAt: string;
}

export interface LocalSitting {
  id: string;
  examPeriodId: string;
  courseUnitId: string;

  examinationName: string;
  academicYear: string;
  semester: string;

  schoolId: string;
  schoolName: string;
  departmentId: string;
  departmentName: string;

  courseId: string;
  courseCode: string;
  courseName: string;

  unitId: string;
  unitCode: string;
  unitName: string;

  yearOfStudy: number;

  startTime: string;
  endTime: string;

  status: LocalSittingStatus;
  downloadedAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

export interface LocalStudent {
  id: string;
  sittingId: string;
  studentId: string;

  regNumber: string;
  firstName: string;
  lastName: string;

  present: boolean;
}

export interface LocalBookletEntry {
  id: string;
  sittingId: string;
  studentId: string;
  bookletCode: string;
  present: boolean;
  recordedAt: string;
}

export interface LocalSyncBatch {
  id: string;
  sittingId: string;
  deviceKey: string;

  batchHash: string;
  receptionCode: string;

  createdAt: string;
  transferredAt: string | null;
  status: "READY" | "TRANSFERRED";
}

export interface AppMeta {
  key: string;
  value: string;
}

const DB_NAME = "ebmas-rna";
const DB_VERSION = 1;

const STORES = {
  device: "device",
  sittings: "sittings",
  students: "students",
  bookletEntries: "bookletEntries",
  syncBatches: "syncBatches",
  appMeta: "appMeta",
} as const;

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open RNA database"));
    };

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORES.device)) {
        db.createObjectStore(STORES.device, {
          keyPath: "id",
        });
      }

      if (!db.objectStoreNames.contains(STORES.sittings)) {
        const store = db.createObjectStore(STORES.sittings, {
          keyPath: "id",
        });

        store.createIndex("status", "status", {
          unique: false,
        });

        store.createIndex("examPeriodId", "examPeriodId", {
          unique: false,
        });
      }

      if (!db.objectStoreNames.contains(STORES.students)) {
        const store = db.createObjectStore(STORES.students, {
          keyPath: "id",
        });

        store.createIndex("sittingId", "sittingId", {
          unique: false,
        });

        store.createIndex("studentId", "studentId", {
          unique: false,
        });
      }

      if (!db.objectStoreNames.contains(STORES.bookletEntries)) {
        const store = db.createObjectStore(STORES.bookletEntries, {
          keyPath: "id",
        });

        store.createIndex("sittingId", "sittingId", {
          unique: false,
        });

        store.createIndex("studentId", "studentId", {
          unique: false,
        });

        store.createIndex("sittingBooklet", [
          "sittingId",
          "bookletCode",
        ], {
          unique: true,
        });
      }

      if (!db.objectStoreNames.contains(STORES.syncBatches)) {
        const store = db.createObjectStore(STORES.syncBatches, {
          keyPath: "id",
        });

        store.createIndex("sittingId", "sittingId", {
          unique: false,
        });

        store.createIndex("receptionCode", "receptionCode", {
          unique: true,
        });
      }

      if (!db.objectStoreNames.contains(STORES.appMeta)) {
        db.createObjectStore(STORES.appMeta, {
          keyPath: "key",
        });
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      db.onversionchange = () => {
        db.close();
        databasePromise = null;
      };

      resolve(db);
    };
  });

  return databasePromise;
}

function requestToPromise<T>(
  request: IDBRequest<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);

    request.onerror = () => {
      reject(
        request.error ??
          new Error("IndexedDB request failed")
      );
    };
  });
}

export async function putRecord<T>(
  storeName: string,
  value: T
): Promise<void> {
  const db = await openDatabase();

  const transaction = db.transaction(
    storeName,
    "readwrite"
  );

  transaction.objectStore(storeName).put(value);

  await transactionComplete(transaction);
}

export async function getRecord<T>(
  storeName: string,
  key: IDBValidKey
): Promise<T | undefined> {
  const db = await openDatabase();

  const transaction = db.transaction(
    storeName,
    "readonly"
  );

  return requestToPromise(
    transaction.objectStore(storeName).get(key)
  );
}

export async function getAllRecords<T>(
  storeName: string
): Promise<T[]> {
  const db = await openDatabase();

  const transaction = db.transaction(
    storeName,
    "readonly"
  );

  return requestToPromise(
    transaction.objectStore(storeName).getAll()
  );
}

export async function deleteRecord(
  storeName: string,
  key: IDBValidKey
): Promise<void> {
  const db = await openDatabase();

  const transaction = db.transaction(
    storeName,
    "readwrite"
  );

  transaction.objectStore(storeName).delete(key);

  await transactionComplete(transaction);
}

export async function clearStore(
  storeName: string
): Promise<void> {
  const db = await openDatabase();

  const transaction = db.transaction(
    storeName,
    "readwrite"
  );

  transaction.objectStore(storeName).clear();

  await transactionComplete(transaction);
}

export async function getSittingStudents(
  sittingId: string
): Promise<LocalStudent[]> {
  const db = await openDatabase();

  const transaction = db.transaction(
    STORES.students,
    "readonly"
  );

  const index = transaction
    .objectStore(STORES.students)
    .index("sittingId");

  return requestToPromise(
    index.getAll(sittingId)
  );
}

export async function getSittingBookletEntries(
  sittingId: string
): Promise<LocalBookletEntry[]> {
  const db = await openDatabase();

  const transaction = db.transaction(
    STORES.bookletEntries,
    "readonly"
  );

  const index = transaction
    .objectStore(STORES.bookletEntries)
    .index("sittingId");

  return requestToPromise(
    index.getAll(sittingId)
  );
}

function transactionComplete(
  transaction: IDBTransaction
): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();

    transaction.onerror = () => {
      reject(
        transaction.error ??
          new Error("IndexedDB transaction failed")
      );
    };

    transaction.onabort = () => {
      reject(
        transaction.error ??
          new Error("IndexedDB transaction aborted")
      );
    };
  });
}

export async function initializeRnaDatabase(): Promise<void> {
  await openDatabase();
}

export const RNA_STORES = STORES;