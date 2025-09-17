import React from 'react';
import Button from '@shared/components/ui/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

type TabType = 'medios' | 'redes';

interface PaginationState {
  currentPage: number;
  pageSize: number;
  count: number;
  previous: string | null;
  next: string | null;
}

interface DataPaginationProps {
  activeTab: TabType;
  currentData: any[];
  pagination: PaginationState;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

const DataPagination: React.FC<DataPaginationProps> = ({
  activeTab,
  currentData,
  pagination,
  onPreviousPage,
  onNextPage,
}) => {
  if (currentData.length === 0) {
    return null;
  }

  return (
    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando {(pagination.currentPage - 1) * pagination.pageSize + 1} -{' '}
            {Math.min(
              pagination.currentPage * pagination.pageSize,
              pagination.count
            )}{' '}
            de {pagination.count} {activeTab}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onPreviousPage}
            disabled={!pagination.previous}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Anterior
          </Button>

          <span className="text-sm text-gray-700 dark:text-gray-300 px-3">
            Página {pagination.currentPage}
          </span>

          <Button
            onClick={onNextPage}
            disabled={!pagination.next}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            Siguiente
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataPagination;
