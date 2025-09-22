import { configureStore } from '@reduxjs/toolkit'
import { authSlice } from './slices/authSlice'
import { userSlice } from './slices/userSlice'
import { adminSlice } from './slices/adminSlice'
import { uiSlice } from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    user: userSlice.reducer,
    admin: adminSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
