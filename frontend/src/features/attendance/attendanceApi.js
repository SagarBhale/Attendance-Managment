import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/api/attendance`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Attendance', 'Stats'],
  endpoints: (builder) => ({
    punchIn: builder.mutation({
      query: (data) => ({ url: '/punch-in', method: 'POST', body: data }),
      invalidatesTags: ['Attendance', 'Stats'],
    }),
    punchOut: builder.mutation({
      query: (data) => ({ url: '/punch-out', method: 'POST', body: data }),
      invalidatesTags: ['Attendance', 'Stats'],
    }),
    getTodayAttendance: builder.query({
      query: () => '/today',
      providesTags: ['Attendance'],
    }),
    getAttendance: builder.query({
      query: (params) => ({ url: '/', params }),
      providesTags: ['Attendance'],
    }),
    getAttendanceById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Attendance', id }],
    }),
    validateAttendance: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/${id}/validate`, method: 'PUT', body: data }),
      invalidatesTags: ['Attendance'],
    }),
    getStats: builder.query({
      query: () => '/stats',
      providesTags: ['Stats'],
    }),
  }),
});

export const {
  usePunchInMutation,
  usePunchOutMutation,
  useGetTodayAttendanceQuery,
  useGetAttendanceQuery,
  useGetAttendanceByIdQuery,
  useValidateAttendanceMutation,
  useGetStatsQuery,
} = attendanceApi;
