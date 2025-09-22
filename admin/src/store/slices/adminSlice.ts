import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  status: 'active' | 'inactive' | 'suspended'
  lastLogin: string
  createdAt: string
}

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  monthlyGrowth: number
}

interface AdminState {
  users: AdminUser[]
  stats: AdminStats | null
  selectedUser: AdminUser | null
  isLoading: boolean
  error: string | null
  filters: {
    search: string
    role: string
    status: string
  }
  pagination: {
    page: number
    limit: number
    total: number
  }
}

const initialState: AdminState = {
  users: [],
  stats: null,
  selectedUser: null,
  isLoading: false,
  error: null,
  filters: {
    search: '',
    role: '',
    status: '',
  },
  pagination: {
    page: 1,
    limit: 25,
    total: 0,
  },
}

export const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    fetchUsersStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchUsersSuccess: (state, action: PayloadAction<{ users: AdminUser[]; total: number }>) => {
      state.isLoading = false
      state.users = action.payload.users
      state.pagination.total = action.payload.total
      state.error = null
    },
    fetchUsersFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    fetchStatsSuccess: (state, action: PayloadAction<AdminStats>) => {
      state.stats = action.payload
    },
    setSelectedUser: (state, action: PayloadAction<AdminUser | null>) => {
      state.selectedUser = action.payload
    },
    updateUser: (state, action: PayloadAction<AdminUser>) => {
      const index = state.users.findIndex(user => user.id === action.payload.id)
      if (index !== -1) {
        state.users[index] = action.payload
      }
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(user => user.id !== action.payload)
    },
    setFilters: (state, action: PayloadAction<Partial<AdminState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setPagination: (state, action: PayloadAction<Partial<AdminState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  fetchUsersStart,
  fetchUsersSuccess,
  fetchUsersFailure,
  fetchStatsSuccess,
  setSelectedUser,
  updateUser,
  deleteUser,
  setFilters,
  setPagination,
  clearError,
} = adminSlice.actions
