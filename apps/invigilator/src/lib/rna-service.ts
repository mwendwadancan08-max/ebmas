import {
  type LocalBookletEntry,
  type LocalDevice,
  type LocalSitting,
  type LocalStudent,
  type LocalSyncBatch,
  getAllRecords,
  getRecord,
  getSittingBookletEntries,
  getSittingStudents,
  putRecord,
  RNA_STORES,
} from "./rna-db";

const DEVICE_ID = "local-device";

function now(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createDeviceKey(): string {
  const random = crypto.randomUUID()
    .replace(/-/g, "")
    .toUpperCase();

  return `RNA-${random.slice(0, 16)}`;
}

/**
 * Gets the local RNA device identity.
 *
 * The device key is generated ONCE and then permanently
 * stored locally for this installation.
 */
export async function getOrCreateDevice(): Promise<LocalDevice> {
  const existing = await getRecord<LocalDevice>(
    RNA_STORES.device,
    DEVICE_ID
  );

  if (existing) {
    return existing;
  }

  const device: LocalDevice = {
    id: DEVICE_ID,
    deviceKey: createDeviceKey(),
    name: "Unregistered Device",
    schoolId: null,
    departmentId: null,
    registered: false,
    createdAt: now(),
  };

  await putRecord(RNA_STORES.device, device);

  return device;
}

/**
 * Updates local device information.
 *
 * Central registration/pairing will later come from the
 * Admin API. For now this lets the local prototype hold
 * the same identity information.
 */
export async function updateDevice(
  changes: Partial<Omit<LocalDevice, "id" | "deviceKey" | "createdAt">>
): Promise<LocalDevice> {
  const device = await getOrCreateDevice();

  const updated: LocalDevice = {
    ...device,
    ...changes,
  };

  await putRecord(RNA_STORES.device, updated);

  return updated;
}

/**
 * Saves a complete examination sitting downloaded from
 * the central system.
 *
 * The sitting and its roster are stored locally together.
 * After this succeeds, the device no longer needs the
 * server to run that sitting.
 */
export async function downloadSitting(
  sitting: LocalSitting,
  students: LocalStudent[]
): Promise<void> {
  const existing = await getRecord<LocalSitting>(
    RNA_STORES.sittings,
    sitting.id
  );

  if (existing) {
    throw new Error(
      "This examination sitting is already downloaded."
    );
  }

  const downloadedSitting: LocalSitting = {
    ...sitting,
    status: "DOWNLOADED",
    downloadedAt: now(),
    startedAt: null,
    endedAt: null,
  };

  await putRecord(
    RNA_STORES.sittings,
    downloadedSitting
  );

  for (const student of students) {
    const localStudent: LocalStudent = {
      ...student,
      sittingId: sitting.id,
    };

    await putRecord(
      RNA_STORES.students,
      localStudent
    );
  }
}

/**
 * Returns all locally downloaded sittings.
 */
export async function getLocalSittings(): Promise<LocalSitting[]> {
  return getAllRecords<LocalSitting>(
    RNA_STORES.sittings
  );
}

/**
 * Returns one local sitting.
 */
export async function getLocalSitting(
  sittingId: string
): Promise<LocalSitting | undefined> {
  return getRecord<LocalSitting>(
    RNA_STORES.sittings,
    sittingId
  );
}

/**
 * Starts an examination locally.
 *
 * No server request is required.
 */
export async function startSitting(
  sittingId: string
): Promise<LocalSitting> {
  const sitting = await getLocalSitting(sittingId);

  if (!sitting) {
    throw new Error(
      "Examination sitting is not available on this device."
    );
  }

  if (
    sitting.status !== "DOWNLOADED" &&
    sitting.status !== "IN_PROGRESS"
  ) {
    throw new Error(
      "This examination cannot be started."
    );
  }

  if (sitting.status === "IN_PROGRESS") {
    return sitting;
  }

  const updated: LocalSitting = {
    ...sitting,
    status: "IN_PROGRESS",
    startedAt: now(),
  };

  await putRecord(
    RNA_STORES.sittings,
    updated
  );

  return updated;
}

/**
 * Saves or updates one student's booklet entry.
 *
 * The uniqueness rules are enforced locally:
 *
 * 1. One booklet entry per student per sitting.
 * 2. One booklet code per sitting.
 */
export async function saveAttendance(
  sittingId: string,
  studentId: string,
  present: boolean
): Promise<LocalStudent> {
  const sitting = await getLocalSitting(sittingId);

  if (!sitting) {
    throw new Error(
      "Examination sitting is not available locally."
    );
  }

  if (sitting.status !== "IN_PROGRESS") {
    throw new Error(
      "Attendance can only be recorded while the examination is in progress."
    );
  }

  const student = await getRecord<LocalStudent>(
    RNA_STORES.students,
    studentId
  );

  if (!student || student.sittingId !== sittingId) {
    throw new Error(
      "Student does not belong to this examination sitting."
    );
  }

  const updatedStudent: LocalStudent = {
    ...student,
    present,
  };

  await putRecord(
    RNA_STORES.students,
    updatedStudent
  );

  return updatedStudent;
}
export async function saveBookletEntry(
  sittingId: string,
  studentId: string,
  bookletCode: string,
  present: boolean = true
): Promise<LocalBookletEntry> {
  const sitting = await getLocalSitting(sittingId);

  if (!sitting) {
    throw new Error(
      "Examination sitting is not available locally."
    );
  }

  if (sitting.status !== "IN_PROGRESS") {
    throw new Error(
      "Booklet entries can only be recorded while the examination is in progress."
    );
  }

  const normalizedCode = bookletCode
    .trim()
    .toUpperCase();

  if (!normalizedCode) {
    throw new Error(
      "Booklet number cannot be empty."
    );
  }

  const students = await getSittingStudents(sittingId);

  const studentExists = students.some(
    (student) => student.studentId === studentId
  );

  if (!studentExists) {
    throw new Error(
      "Student does not belong to this examination sitting."
    );
  }

  const entries = await getSittingBookletEntries(
    sittingId
  );

  const existingStudentEntry = entries.find(
    (entry) => entry.studentId === studentId
  );

  const duplicateBooklet = entries.find(
    (entry) =>
      entry.bookletCode === normalizedCode &&
      entry.studentId !== studentId
  );

  if (duplicateBooklet) {
    throw new Error(
      `Booklet number ${normalizedCode} is already assigned in this sitting.`
    );
  }

  const entry: LocalBookletEntry = {
    id:
      existingStudentEntry?.id ??
      createId("booklet"),
    sittingId,
    studentId,
    bookletCode: normalizedCode,
    present,
    recordedAt: now(),
  };

  await putRecord(
    RNA_STORES.bookletEntries,
    entry
  );

  return entry;
}

/**
 * Removes the possibility of editing a submitted sitting.
 *
 * A reception code is generated when the exam ends.
 */
export async function endSitting(
  sittingId: string
): Promise<{
  sitting: LocalSitting;
  syncBatch: LocalSyncBatch;
}> {
  const sitting = await getLocalSitting(sittingId);

  if (!sitting) {
    throw new Error(
      "Examination sitting is not available locally."
    );
  }

  if (sitting.status !== "IN_PROGRESS") {
    throw new Error(
      "Only an examination in progress can be ended."
    );
  }

  const entries = await getSittingBookletEntries(
    sittingId
  );

  const device = await getOrCreateDevice();

  const payload = {
    sittingId,
    deviceKey: device.deviceKey,
    entries: entries
      .map((entry) => ({
        studentId: entry.studentId,
        bookletCode: entry.bookletCode,
        present: entry.present,
        recordedAt: entry.recordedAt,
      }))
      .sort((a, b) =>
        a.studentId.localeCompare(b.studentId)
      ),
  };

  const batchHash = await sha256(
    JSON.stringify(payload)
  );

  const receptionCode =
    `EB-${crypto.randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase()}`;

  const endedAt = now();

  const updatedSitting: LocalSitting = {
    ...sitting,
    status: "ENDED",
    endedAt,
  };

  const syncBatch: LocalSyncBatch = {
    id: createId("sync"),
    sittingId,
    deviceKey: device.deviceKey,
    batchHash,
    receptionCode,
    createdAt: endedAt,
    transferredAt: null,
    status: "READY",
  };

  await putRecord(
    RNA_STORES.sittings,
    updatedSitting
  );

  await putRecord(
    RNA_STORES.syncBatches,
    syncBatch
  );

  return {
    sitting: updatedSitting,
    syncBatch,
  };
}

/**
 * Gets the transfer package waiting on the device.
 */
export async function getTransferBatch(
  sittingId: string
): Promise<{
  sitting: LocalSitting;
  students: LocalStudent[];
  entries: LocalBookletEntry[];
  batch: LocalSyncBatch;
} | null> {
  const sitting = await getLocalSitting(sittingId);

  if (!sitting) {
    return null;
  }

  const batches = await getAllRecords<LocalSyncBatch>(
    RNA_STORES.syncBatches
  );

  const batch = batches.find(
    (item) => item.sittingId === sittingId
  );

  if (!batch) {
    return null;
  }

  const students = await getSittingStudents(
    sittingId
  );

  const entries = await getSittingBookletEntries(
    sittingId
  );

  return {
    sitting,
    students,
    entries,
    batch,
  };
}

/**
 * Marks a locally prepared batch as transferred.
 *
 * The central API will eventually perform this only after
 * successful server validation.
 */
export async function markTransferred(
  sittingId: string
): Promise<void> {
  const sitting = await getLocalSitting(sittingId);

  if (!sitting) {
    throw new Error(
      "Examination sitting is not available locally."
    );
  }

  const batches = await getAllRecords<LocalSyncBatch>(
    RNA_STORES.syncBatches
  );

  const batch = batches.find(
    (item) => item.sittingId === sittingId
  );

  if (!batch) {
    throw new Error(
      "No transfer batch exists for this sitting."
    );
  }

  const updatedBatch: LocalSyncBatch = {
    ...batch,
    status: "TRANSFERRED",
    transferredAt: now(),
  };

  const updatedSitting: LocalSitting = {
    ...sitting,
    status: "TRANSFERRED",
  };

  await putRecord(
    RNA_STORES.syncBatches,
    updatedBatch
  );

  await putRecord(
    RNA_STORES.sittings,
    updatedSitting
  );
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return Array.from(
    new Uint8Array(hashBuffer)
  )
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}
export type { LocalDevice };

export { getSittingStudents };
