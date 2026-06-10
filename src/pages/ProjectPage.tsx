import { useState, useMemo } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import { TABLE_COLUMNS, PAGE_NAMES } from '../constants';
import { mockProjects } from '../mocks/projects';
import type { ProjectItem } from '../types';

export function ProjectPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredData = useMemo(() => {
    return mockProjects.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manager.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const columns: Column<ProjectItem>[] = [
    { key: 'id', header: TABLE_COLUMNS.PROJECT_ID },
    { key: 'name', header: TABLE_COLUMNS.PROJECT_NAME },
    { key: 'clientName', header: TABLE_COLUMNS.CLIENT_NAME },
    { key: 'status', header: TABLE_COLUMNS.STATUS },
    { key: 'startDate', header: TABLE_COLUMNS.START_DATE },
    { 
      key: 'endDate', 
      header: TABLE_COLUMNS.END_DATE, 
      render: (item) => item.endDate || '-' 
    },
    { key: 'manager', header: TABLE_COLUMNS.MANAGER },
  ];

  return (
    <DataPage 
      title={PAGE_NAMES.PROJECT_INFO}
      data={filteredData}
      columns={columns}
      emptyMessage="案件データがありません"
      headerRight={
        <input
          type="text"
          placeholder="案件名、クライアント名、担当者で検索..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ minWidth: '300px', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-subtle)', color: 'var(--color-text-main)' }}
        />
      }
    />
  );
}
