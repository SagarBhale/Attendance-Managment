import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const overtimeApi = createApi({
  reducerPath: 'overtimeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/api/overtime`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Overtime'],
  endpoints: (builder) => ({
    createOvertimeRequest: builder.mutation({
      query: (data) => ({ url: '/', method: 'POST', body: data }),
      invalidatesTags: ['Overtime'],
    }),
    getOvertimeRequests: builder.query({
      query: (params) => ({ url: '/', params }),
      providesTags: ['Overtime'],
    }),
    reviewOvertimeRequest: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Overtime'],
    }),
  }),
});

export const {
  useCreateOvertimeRequestMutation,
  useGetOvertimeRequestsQuery,
  useReviewOvertimeRequestMutation,
} = overtimeApi;
