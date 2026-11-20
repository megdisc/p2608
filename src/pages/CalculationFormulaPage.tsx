export function CalculationFormulaPage() {
  return (
    <div className="dashboard-container" style={{ padding: '0 0 var(--space-8) 0' }}>
      {/* 1. サービス費用総額（訓練等給付費、サービス利用料） */}
      <section className="dashboard-panel">
        <h3 style={{
          fontSize: 'var(--text-heading-3)',
          fontWeight: 'var(--weight-heading)',
          color: 'var(--color-text-main)',
          margin: '0 0 var(--space-4) 0',
          paddingBottom: 'var(--space-2)',
          borderBottom: '2px solid var(--color-border)'
        }}>
          1. サービス費用総額（訓練等給付費、サービス利用料）
        </h3>

        {/* 算式ボックス */}
        <div style={{
          backgroundColor: 'var(--color-bg-subtle)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)'
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            サービス費用総額 ＝ ⌊ 合計単位数 × 地域区分単価 ⌋（円未満切捨て）
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            サービス利用料（自己負担額） ＝ min( ⌊ サービス費用総額 × 10% ⌋, 受給者証負担上限月額 )
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            訓練等給付費（国保連請求額） ＝ サービス費用総額 － サービス利用料
          </div>
          <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
            ※ 恒等式：サービス費用総額 ＝ 訓練等給付費 ＋ サービス利用料（端数処理を含め厳密一致）
          </div>
        </div>

        {/* 箇条書きロジック説明 */}
        <ul style={{
          margin: 0,
          paddingLeft: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          color: 'var(--color-text-main)',
          fontSize: 'var(--text-body)'
        }}>
          <li>
            <strong>地域区分単価の算定</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              地域区分単価 ＝ 10円 ＋ 10円 × 所在地上乗せ割合 × 支援種別人件費割合（小数第2位四捨五入）
            </div>
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              事業所の所在地級地（1〜7級地、その他）および支援種別（就労継続支援B型: 57.00% など）に基づいて決定。
            </div>
          </li>
          <li>
            <strong>合計単位数の算定</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              合計単位数 ＝ 基本報酬単位数 ＋ 加算単位数 － 減算単位数
            </div>
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              ・基本報酬：利用定員規模・人員配置基準・平均工賃月額達成区分（または利用時間区分）に応じた1日あたりの単位数 × 利用日数<br />
              ・加算単位：目標工賃達成指導員配置加算、専門職配置加算、送迎加算、欠席時対応加算等の合計単位数
            </div>
          </li>
          <li>
            <strong>サービス利用料（利用者自己負担額）</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              法定の1割負担額（費用総額 × 10%、円未満切捨て）を算定し、受給者証記載の「負担上限月額」（0円、9,300円、37,200円等）との小さい方を適用。
            </div>
          </li>
          <li>
            <strong>訓練等給付費（公費請求額）</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              サービス費用総額からサービス利用料を控除した全額を市町村（国保連）へ請求。
            </div>
          </li>
        </ul>
      </section>

      {/* 2. 工賃（基本工賃、インセンティブ、加算手当各科目） */}
      <section className="dashboard-panel">
        <h3 style={{
          fontSize: 'var(--text-heading-3)',
          fontWeight: 'var(--weight-heading)',
          color: 'var(--color-text-main)',
          margin: '0 0 var(--space-4) 0',
          paddingBottom: 'var(--space-2)',
          borderBottom: '2px solid var(--color-border)'
        }}>
          2. 工賃（基本工賃、インセンティブ、加算手当各科目）
        </h3>

        {/* 算式ボックス */}
        <div style={{
          backgroundColor: 'var(--color-bg-subtle)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)'
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            工賃総額 ＝ 基本工賃 ＋ 成果インセンティブ ＋ 加算手当合計
          </div>
        </div>

        {/* 箇条書きロジック説明 */}
        <ul style={{
          margin: 0,
          paddingLeft: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          color: 'var(--color-text-main)',
          fontSize: 'var(--text-body)'
        }}>
          <li>
            <strong>基本工賃</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              基本工賃 ＝ ⌊ 実稼働時間（work_time） × 決定工賃単価（wage_rate） ⌋（円未満切捨て）
            </div>
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              利用者個別設定または所属事業所の基本工賃単価マスタより単価を参照し、日々の作業日報の稼働時間に基づき月次集計。
            </div>
          </li>
          <li>
            <strong>成果インセンティブ</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              成果インセンティブ ＝ ∑ 案件タスク配分額（task_incentives）
            </div>
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              案件完了時の利益配分または日々のタスク担当実績に基づき算定されたインセンティブ額を集計。
            </div>
          </li>
          <li>
            <strong>加算手当（各科目）</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              マスタに登録された支給条件（発生区分・トリガー基準・閾値・演算子）に基づき自動判定。
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <table className="inventory-table auto-height-table">
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>科目名</th>
                    <th style={{ width: '15%' }}>発生区分</th>
                    <th style={{ width: '35%' }}>算定契機・判定条件</th>
                    <th style={{ width: '30%' }}>支給金額・単価</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>精勤手当</strong></td>
                    <td>月次（monthly）</td>
                    <td>当月利用日数（attendance_days） ≧ 15日</td>
                    <td>一律 3,000円 / 月</td>
                  </tr>
                  <tr>
                    <td><strong>皆勤手当</strong></td>
                    <td>月次（monthly）</td>
                    <td>当月利用日数（attendance_days） ≧ 20日</td>
                    <td>一律 2,000円 / 月</td>
                  </tr>
                  <tr>
                    <td><strong>その他の手当</strong></td>
                    <td>日次または月次</td>
                    <td>稼働時間、出席率、出勤日数等の条件合致判定</td>
                    <td>設定単価 × 数量 または 固定額</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </li>
        </ul>
      </section>

      {/* 3. 控除（サービス利用料、実費控除） */}
      <section className="dashboard-panel">
        <h3 style={{
          fontSize: 'var(--text-heading-3)',
          fontWeight: 'var(--weight-heading)',
          color: 'var(--color-text-main)',
          margin: '0 0 var(--space-4) 0',
          paddingBottom: 'var(--space-2)',
          borderBottom: '2px solid var(--color-border)'
        }}>
          3. 控除（サービス利用料、実費控除）
        </h3>

        {/* 算式ボックス */}
        <div style={{
          backgroundColor: 'var(--color-bg-subtle)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)'
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            控除総額 ＝ サービス利用料 ＋ 実費控除合計
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            差引支給額 ＝ 工賃総額 － 控除総額
          </div>
        </div>

        {/* 箇条書きロジック説明 */}
        <ul style={{
          margin: 0,
          paddingLeft: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          color: 'var(--color-text-main)',
          fontSize: 'var(--text-body)'
        }}>
          <li>
            <strong>サービス利用料</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              前述（※「1. サービス費用総額」で算定された受給者証上限管理後の自己負担額）
            </div>
          </li>
          <li>
            <strong>実費控除（各科目）</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              利用者の日々の実利用実績（日報・出欠記録）に基づき各科目を自動集計。
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <table className="inventory-table auto-height-table">
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>科目名</th>
                    <th style={{ width: '15%' }}>発生区分</th>
                    <th style={{ width: '35%' }}>算定契機・実績基準</th>
                    <th style={{ width: '30%' }}>控除金額・単価</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>昼食代</strong></td>
                    <td>日次（daily）</td>
                    <td>食事提供実績回数（meal_count）</td>
                    <td>1食あたり 200円 × 提供回数</td>
                  </tr>
                  <tr>
                    <td><strong>飲料設備代</strong></td>
                    <td>日次（daily）</td>
                    <td>通所利用日数（attendance_days）</td>
                    <td>1日あたり 30円 × 通所日数</td>
                  </tr>
                  <tr>
                    <td><strong>その他実費</strong></td>
                    <td>日次または月次</td>
                    <td>送迎実績、個別利用実績等</td>
                    <td>設定単価 × 実績回数 または 固定額</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </li>
        </ul>
      </section>

      {/* 4. 積立金（各科目） */}
      <section className="dashboard-panel">
        <h3 style={{
          fontSize: 'var(--text-heading-3)',
          fontWeight: 'var(--weight-heading)',
          color: 'var(--color-text-main)',
          margin: '0 0 var(--space-4) 0',
          paddingBottom: 'var(--space-2)',
          borderBottom: '2px solid var(--color-border)'
        }}>
          4. 積立金（工賃変動積立金、設備等修繕維持積立金）
        </h3>

        {/* 算式ボックス */}
        <div style={{
          backgroundColor: 'var(--color-bg-subtle)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)'
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            積立金繰入額 ＝ 指定金額（定額方式） または 対象売上額等 × 積立率（定率方式）
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            当期末積立金残高 ＝ 前期末残高 ＋ 当期繰入合計 － 当期取崩合計
          </div>
        </div>

        {/* 箇条書きロジック説明 */}
        <ul style={{
          margin: 0,
          paddingLeft: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          color: 'var(--color-text-main)',
          fontSize: 'var(--text-body)'
        }}>
          <li>
            <strong>積立金科目の定義と目的</strong>:
            <div style={{ marginTop: 'var(--space-2)' }}>
              <table className="inventory-table auto-height-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>科目名</th>
                    <th style={{ width: '45%' }}>目的・概要</th>
                    <th style={{ width: '30%' }}>主な算定方式（マスタ設定）</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>工賃変動積立金</strong></td>
                    <td>将来の就労支援事業収益の変動による工賃水準の低下を防ぎ、安定的な工賃支給を確保するための積立金。</td>
                    <td>定額（例: 毎月/案件完了時 1,000〜3,000円）または 定率（売上等の指定%）</td>
                  </tr>
                  <tr>
                    <td><strong>設備等修繕維持積立金</strong></td>
                    <td>将来の就労支援事業に用いる生産活動設備・備品の修繕、更新、維持管理に備えるための積立金。</td>
                    <td>定額（例: 毎月/案件完了時 500〜2,500円）または 定率（対象額の指定%）</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </li>
          <li>
            <strong>計算方式の区分</strong>:
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              ・<strong>定額方式（fixed_amount）</strong>：事業所マスタで指定された金額（円）を案件完了時または月次締め時に自動計上。<br />
              ・<strong>定率方式（fixed_rate）</strong>：案件の売上高・請負高等の基準額に対して指定割合（%）を乗じて自動算出。
            </div>
          </li>
          <li>
            <strong>会計およびレポートとの連動</strong>:
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              設定された繰入期日（当月/翌月・日）および取崩期日に基づき、就労支援事業出納帳（会計仕訳）および積立金推移レポート画面に自動反映。
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}
