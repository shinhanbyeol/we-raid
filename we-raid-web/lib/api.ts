/* eslint-disable no-param-reassign */
import axios, { AxiosHeaders } from 'axios'
import { getSession } from 'next-auth/react'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

api.interceptors.request.use(async (config) => {
  const session = await getSession()
  if (session?.backendToken) {
    config.headers = config.headers ?? new AxiosHeaders()
    config.headers.Authorization = `Bearer ${session.backendToken}`
    return {
      ...config,
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
