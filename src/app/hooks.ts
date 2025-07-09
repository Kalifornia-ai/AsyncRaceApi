// src/app/hooks.ts (or wherever you keep your hooks)
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/** Use throughout your app instead of plain `useDispatch` */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/** Typed version of `useSelector` */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
