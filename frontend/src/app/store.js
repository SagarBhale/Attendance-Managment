import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import { authApi } from '../features/auth/authApi';
import { attendanceApi } from '../features/attendance/attendanceApi';
import { overtimeApi } from '../features/overtime/overtimeApi';
import { reportsApi } from '../features/reports/reportsApi';
import { usersApi } from '../features/users/usersApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [attendanceApi.reducerPath]: attendanceApi.reducer,
    [overtimeApi.reducerPath]: overtimeApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      attendanceApi.middleware,
      overtimeApi.middleware,
      reportsApi.middleware,
      usersApi.middleware
    ),
});

export default store;
