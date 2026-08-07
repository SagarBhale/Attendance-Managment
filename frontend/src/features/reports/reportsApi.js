import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const reportsApi = createApi({
  reducerPath: 'reportsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/api/reports`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Reports'],
  endpoints: (builder) => ({
    getDailyReport: builder.query({
      query: (params) => ({ url: '/daily', params }),
      providesTags: ['Reports'],
    }),
    getSummary: builder.query({
      query: (params) => ({ url: '/summary', params }),
      providesTags: ['Reports'],
    }),
  }),
});

export const { useGetDailyReportQuery, useGetSummaryQuery } = reportsApi;
