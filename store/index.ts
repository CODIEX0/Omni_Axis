import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { MMKV } from 'react-native-mmkv';
import { combineReducers } from '@reduxjs/toolkit';

// Import slices
import authSlice from './slices/authSlice';
import portfolioSlice from './slices/portfolioSlice';
import marketplaceSlice from './slices/marketplaceSlice';
import walletSlice from './slices/walletSlice';
import kycSlice from './slices/kycSlice';
import notificationSlice from './slices/notificationSlice';
import settingsSlice from './slices/settingsSlice';
import communitySlice from './slices/communitySlice';

// MMKV storage for persistence
const storage = new MMKV();

const mmkvStorage = {
  setItem: (key: string, value: string) => {
    storage.set(key, value);
    return Promise.resolve(true);
  },
  getItem: (key: string) => {
    const value = storage.getString(key);
    return Promise.resolve(value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
    return Promise.resolve();
  },
};

const persistConfig = {
  key: 'root',
  storage: mmkvStorage,
  whitelist: ['auth', 'settings', 'wallet', 'community'],
};

const rootReducer = combineReducers({
  auth: authSlice,
  portfolio: portfolioSlice,
  marketplace: marketplaceSlice,
  wallet: walletSlice,
  kyc: kycSlice,
  notifications: notificationSlice,
  settings: settingsSlice,
  community: communitySlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;