import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUsername } from '@/store/settingsSlice';

const USERNAME_KEY = 'safran-smart-track:username';

export function useAuth() {
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.settings.username);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUsername() {
      const storedUsername = await AsyncStorage.getItem(USERNAME_KEY);
      if (mounted && storedUsername) {
        dispatch(setUsername(storedUsername));
      }
      if (mounted) {
        setIsLoading(false);
      }
    }

    loadUsername().catch(() => {
      if (mounted) {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  const saveUsername = useCallback(
    async (value: string) => {
      const trimmedValue = value.trim();
      await AsyncStorage.setItem(USERNAME_KEY, trimmedValue);
      dispatch(setUsername(trimmedValue));
    },
    [dispatch]
  );

  return {
    username,
    isLoading,
    hasUsername: username.trim().length > 0,
    saveUsername,
  };
}
