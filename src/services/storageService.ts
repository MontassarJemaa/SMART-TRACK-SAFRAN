// Local Storage Service (AsyncStorage)
// Handles offline data persistence and caching

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Project,
  ToolItem,
  ScanHistory,
  UserProfile,
} from '../types';

// Storage keys
export const STORAGE_KEYS = {
  PROJECTS: 'projects',
  TOOLS: 'tools',
  SCAN_HISTORY: 'scan_history',
  USER_PROFILE: 'user_profile',
  RFID_TAGS: 'rfid_tags',
  SYNC_QUEUE: 'sync_queue',
  LAST_SYNC: 'last_sync',
  OFFLINE_MODE: 'offline_mode',
} as const;

// ========== PROJECT STORAGE ==========

export async function saveProjectsLocal(projects: Project[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch (error) {
    console.error('Error saving projects locally:', error);
    throw error;
  }
}

export async function getProjectsLocal(): Promise<Project[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error retrieving projects locally:', error);
    return [];
  }
}

export async function addProjectLocal(project: Project): Promise<void> {
  try {
    const projects = await getProjectsLocal();
    const exists = projects.find((p) => p.id === project.id);

    if (!exists) {
      projects.push(project);
      await saveProjectsLocal(projects);
    }
  } catch (error) {
    console.error('Error adding project locally:', error);
    throw error;
  }
}

export async function deleteProjectLocal(projectId: string): Promise<void> {
  try {
    const projects = await getProjectsLocal();
    const filtered = projects.filter((p) => p.id !== projectId);
    await saveProjectsLocal(filtered);
  } catch (error) {
    console.error('Error deleting project locally:', error);
    throw error;
  }
}

// ========== TOOL STORAGE ==========

export async function saveToolsLocal(tools: ToolItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(tools));
  } catch (error) {
    console.error('Error saving tools locally:', error);
    throw error;
  }
}

export async function getToolsLocal(): Promise<ToolItem[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TOOLS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error retrieving tools locally:', error);
    return [];
  }
}

export async function getProjectToolsLocal(projectId: string): Promise<ToolItem[]> {
  try {
    const tools = await getToolsLocal();
    return tools.filter((t) => t.projectId === projectId);
  } catch (error) {
    console.error('Error retrieving project tools locally:', error);
    return [];
  }
}

export async function addToolLocal(tool: ToolItem): Promise<void> {
  try {
    const tools = await getToolsLocal();
    const exists = tools.find((t) => t.id === tool.id);

    if (!exists) {
      tools.push(tool);
      await saveToolsLocal(tools);
    }
  } catch (error) {
    console.error('Error adding tool locally:', error);
    throw error;
  }
}

export async function updateToolLocal(toolId: string, updates: Partial<ToolItem>): Promise<void> {
  try {
    const tools = await getToolsLocal();
    const index = tools.findIndex((t) => t.id === toolId);

    if (index !== -1) {
      tools[index] = { ...tools[index], ...updates };
      await saveToolsLocal(tools);
    }
  } catch (error) {
    console.error('Error updating tool locally:', error);
    throw error;
  }
}

export async function deleteToolLocal(toolId: string): Promise<void> {
  try {
    const tools = await getToolsLocal();
    const filtered = tools.filter((t) => t.id !== toolId);
    await saveToolsLocal(filtered);
  } catch (error) {
    console.error('Error deleting tool locally:', error);
    throw error;
  }
}

// ========== SCAN HISTORY STORAGE ==========

export async function saveScanHistoryLocal(history: ScanHistory[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving scan history locally:', error);
    throw error;
  }
}

export async function getScanHistoryLocal(): Promise<ScanHistory[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error retrieving scan history locally:', error);
    return [];
  }
}

export async function addScanHistoryLocal(scan: ScanHistory): Promise<void> {
  try {
    const history = await getScanHistoryLocal();
    history.push(scan);
    await saveScanHistoryLocal(history);
  } catch (error) {
    console.error('Error adding scan history locally:', error);
    throw error;
  }
}

// ========== USER PROFILE STORAGE ==========

export async function saveUserProfileLocal(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving user profile locally:', error);
    throw error;
  }
}

export async function getUserProfileLocal(): Promise<UserProfile | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving user profile locally:', error);
    return null;
  }
}

// ========== SYNC QUEUE ==========

export type SyncQueueItem =
  | SyncQueueProjectItem
  | SyncQueueToolItem
  | SyncQueueScanItem;
type NewSyncQueueItem = Omit<SyncQueueProjectItem, 'id' | 'timestamp' | 'retries'>
  | Omit<SyncQueueToolItem, 'id' | 'timestamp' | 'retries'>
  | Omit<SyncQueueScanItem, 'id' | 'timestamp' | 'retries'>;

interface SyncQueueBase {
  id: string;
  action: 'create' | 'update' | 'delete';
  timestamp: number;
  retries: number;
}

interface SyncQueueProjectItem extends SyncQueueBase {
  entity: 'project';
  data: Project;
}

interface SyncQueueToolItem extends SyncQueueBase {
  entity: 'tool';
  data: ToolItem;
}

interface SyncQueueScanItem extends SyncQueueBase {
  action: 'create';
  entity: 'scan';
  data: ScanHistory;
}

export async function addToSyncQueue(item: NewSyncQueueItem): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const base = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retries: 0,
    };
    const syncItem: SyncQueueItem = { ...base, ...item };

    queue.push(syncItem);
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding to sync queue:', error);
    throw error;
  }
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error retrieving sync queue:', error);
    return [];
  }
}

export async function removeSyncQueueItem(itemId: string): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const filtered = queue.filter((item) => item.id !== itemId);
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing sync queue item:', error);
    throw error;
  }
}

// ========== OFFLINE MODE ==========

export async function setOfflineMode(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, JSON.stringify(enabled));
  } catch (error) {
    console.error('Error setting offline mode:', error);
    throw error;
  }
}

export async function isOfflineMode(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_MODE);
    return data ? JSON.parse(data) : false;
  } catch (error) {
    console.error('Error checking offline mode:', error);
    return false;
  }
}

// ========== SYNC TRACKING ==========

export async function setLastSync(timestamp: number): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, JSON.stringify(timestamp));
  } catch (error) {
    console.error('Error setting last sync:', error);
    throw error;
  }
}

export async function getLastSync(): Promise<number | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting last sync:', error);
    return null;
  }
}

// ========== CACHE CLEARING ==========

export async function clearAllLocalData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Error clearing local data:', error);
    throw error;
  }
}
