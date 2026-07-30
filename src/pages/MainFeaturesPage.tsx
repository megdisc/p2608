import { TABLE_COLUMNS } from '../constants';

export function MainFeaturesPage() {
  const features = [
    { name: '案件・予算管理機能', description: '案件の基本情報登録、予算編成、および担当者の割当を行う機能。', screen: '案件管理画面' },
    { name: '進捗・報酬管理機能', description: '各タスクの進捗率を記録し、それに基づきインセンティブ報酬の配分を行う機能。', screen: '案件管理画面' },
    { name: '収支管理機能', description: 'プロジェクトごとの収入・支出・積立金を記録し、全体の収支状況を集計する機能。', screen: '収支管理画面' },
    { name: '作業記録・工賃集計機能', description: '利用者の日々の作業時間を記録し、各案件の状況や利用者の工賃を月次で集計する機能。', screen: '利用者管理画面' },
    { name: '利用者・職員・取引先管理機能', description: 'システムを利用する職員、支援対象である利用者、および取引先の基本情報を管理する機能。', screen: '各種管理画面' },
    { name: 'スキル・工賃単価評価機能', description: '業務に必要なスキル体系を定義し、利用者のスキルレベルを評価して基本工賃単価を設定する機能。', screen: 'スキル体系・工賃体系管理画面' },
    { name: 'システム構成可視化機能', description: '本アプリケーションの画面構成やDBテーブル設計、主要機能一覧をシステム内で参照できる機能。', screen: 'システム構成画面' },
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
