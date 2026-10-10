import { getDocs, collection } from 'firebase/firestore';
import { ref, uploadString, getStorage } from 'firebase/storage';
import { db, app } from './firebase';

const storage = getStorage(app);

const COLLECTIONS_TO_BACKUP = [
  'projects',
  'clients',
  'finances',
  'settings',
  'usuarios',
  'cursos',
  'tickets'
];

export async function performAdminBackup() {
  const backupData: Record<string, any> = {};

  for (const collectionName of COLLECTIONS_TO_BACKUP) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      backupData[collectionName] = data;
    } catch (error) {
      console.error(`Error backing up collection ${collectionName}:`, error);
    }
  }

  const date = new Date().toISOString().split('T')[0];
  const backupRef = ref(storage, `backups/admin/${date}/backup.json`);

  await uploadString(backupRef, JSON.stringify(backupData), 'raw', {
    contentType: 'application/json',
  });

  return `Backup completed for ${date}`;
}
