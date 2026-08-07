import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/api/auth`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({ url: '/login', method: 'POST', body: credentials }),
    }),
    register: builder.mutation({
      query: (userData) => ({ url: '/register', method: 'POST', body: userData }),
    }),
    getMe: builder.query({
      query: () => '/me',
      providesTags: ['Auth'],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({ url: '/profile', method: 'PUT', body: data }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useGetMeQuery, useUpdateProfileMutation } = authApi;
