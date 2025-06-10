import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { RootState } from '../types';
import authSlice from './slices/authSlice';
import matchSlice from './slices/matchSlice';
import messageSlice from './slices/messageSlice';
import sessionSlice from './slices/sessionSlice';
import skillSlice from './slices/skillSlice';
import userSlice from './slices/userSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    skills: skillSlice,
    sessions: sessionSlice,
    messages: messageSlice,
    matches: matchSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
