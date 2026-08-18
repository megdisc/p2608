import { TABLE_COLUMNS } from '../constants';

export function MainFeaturesPage() {
  const features = [
    { 
      name: '案件・予算管理機能', 
      description: '案件の基本情報登録、案件種別設定、予算編成、およびタスクへの担当者割当を行う機能。', 
      screen: '案件画面' 
    },
    { 
      name: '進捗・経費・精算管理機能', 
      description: '案件タスクの進捗状況記録、材料費・経費の記録、および月次インセンティブ分配の確定を行う機能。', 
      screen: '案件画面' 
    },
    { 
      name: '収支・集計管理機能', 
      description: '月次工賃・控除計算と確定、事業所全体の収支一覧の閲覧、並びに就労支援事業活動収支（時期別）・福祉事業活動収支の月次集計を行う機能。', 
      screen: '収支画面' 
    },
    { 
      name: '作業記録・担当状況集計機能', 
      description: '利用者の日々の作業時間記録・日次確定、および各利用者の担当状況を集計・参照する機能。', 
      screen: '利用者画面' 
    },
    { 
      name: '利用者・職員・取引先管理機能', 
      description: 'システムを利用する職員、支援対象である利用者、および取引先の基本情報を管理する機能。', 
      screen: '職員画面・利用者画面・取引先画面' 
    },
    { 
      name: 'スキル・工賃単価評価機能', 
      description: '業務に必要なスキル体系・スキルレベルを定義し、利用者のスキル評価および工賃単価評価を行う機能。', 
      screen: 'スキル体系画面・工賃体系画面・利用者画面' 
    },
    { 
      name: 'システム構成可視化機能', 
      description: '本アプリケーションの画面構成、テーブル構成（DB設計）、主要機能一覧、および運用ワークフローを参照できる機能。', 
      screen: 'システム構成画面' 
    },
  ];

  return (
    <table className="inventory-table">
      <thead>
        <tr>
          <th style={{ width: '25%' }}>機能名</th>
          <th style={{ width: '50%' }}>{TABLE_COLUMNS.DESCRIPTION}</th>
          <th style={{ width: '25%' }}>該当画面</th>
        </tr>
      </thead>
      <tbody>
        {features.map((feature, index) => (
          <tr key={index}>
            <td style={{ fontWeight: 'bold' }}>{feature.name}</td>
            <td style={{ whiteSpace: 'normal' }}>{feature.description}</td>
            <td>{feature.screen}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
