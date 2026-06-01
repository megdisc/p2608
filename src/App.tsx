import { useState } from 'react';
import './index.css';

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  location: string;
};

const initialData: InventoryItem[] = [
  { id: 'ITM-001', name: 'ノートパソコン', category: '電子機器', quantity: 15, location: 'A-01' },
  { id: 'ITM-002', name: 'ワイヤレスマウス', category: '周辺機器', quantity: 42, location: 'A-02' },
  { id: 'ITM-003', name: 'メカニカルキーボード', category: '周辺機器', quantity: 8, location: 'A-03' },
  { id: 'ITM-004', name: '27インチモニター', category: '電子機器', quantity: 12, location: 'B-01' },
  { id: 'ITM-005', name: 'HDMIケーブル (2m)', category: 'ケーブル', quantity: 105, location: 'C-01' },
  { id: 'ITM-006', name: 'USB-C ハブ', category: '周辺機器', quantity: 24, location: 'C-02' },
  { id: 'ITM-007', name: 'コピー用紙 A4', category: '消耗品', quantity: 500, location: 'D-01' },
];

function App() {
  const [items] = useState<InventoryItem[]>(initialData);

  return (
    <div className="container">
      <header className="header">
        <h1>在庫管理システム</h1>
        <span className="system-id">p2608</span>
      </header>
      
      <main className="main-content">
        <h2>在庫一覧</h2>
        
        <div className="table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>品名</th>
                <th>カテゴリ</th>
                <th>在庫数量</th>
                <th>保管場所</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="item-id">{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td className="quantity">{item.quantity}</td>
                  <td>{item.location}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-message">在庫データがありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default App;
