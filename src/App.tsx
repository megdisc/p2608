import { useState } from 'react';
import './index.css';

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
};

type MasterItem = {
  id: string;
  name: string;
  category: string;
  supplier: string;
  standardPrice: number;
  location: string;
};

type LocationItem = {
  id: string;
  name: string;
  type: string;
  description: string;
};

type CategoryItem = {
  id: string;
  name: string;
  description: string;
};

type SupplierItem = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
};

const initialInventoryData: InventoryItem[] = [
  { id: 'ING-001', name: '強力粉 (カメリヤ) 25kg', quantity: 12 },
  { id: 'ING-002', name: '薄力粉 (バイオレット) 25kg', quantity: 5 },
  { id: 'ING-003', name: 'ドライイースト 500g', quantity: 20 },
  { id: 'ING-004', name: '上白糖 30kg', quantity: 3 },
  { id: 'ING-005', name: '粗塩 5kg', quantity: 8 },
  { id: 'ING-006', name: '無塩バター 450g', quantity: 40 },
  { id: 'ING-007', name: '牛乳 (業務用) 1000ml', quantity: 24 },
  { id: 'ING-008', name: '鶏卵 (Lサイズ) 10kg', quantity: 4 },
];

const initialMasterData: MasterItem[] = [
  { id: 'ING-001', name: '強力粉 (カメリヤ) 25kg', category: '粉類', supplier: '日清製粉', standardPrice: 7500, location: '倉庫A' },
  { id: 'ING-002', name: '薄力粉 (バイオレット) 25kg', category: '粉類', supplier: '日清製粉', standardPrice: 6800, location: '倉庫A' },
  { id: 'ING-003', name: 'ドライイースト 500g', category: '酵母・膨張剤', supplier: 'サフ', standardPrice: 1200, location: '冷蔵庫1' },
  { id: 'ING-004', name: '上白糖 30kg', category: '糖類', supplier: '三井製糖', standardPrice: 5400, location: '倉庫B' },
  { id: 'ING-005', name: '粗塩 5kg', category: '調味料', supplier: '伯方の塩', standardPrice: 850, location: '倉庫B' },
  { id: 'ING-006', name: '無塩バター 450g', category: '乳製品', supplier: 'よつ葉乳業', standardPrice: 950, location: '冷蔵庫2' },
  { id: 'ING-007', name: '牛乳 (業務用) 1000ml', category: '乳製品', supplier: '明治', standardPrice: 280, location: '冷蔵庫2' },
  { id: 'ING-008', name: '鶏卵 (Lサイズ) 10kg', category: '生鮮食品', supplier: 'JA全農', standardPrice: 3200, location: '冷蔵庫3' },
];

const initialLocationData: LocationItem[] = [
  { id: 'LOC-001', name: '倉庫A', type: '常温', description: '粉類・乾物用メイン倉庫' },
  { id: 'LOC-002', name: '倉庫B', type: '常温', description: '調味料・糖類・包材' },
  { id: 'LOC-003', name: '冷蔵庫1', type: '冷蔵 (4℃)', description: 'イースト・仕込み水用' },
  { id: 'LOC-004', name: '冷蔵庫2', type: '冷蔵 (4℃)', description: '乳製品（バター・牛乳等）' },
  { id: 'LOC-005', name: '冷蔵庫3', type: '冷蔵 (8℃)', description: '生鮮食品（卵・フィリング等）' },
  { id: 'LOC-006', name: '冷凍庫A', type: '冷凍 (-18℃)', description: '冷凍生地・冷凍フルーツ' },
];

const initialCategoryData: CategoryItem[] = [
  { id: 'CAT-001', name: '粉類', description: '強力粉、薄力粉、ライ麦粉など' },
  { id: 'CAT-002', name: '酵母・膨張剤', description: 'イースト、ベーキングパウダーなど' },
  { id: 'CAT-003', name: '糖類', description: '上白糖、グラニュー糖、三温糖など' },
  { id: 'CAT-004', name: '調味料', description: '塩、スパイス類など' },
  { id: 'CAT-005', name: '乳製品', description: 'バター、牛乳、チーズなど' },
  { id: 'CAT-006', name: '生鮮食品', description: '卵、生鮮フルーツ、野菜など' },
];

const initialSupplierData: SupplierItem[] = [
  { id: 'SUP-001', name: '日清製粉', contactPerson: '山田 太郎', phone: '03-xxxx-0001' },
  { id: 'SUP-002', name: 'サフ (輸入代理店)', contactPerson: '佐藤 花子', phone: '03-xxxx-0002' },
  { id: 'SUP-003', name: '三井製糖', contactPerson: '鈴木 一郎', phone: '03-xxxx-0003' },
  { id: 'SUP-004', name: '伯方の塩', contactPerson: '田中 次郎', phone: '089-xxx-0004' },
  { id: 'SUP-005', name: 'よつ葉乳業', contactPerson: '伊藤 健太', phone: '011-xxx-0005' },
  { id: 'SUP-006', name: '明治', contactPerson: '渡辺 真理', phone: '03-xxxx-0006' },
  { id: 'SUP-007', name: 'JA全農', contactPerson: '小林 大輔', phone: '03-xxxx-0007' },
];

type Tab = 'inventory' | 'master' | 'location' | 'category' | 'supplier';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  const [inventoryItems] = useState<InventoryItem[]>(initialInventoryData);
  const [masterItems] = useState<MasterItem[]>(initialMasterData);
  const [locationItems] = useState<LocationItem[]>(initialLocationData);
  const [categoryItems] = useState<CategoryItem[]>(initialCategoryData);
  const [supplierItems] = useState<SupplierItem[]>(initialSupplierData);

  return (
    <div className="container">
      <header className="header">
        <h1>在庫管理システム</h1>
        <span className="system-id">p2608</span>
      </header>
      
      <nav className="nav-menu">
        <button 
          className={`nav-button ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          在庫一覧
        </button>
        <button 
          className={`nav-button ${activeTab === 'master' ? 'active' : ''}`}
          onClick={() => setActiveTab('master')}
        >
          品目一覧 (マスタ)
        </button>
        <button 
          className={`nav-button ${activeTab === 'category' ? 'active' : ''}`}
          onClick={() => setActiveTab('category')}
        >
          カテゴリ一覧
        </button>
        <button 
          className={`nav-button ${activeTab === 'supplier' ? 'active' : ''}`}
          onClick={() => setActiveTab('supplier')}
        >
          仕入先一覧
        </button>
        <button 
          className={`nav-button ${activeTab === 'location' ? 'active' : ''}`}
          onClick={() => setActiveTab('location')}
        >
          保管場所一覧
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'inventory' && (
          <>
            <h2>在庫一覧</h2>
            <div className="table-container">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>品名</th>
                    <th>在庫数量</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems.map((item) => (
                    <tr key={item.id}>
                      <td className="item-id">{item.id}</td>
                      <td>{item.name}</td>
                      <td className="quantity">{item.quantity}</td>
                    </tr>
                  ))}
                  {inventoryItems.length === 0 && (
                    <tr>
                      <td colSpan={3} className="empty-message">在庫データがありません</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'master' && (
          <>
            <h2>管理品目マスタ</h2>
            <div className="table-container">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>品名</th>
                    <th>カテゴリ</th>
                    <th>仕入先</th>
                    <th>標準単価 (円)</th>
                    <th>保管場所</th>
                  </tr>
                </thead>
                <tbody>
                  {masterItems.map((item) => (
                    <tr key={item.id}>
                      <td className="item-id">{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>{item.supplier}</td>
                      <td className="quantity">{item.standardPrice.toLocaleString()}</td>
                      <td>{item.location}</td>
                    </tr>
                  ))}
                  {masterItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="empty-message">マスタデータがありません</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'category' && (
          <>
            <h2>カテゴリ一覧</h2>
            <div className="table-container">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>カテゴリ名</th>
                    <th>説明</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryItems.map((item) => (
                    <tr key={item.id}>
                      <td className="item-id">{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.description}</td>
                    </tr>
                  ))}
                  {categoryItems.length === 0 && (
                    <tr>
                      <td colSpan={3} className="empty-message">カテゴリデータがありません</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'supplier' && (
          <>
            <h2>仕入先一覧</h2>
            <div className="table-container">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>仕入先名</th>
                    <th>担当者</th>
                    <th>電話番号</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierItems.map((item) => (
                    <tr key={item.id}>
                      <td className="item-id">{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.contactPerson}</td>
                      <td>{item.phone}</td>
                    </tr>
                  ))}
                  {supplierItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="empty-message">仕入先データがありません</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'location' && (
          <>
            <h2>保管場所一覧</h2>
            <div className="table-container">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>保管場所名</th>
                    <th>温度帯区分</th>
                    <th>用途・説明</th>
                  </tr>
                </thead>
                <tbody>
                  {locationItems.map((item) => (
                    <tr key={item.id}>
                      <td className="item-id">{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.type}</td>
                      <td>{item.description}</td>
                    </tr>
                  ))}
                  {locationItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="empty-message">保管場所データがありません</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
