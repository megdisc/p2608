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
  { id: 'ING-001', name: '強力粉 (カメリヤ) 25kg', category: '粉類', quantity: 12, location: '倉庫A' },
  { id: 'ING-002', name: '薄力粉 (バイオレット) 25kg', category: '粉類', quantity: 5, location: '倉庫A' },
  { id: 'ING-003', name: 'ドライイースト 500g', category: '酵母・膨張剤', quantity: 20, location: '冷蔵庫1' },
  { id: 'ING-004', name: '上白糖 30kg', category: '糖類', quantity: 3, location: '倉庫B' },
  { id: 'ING-005', name: '粗塩 5kg', category: '調味料', quantity: 8, location: '倉庫B' },
  { id: 'ING-006', name: '無塩バター 450g', category: '乳製品', quantity: 40, location: '冷蔵庫2' },
  { id: 'ING-007', name: '牛乳 (業務用) 1000ml', category: '乳製品', quantity: 24, location: '冷蔵庫2' },
  { id: 'ING-008', name: '鶏卵 (Lサイズ) 10kg', category: '生鮮食品', quantity: 4, location: '冷蔵庫3' },
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
