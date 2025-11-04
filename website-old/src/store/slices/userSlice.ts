import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UserProfile {
  id: string
  email: string
  name: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  createdAt: string
  updatedAt: string
}

interface UserState {
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
}

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    fetchUserStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchUserSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.isLoading = false
      state.profile = action.payload
      state.error = null
    },
    fetchUserFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    updateUserProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload }
      }
    },
    clearUserError: (state) => {
      state.error = null
    },
  },
})

export const {
  fetchUserStart,
  fetchUserSuccess,
  fetchUserFailure,
  updateUserProfile,
  clearUserError,
} = userSlice.actions
