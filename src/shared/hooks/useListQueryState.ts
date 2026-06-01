import { useState } from 'react';
import type { ListQuery } from '../../types';

export function createListQuery<TFilters extends object>(
  pageSize: number,
  sortBy: string,
  sortOrder: 'asc' | 'desc',
): ListQuery<TFilters> {
  return { page: 1, pageSize, sortBy, sortOrder, search: '', filters: {} as TFilters };
}

export function useListQueryState<TFilters extends object>(
  pageSize: number,
  sortBy: string,
  sortOrder: 'asc' | 'desc',
) {
  return useState<ListQuery<TFilters>>(() => createListQuery<TFilters>(pageSize, sortBy, sortOrder));
}
