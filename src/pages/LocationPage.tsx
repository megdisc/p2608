import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import type { LocationItem } from '../types';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useLocations } from '../hooks';

export function LocationPage() {
  const { items, loading, fetchLocations, batchSaveLocations } = useLocations();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchLocations().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchLocations, showAlert]);

  const columns: Column<LocationItem>[] = [
    { key: 'name', header: TABLE_COLUMNS.LOCATION_NAME, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'description', header: TABLE_COLUMNS.DESCRIPTION, editable: true, inputType: 'text' },
  ];

  const handleBatchSave = async (drafts: LocationItem[], deletedIds: string[]) => {
    try {
      await batchSaveLocations(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAdd = () => {
    return {
      id: `LOC-${Date.now()}`,
      name: '',
      yomigana: '',
      description: ''
    } as LocationItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.LOCATION}
      data={items} 
      columns={columns} 
      emptyMessage={MESSAGES.EMPTY_LOCATION} 
      initialSort={{ key: 'name', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
