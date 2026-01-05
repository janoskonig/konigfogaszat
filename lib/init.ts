import { initDB } from './storage';
import { setSetting } from './storage';
import { hashPassword } from './auth';

export async function initializeDatabase(): Promise<void> {
  try {
    // Initialize IndexedDB
    await initDB();
    
    // Check if this is first-time setup
    const isFirstTime = !localStorage.getItem('db_initialized');
    
    if (isFirstTime) {
      // Set default dentist password
      const defaultPassword = 'admin';
      const passwordHash = await hashPassword(defaultPassword);
      await setSetting('dentist_password_hash', passwordHash);
      
      // Mark as initialized
      localStorage.setItem('db_initialized', 'true');
      
      console.log('Database initialized with default password: admin');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

