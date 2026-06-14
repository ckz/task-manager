import { NextResponse } from 'next/server'
import { ApiResponse, ApiError } from '@/types/api'

export function successResponse<T>(data: T, meta?: ApiResponse<T>['meta']) {
  return NextResponse.json({ data, meta } as ApiResponse<T>)
}

export function errorResponse(code: string, message: string, status: number = 400) {
  return NextResponse.json(
    { error: { code, message } } as ApiError,
    { status }
  )
}

export function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}
