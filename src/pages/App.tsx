import { useState, useRef, useEffect } from 'react';
import './index.css';

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
};

type MasterItem = {
  id: string;
  name: string;
  manufacturer: string;
  contentAmount: number;
  contentUnit: string;
  supplier: string;
  standardPrice: number;
  standardPurchaseQty: number;
  category: string;
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

type TransactionItem = {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  type: '受入' | '払出';
  quantity: number;
};

type StocktakingItem = {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  systemQty: number;
  actualQty: number;
  difference: number;
  personInCharge: string;
  location: string;
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
  { id: 'ING-001', name: '強力粉 (カメリヤ)', manufacturer: '日清製粉', contentAmount: 25, contentUnit: 'kg', supplier: '関東製菓材料卸(株)', standardPrice: 7500, standardPurchaseQty: 1, category: '粉類', location: '倉庫A' },
  { id: 'ING-002', name: '薄力粉 (バイオレット)', manufacturer: '日清製粉', contentAmount: 25, contentUnit: 'kg', supplier: '関東製菓材料卸(株)', standardPrice: 6800, standardPurchaseQty: 1, category: '粉類', location: '倉庫A' },
  { id: 'ING-003', name: 'ドライイースト', manufacturer: 'ルサッフル', contentAmount: 500, contentUnit: 'g', supplier: '関東製菓材料卸(株)', standardPrice: 1200, standardPurchaseQty: 10, category: '酵母・膨張剤', location: '冷蔵庫1' },
  { id: 'ING-004', name: '上白糖', manufacturer: '三井製糖', contentAmount: 30, contentUnit: 'kg', supplier: '第一食材商事', standardPrice: 5400, standardPurchaseQty: 1, category: '糖類', location: '倉庫B' },
  { id: 'ING-005', name: '粗塩', manufacturer: '伯方塩業', contentAmount: 5, contentUnit: 'kg', supplier: '第一食材商事', standardPrice: 850, standardPurchaseQty: 2, category: '調味料', location: '倉庫B' },
  { id: 'ING-006', name: '無塩バター', manufacturer: 'よつ葉乳業', contentAmount: 450, contentUnit: 'g', supplier: '丸越乳業販売(株)', standardPrice: 950, standardPurchaseQty: 30, category: '乳製品', location: '冷蔵庫2' },
  { id: 'ING-007', name: '牛乳 (業務用)', manufacturer: '明治', contentAmount: 1000, contentUnit: 'ml', supplier: '丸越乳業販売(株)', standardPrice: 280, standardPurchaseQty: 12, category: '乳製品', location: '冷蔵庫2' },
  { id: 'ING-008', name: '鶏卵 (Lサイズ)', manufacturer: 'JA全農', contentAmount: 10, contentUnit: 'kg', supplier: '新鮮農産流通協同組合', standardPrice: 3200, standardPurchaseQty: 2, category: '生鮮食品', location: '冷蔵庫3' },
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
  { id: 'SUP-001', name: '関東製菓材料卸(株)', contactPerson: '山田 太郎', phone: '03-xxxx-0001' },
  { id: 'SUP-002', name: '第一食材商事', contactPerson: '佐藤 花子', phone: '03-xxxx-0002' },
  { id: 'SUP-003', name: '丸越乳業販売(株)', contactPerson: '鈴木 一郎', phone: '03-xxxx-0003' },
  { id: 'SUP-004', name: '新鮮農産流通協同組合', contactPerson: '田中 次郎', phone: '042-xxx-0004' },
];

const initialTransactionData: TransactionItem[] = [
  { id: 'TRX-001', date: '2026-06-01 08:30', itemId: 'ING-001', itemName: '強力粉 (カメリヤ) 25kg', type: '受入', quantity: 10 },
  { id: 'TRX-002', date: '2026-06-01 09:15', itemId: 'ING-003', itemName: 'ドライイースト 500g', type: '払出', quantity: 1 },
  { id: 'TRX-003', date: '2026-06-01 10:00', itemId: 'ING-006', itemName: '無塩バター 450g', type: '払出', quantity: 2 },
  { id: 'TRX-004', date: '2026-06-01 11:30', itemId: 'ING-007', itemName: '牛乳 (業務用) 1000ml', type: '受入', quantity: 12 },
  { id: 'TRX-005', date: '2026-06-01 13:45', itemId: 'ING-008', itemName: '鶏卵 (Lサイズ) 10kg', type: '受入', quantity: 2 },
];

const initialStocktakingData: StocktakingItem[] = [
  { id: 'STK-001', date: '2026-05-31 18:00', itemId: 'ING-001', itemName: '強力粉 (カメリヤ)', systemQty: 12, actualQty: 12, difference: 0, personInCharge: '佐藤', location: '倉庫A' },
  { id: 'STK-002', date: '2026-05-31 18:15', itemId: 'ING-003', itemName: 'ドライイースト', systemQty: 21, actualQty: 20, difference: -1, personInCharge: '佐藤', location: '冷蔵庫1' },
  { id: 'STK-003', date: '2026-05-31 18:30', itemId: 'ING-006', itemName: '無塩バター', systemQty: 40, actualQty: 40, difference: 0, personInCharge: '鈴木', location: '冷蔵庫2' },
  { id: 'STK-004', date: '2026-05-31 18:45', itemId: 'ING-004', itemName: '上白糖', systemQty: 3, actualQty: 3, difference: 0, personInCharge: '鈴木', location: '倉庫B' },
];

type Tab = 'inventory' | 'master' | 'location' | 'category' | 'supplier' | 'transaction' | 'stocktaking';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  const [inventoryItems] = useState<InventoryItem[]>(initialInventoryData);
  const [masterItems] = useState<MasterItem[]>(initialMasterData);
  const [locationItems] = useState<LocationItem[]>(initialLocationData);
  const [categoryItems] = useState<CategoryItem[]>(initialCategoryData);
  const [supplierItems] = useState<SupplierItem[]>(initialSupplierData);
  const [transactionItems] = useState<TransactionItem[]>(initialTransactionData);
  const [stocktakingItems] = useState<StocktakingItem[]>(initialStocktakingData);

  const [firstColWidth, setFirstColWidth] = useState(0);
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (tableRef.current) {
        const firstTh = tableRef.current.querySelector('th');
        if (firstTh) {
          setFirstColWidth(firstTh.getBoundingClientRect().width);
        }
      }
    };
    
    updateWidth();
    // Re-measure after a short delay to ensure fonts/layout are fully resolved
    const timer = setTimeout(updateWidth, 50);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const tableStyle = { '--first-col-width': `${firstColWidth}px` } as React.CSSProperties;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <header className="header">
          <h1>在庫管理システム</h1>
          <span className="system-id">p2608</span>
        </header>
        
        <nav className="nav-menu">
          <div className="nav-section">
            <div className="nav-category">集計系</div>
            <button 
              className={`nav-button ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              在庫集計
            </button>
          </div>

          <div className="nav-section">
            <div className="nav-category">記録系</div>
            <button 
              className={`nav-button ${activeTab === 'transaction' ? 'active' : ''}`}
              onClick={() => setActiveTab('transaction')}
            >
              受入・払出記録
            </button>
            <button 
              className={`nav-button ${activeTab === 'stocktaking' ? 'active' : ''}`}
              onClick={() => setActiveTab('stocktaking')}
            >
              棚卸記録
            </button>
          </div>

          <div className="nav-section">
            <div className="nav-category">設定系</div>
            <button 
              className={`nav-button ${activeTab === 'master' ? 'active' : ''}`}
              onClick={() => setActiveTab('master')}
            >
              品目設定
            </button>
            <button 
              className={`nav-button ${activeTab === 'supplier' ? 'active' : ''}`}
              onClick={() => setActiveTab('supplier')}
            >
              仕入先設定
            </button>
            <button 
              className={`nav-button ${activeTab === 'category' ? 'active' : ''}`}
              onClick={() => setActiveTab('category')}
            >
              カテゴリ設定
            </button>
            <button 
              className={`nav-button ${activeTab === 'location' ? 'active' : ''}`}
              onClick={() => setActiveTab('location')}
            >
              保管場所設定
            </button>
          </div>
        </nav>
      </aside>

      <main className="main-content">
        {activeTab === 'inventory' && (
          <>
            <h2>在庫集計</h2>
            <div className="table-container">
              <table className="inventory-table" ref={tableRef} style={tableStyle}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>品目</th>
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

        {activeTab === 'transaction' && (
          <>
            <h2>受入・払出記録</h2>
            <div className="table-container">
              <table className="inventory-table" ref={tableRef} style={tableStyle}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>日時</th>
                    <th>品目ID</th>
                    <th>品目</th>
                    <th>区分</th>
                    <th>数量</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionItems.map((item) => (
                    <tr key={item.id}>
                      <td className="item-id">{item.id}</td>
                      <td>{item.date}</td>
                      <td className="item-id">{item.itemId}</td>
                      <td>{item.itemName}</td>
                      <td>{item.type}</td>
                      <td className="quantity">{item.quantity}</td>
                    </tr>
                  ))}
                  {transactionItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="empty-message">記録データがありません</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'stocktaking' && (
          <>
            <h2>棚卸記録</h2>
            <div className="table-container">
              <table className="inventory-table" ref={tableRef} style={tableStyle}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>日時</th>
                    <th>品目ID</th>
                    <th>品目</th>
                    <th>帳簿在庫</th>
                    <th>実在庫</th>
                    <th>差異</th>
                    <th>担当者</th>
                    <th>保管場所</th>
                  </tr>
                </thead>
                <tbody>
                  {stocktakingItems.map((item) => (
                    <tr key={item.id}>
                      <td className="item-id">{item.id}</td>
                      <td>{item.date}</td>
                      <td className="item-id">{item.itemId}</td>
                      <td>{item.itemName}</td>
                      <td className="quantity">{item.systemQty}</td>
                      <td className="quantity">{item.actualQty}</td>
                      <td className="quantity" style={{ color: item.difference !== 0 ? '#e03131' : 'inherit' }}>
                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                      </td>
                      <td>{item.personInCharge}</td>
                      <td>{item.location}</td>
                    </tr>
                  ))}
                  {stocktakingItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="empty-message">棚卸記録がありません</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'master' && (
          <>
            <h2>品目設定</h2>
            <div className="table-container">
              <table className="inventory-table" ref={tableRef} style={tableStyle}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>品目</th>
                    <th>製造元</th>
                    <th>内容量</th>
                    <th>内容量単位</th>
                    <th>仕入先</th>
                    <th>標準単価 (円)</th>
                    <th>標準仕入数量</th>
                    <th>カテゴリ</th>
                    <th>保管場所</th>
                  </tr>
                </thead>
                <tbody>
                  {masterItems.map((item) => (
                    <tr key={item.id}>
                      <td className="item-id">{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.manufacturer}</td>
                      <td className="quantity">{item.contentAmount}</td>
                      <td>{item.contentUnit}</td>
                      <td>{item.supplier}</td>
                      <td className="quantity">{item.standardPrice.toLocaleString()}</td>
                      <td className="quantity">{item.standardPurchaseQty}</td>
                      <td>{item.category}</td>
                      <td>{item.location}</td>
                    </tr>
                  ))}
                  {masterItems.length === 0 && (
                    <tr>
                      <td colSpan={10} className="empty-message">マスタデータがありません</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'category' && (
          <>
            <h2>カテゴリ設定</h2>
            <div className="table-container">
              <table className="inventory-table" ref={tableRef} style={tableStyle}>
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
            <h2>仕入先設定</h2>
            <div className="table-container">
              <table className="inventory-table" ref={tableRef} style={tableStyle}>
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
            <h2>保管場所設定</h2>
            <div className="table-container">
              <table className="inventory-table" ref={tableRef} style={tableStyle}>
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
