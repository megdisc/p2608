import { TABLE_COLUMNS, WORDS_PROJECT, WORDS_WELFARE_SERVICE, WORDS_TIME } from '../constants';

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
          1. {TABLE_COLUMNS.TOTAL_COST}（{TABLE_COLUMNS.BENEFIT_BILLING}、{TABLE_COLUMNS.SERVICE_FEE}）
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
            {TABLE_COLUMNS.TOTAL_UNITS} ＝ {TABLE_COLUMNS.BASE_REWARD} ＋ {TABLE_COLUMNS.ADDITION_TOTAL}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            {TABLE_COLUMNS.TOTAL_COST} ＝ ⌊ {TABLE_COLUMNS.TOTAL_UNITS} × {TABLE_COLUMNS.REGIONAL_UNIT_PRICE} ⌋（円未満切捨て）
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            {TABLE_COLUMNS.SERVICE_FEE} ＝ min( ⌊ {TABLE_COLUMNS.TOTAL_COST} × 10% ⌋, {TABLE_COLUMNS.COPAYMENT_LIMIT} )
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            {TABLE_COLUMNS.BENEFIT_BILLING} ＝ {TABLE_COLUMNS.TOTAL_COST} － {TABLE_COLUMNS.SERVICE_FEE}
          </div>
          <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
            ※ 恒等式：{TABLE_COLUMNS.TOTAL_COST} ＝ {TABLE_COLUMNS.BENEFIT_BILLING} ＋ {TABLE_COLUMNS.SERVICE_FEE}（端数処理含め厳密一致）
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
            <strong>{TABLE_COLUMNS.TOTAL_UNITS}</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              {TABLE_COLUMNS.TOTAL_UNITS} ＝ {TABLE_COLUMNS.BASE_REWARD} ＋ {TABLE_COLUMNS.ADDITION_TOTAL}
            </div>
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              {TABLE_COLUMNS.ATTENDANCE_DAYS}に応じた基本報酬単位数と各種加算・減算単位数の合計。
            </div>
          </li>
          <li>
            <strong>{TABLE_COLUMNS.BASE_REWARD}（基本報酬の判定）</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              {TABLE_COLUMNS.BASE_REWARD} ＝ 判定基本単位数（日額） × {TABLE_COLUMNS.ATTENDANCE_DAYS}
            </div>
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              事業所の<strong>{TABLE_COLUMNS.CAPACITY_TIER}</strong>、<strong>{TABLE_COLUMNS.STAFFING_RATIO}</strong>、および前年度実績に基づく<strong>{TABLE_COLUMNS.WAGE_ACHIEVEMENT_TIER}</strong>の3要素から公定日額単位数を判定。
            </div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              ※ 前年度平均工賃月額 ＝ 前年度の工賃支払総額 ÷ 前年度の各月の延べ利用者の合計（年間開所実績による算定）
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <table className="inventory-table auto-height-table">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>{TABLE_COLUMNS.CAPACITY_TIER}</th>
                    <th style={{ width: '37%' }}>{TABLE_COLUMNS.WAGE_ACHIEVEMENT_TIER}（前年度平均工賃月額実績）</th>
                    <th style={{ width: '24%', textAlign: 'right' }}>人員配置 7.5:1</th>
                    <th style={{ width: '24%', textAlign: 'right' }}>人員配置 10:1</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowSpan={9}><strong>20人以下</strong></td>
                    <td>4万5千円以上</td>
                    <td style={{ textAlign: 'right', fontWeight: 'var(--weight-heading)' }}>584 単位 / 日</td>
                    <td style={{ textAlign: 'right', fontWeight: 'var(--weight-heading)' }}>520 単位 / 日</td>
                  </tr>
                  <tr>
                    <td>4万円以上4万5千円未満</td>
                    <td style={{ textAlign: 'right' }}>554 単位 / 日</td>
                    <td style={{ textAlign: 'right' }}>490 単位 / 日</td>
                  </tr>
                  <tr>
                    <td>3万5千円以上4万円未満</td>
                    <td style={{ textAlign: 'right' }}>531 単位 / 日</td>
                    <td style={{ textAlign: 'right' }}>467 単位 / 日</td>
                  </tr>
                  <tr>
                    <td>3万円以上3万5千円未満</td>
                    <td style={{ textAlign: 'right' }}>508 単位 / 日</td>
                    <td style={{ textAlign: 'right' }}>444 単位 / 日</td>
                  </tr>
                  <tr>
                    <td>2万5千円以上3万円未満</td>
                    <td style={{ textAlign: 'right' }}>485 単位 / 日</td>
                    <td style={{ textAlign: 'right' }}>421 単位 / 日</td>
                  </tr>
                  <tr>
                    <td>2万円以上2万5千円未満</td>
                    <td style={{ textAlign: 'right' }}>462 単位 / 日</td>
                    <td style={{ textAlign: 'right' }}>398 単位 / 日</td>
                  </tr>
                  <tr>
                    <td>1万5千円以上2万円未満</td>
                    <td style={{ textAlign: 'right' }}>439 単位 / 日</td>
                    <td style={{ textAlign: 'right' }}>375 単位 / 日</td>
                  </tr>
                  <tr>
                    <td>1万円以上1万5千円未満</td>
                    <td style={{ textAlign: 'right' }}>416 単位 / 日</td>
                    <td style={{ textAlign: 'right' }}>352 単位 / 日</td>
                  </tr>
                  <tr>
                    <td>1万円未満</td>
                    <td style={{ textAlign: 'right' }}>393 単位 / 日</td>
                    <td style={{ textAlign: 'right' }}>329 単位 / 日</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </li>
          <li>
            <strong>加算・減算項目（{TABLE_COLUMNS.ADDITION}・{TABLE_COLUMNS.SUBTRACTION}）</strong>:
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              事業所の届出体制および日々の利用・支援実績に応じて算定される加算、および基準未達時に適用される減算の一覧。
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <table className="inventory-table auto-height-table">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>区分</th>
                    <th style={{ width: '25%' }}>項目名</th>
                    <th style={{ width: '12%' }}>{TABLE_COLUMNS.OCCURRENCE_TYPE}</th>
                    <th style={{ width: '25%' }}>算定基準・単位数</th>
                    <th style={{ width: '23%' }}>{TABLE_COLUMNS.CALCULATION_METHOD}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowSpan={6}><strong>{TABLE_COLUMNS.ADDITION}</strong></td>
                    <td>食事提供体制加算</td>
                    <td>日次</td>
                    <td>30単位 / 回</td>
                    <td>設定単価 × 昼食等提供実績回数</td>
                  </tr>
                  <tr>
                    <td>送迎加算</td>
                    <td>日次</td>
                    <td>片道 10単位 / 回（同一敷地内 7単位）</td>
                    <td>設定単価 × 送迎実績回数</td>
                  </tr>
                  <tr>
                    <td>目標工賃達成指導員配置加算</td>
                    <td>日次</td>
                    <td>16〜45単位 / 日</td>
                    <td>設定単価 × {TABLE_COLUMNS.ATTENDANCE_DAYS}</td>
                  </tr>
                  <tr>
                    <td>欠席時対応加算</td>
                    <td>日次</td>
                    <td>94単位 / 回（月4回上限）</td>
                    <td>設定単価 × 相談援助等実績日数</td>
                  </tr>
                  <tr>
                    <td>福祉専門職員配置等加算</td>
                    <td>日次</td>
                    <td>6〜15単位 / 日（I: 15単位、II: 10単位、III: 6単位）</td>
                    <td>設定単価 × {TABLE_COLUMNS.ATTENDANCE_DAYS}</td>
                  </tr>
                  <tr>
                    <td>福祉・介護職員等処遇改善加算</td>
                    <td>月次</td>
                    <td>所定率（加算I: 9.3%、加算II: 7.0%等）</td>
                    <td>月間総報酬単位数 × 加算率</td>
                  </tr>
                  <tr>
                    <td rowSpan={4}><strong>{TABLE_COLUMNS.SUBTRACTION}</strong></td>
                    <td>定員超過減算</td>
                    <td>月次</td>
                    <td>所定単位数 × 30%減算</td>
                    <td>利用定員超過基準に該当する場合に減算</td>
                  </tr>
                  <tr>
                    <td>人員基準欠如減算</td>
                    <td>月次</td>
                    <td>所定単位数 × 30%減算（3月以上欠如は50%）</td>
                    <td>従業者の員数不足基準に該当する場合に減算</td>
                  </tr>
                  <tr>
                    <td>サービス管理責任者欠如減算</td>
                    <td>月次</td>
                    <td>所定単位数 × 30%減算（3月以上欠如は50%）</td>
                    <td>サビ管欠如基準に該当する場合に減算</td>
                  </tr>
                  <tr>
                    <td>個別支援計画未作成減算</td>
                    <td>月次</td>
                    <td>所定単位数 × 30%減算（3月以上未作成は50%）</td>
                    <td>計画未作成・見直し未実施の場合に減算</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </li>
          <li>
            <strong>{TABLE_COLUMNS.REGIONAL_UNIT_PRICE}</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              10円 ＋ 10円 × {WORDS_WELFARE_SERVICE.PREMIUM_RATE} × {WORDS_WELFARE_SERVICE.PERSONNEL_COST_RATIO}（小数第2位四捨五入）
            </div>
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              事業所の所在地級数および支援種別に基づき決定。
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <table className="inventory-table auto-height-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>地域区分（級地）</th>
                    <th style={{ width: '60%' }}>{TABLE_COLUMNS.CALCULATION_METHOD}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>1級地 〜 7級地</strong></td>
                    <td>10円 ＋ 10円 × 所在地級地の上乗せ割合 × 支援種別人件費割合</td>
                  </tr>
                  <tr>
                    <td><strong>その他地域</strong></td>
                    <td>10円（基準単価・上乗せなし）</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </li>
          <li>
            <strong>{TABLE_COLUMNS.SERVICE_FEE}</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              {TABLE_COLUMNS.SERVICE_FEE} ＝ min( ⌊ {TABLE_COLUMNS.TOTAL_COST} × 10% ⌋, {TABLE_COLUMNS.COPAYMENT_LIMIT} )
            </div>
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              法定1割負担額と受給者証記載の{TABLE_COLUMNS.COPAYMENT_LIMIT}のうち、いずれか低い額。
            </div>
          </li>
          <li>
            <strong>{TABLE_COLUMNS.BENEFIT_BILLING}</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              {TABLE_COLUMNS.BENEFIT_BILLING} ＝ {TABLE_COLUMNS.TOTAL_COST} － {TABLE_COLUMNS.SERVICE_FEE}
            </div>
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              {TABLE_COLUMNS.TOTAL_COST}から{TABLE_COLUMNS.SERVICE_FEE}を控除した額（公費請求額）。
            </div>
          </li>
        </ul>
      </section>

      {/* 2. 工賃（基本工賃、インセンティブ、加算手当） */}
      <section className="dashboard-panel">
        <h3 style={{
          fontSize: 'var(--text-heading-3)',
          fontWeight: 'var(--weight-heading)',
          color: 'var(--color-text-main)',
          margin: '0 0 var(--space-4) 0',
          paddingBottom: 'var(--space-2)',
          borderBottom: '2px solid var(--color-border)'
        }}>
          2. {TABLE_COLUMNS.CATEGORY_WAGE_A}（{TABLE_COLUMNS.SUBJECT_BASE_WAGE_ITEM}、{TABLE_COLUMNS.SUBJECT_INCENTIVE_ITEM}、{TABLE_COLUMNS.SUBJECT_ALLOWANCE_ITEM}）
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
            {TABLE_COLUMNS.CATEGORY_WAGE_A} ＝ {TABLE_COLUMNS.SUBJECT_BASE_WAGE_ITEM} ＋ {TABLE_COLUMNS.SUBJECT_INCENTIVE_ITEM} ＋ {TABLE_COLUMNS.SUBJECT_ALLOWANCE_ITEM}
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
            <strong>{TABLE_COLUMNS.SUBJECT_BASE_WAGE_ITEM}</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              {TABLE_COLUMNS.SUBJECT_BASE_WAGE_ITEM} ＝ ⌊ {WORDS_TIME.WORK_TIME} × {WORDS_PROJECT.BASE_WAGE} ⌋（円未満切捨て）
            </div>
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              利用者の工賃単価と日々の利用記録（作業時間）に基づき月次集計。
            </div>
          </li>
          <li>
            <strong>{TABLE_COLUMNS.SUBJECT_INCENTIVE_ITEM}</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              {TABLE_COLUMNS.SUBJECT_INCENTIVE_ITEM} ＝ ∑ 報酬配分
            </div>
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              案件完了時の収益分配による各タスク配分額を集計。
            </div>
          </li>
          <li>
            <strong>{TABLE_COLUMNS.SUBJECT_ALLOWANCE_ITEM}</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              手当マスタの支給条件（利用日数・作業時間等）に基づき自動集計。
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <table className="inventory-table auto-height-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>手当区分</th>
                    <th style={{ width: '15%' }}>{TABLE_COLUMNS.OCCURRENCE_TYPE}</th>
                    <th style={{ width: '30%' }}>判定基準</th>
                    <th style={{ width: '30%' }}>算出方法</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>日次手当</strong></td>
                    <td>日次</td>
                    <td>日々の利用実績（{WORDS_TIME.WORK_TIME}・従事実績等）</td>
                    <td>設定単価 × 実績数（時間・日数）</td>
                  </tr>
                  <tr>
                    <td><strong>月次手当</strong></td>
                    <td>月次</td>
                    <td>月間実績（{WORDS_WELFARE_SERVICE.ATTENDANCE_DAYS}・月間作業時間等の閾値判定）</td>
                    <td>月額固定額</td>
                  </tr>
                  <tr>
                    <td><strong>その他手当</strong></td>
                    <td>日次 / 月次</td>
                    <td>個別設定条件への合致判定</td>
                    <td>設定単価または固定額</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </li>
        </ul>
      </section>

      {/* 3. 控除（サービス利用料、実費控除）および 差額 */}
      <section className="dashboard-panel">
        <h3 style={{
          fontSize: 'var(--text-heading-3)',
          fontWeight: 'var(--weight-heading)',
          color: 'var(--color-text-main)',
          margin: '0 0 var(--space-4) 0',
          paddingBottom: 'var(--space-2)',
          borderBottom: '2px solid var(--color-border)'
        }}>
          3. {TABLE_COLUMNS.CATEGORY_DEDUCTION_B}（{TABLE_COLUMNS.SUBJECT_WELFARE_USAGE_FEE}、{TABLE_COLUMNS.SUBJECT_DEDUCTION}）および {TABLE_COLUMNS.CATEGORY_DIFFERENCE_AB}
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
            {TABLE_COLUMNS.CATEGORY_DEDUCTION_B} ＝ {TABLE_COLUMNS.SUBJECT_WELFARE_USAGE_FEE} ＋ {TABLE_COLUMNS.SUBJECT_DEDUCTION}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            {TABLE_COLUMNS.CATEGORY_DIFFERENCE_AB}（{TABLE_COLUMNS.PAYMENT_AMOUNT}） ＝ {TABLE_COLUMNS.CATEGORY_WAGE_A} － {TABLE_COLUMNS.CATEGORY_DEDUCTION_B}
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
            <strong>{TABLE_COLUMNS.SUBJECT_WELFARE_USAGE_FEE}</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              サービス費用の自己負担額（受給者証上限管理適用後）。
            </div>
          </li>
          <li>
            <strong>{TABLE_COLUMNS.SUBJECT_DEDUCTION}</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              利用記録（食事提供等）に基づき自動集計。
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <table className="inventory-table auto-height-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>控除区分</th>
                    <th style={{ width: '15%' }}>{TABLE_COLUMNS.OCCURRENCE_TYPE}</th>
                    <th style={{ width: '30%' }}>実績基準</th>
                    <th style={{ width: '30%' }}>算出方法</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>食事提供費（昼食代等）</strong></td>
                    <td>日次</td>
                    <td>{WORDS_WELFARE_SERVICE.MEAL_COUNT}（提供実績）</td>
                    <td>設定単価 × 提供回数</td>
                  </tr>
                  <tr>
                    <td><strong>通所連動実費（飲料設備代等）</strong></td>
                    <td>日次</td>
                    <td>{WORDS_WELFARE_SERVICE.ATTENDANCE_DAYS}</td>
                    <td>設定単価 × 通所日数</td>
                  </tr>
                  <tr>
                    <td><strong>月次固定実費</strong></td>
                    <td>月次</td>
                    <td>月次利用実績</td>
                    <td>月額固定額</td>
                  </tr>
                  <tr>
                    <td><strong>その他実費</strong></td>
                    <td>日次 / 月次</td>
                    <td>個別利用実績</td>
                    <td>設定単価または固定額</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </li>
        </ul>
      </section>

      {/* 4. 積立金（工賃変動積立金、設備等修繕維持積立金） */}
      <section className="dashboard-panel">
        <h3 style={{
          fontSize: 'var(--text-heading-3)',
          fontWeight: 'var(--weight-heading)',
          color: 'var(--color-text-main)',
          margin: '0 0 var(--space-4) 0',
          paddingBottom: 'var(--space-2)',
          borderBottom: '2px solid var(--color-border)'
        }}>
          4. {WORDS_PROJECT.RESERVE}（{TABLE_COLUMNS.SUBJECT_RESERVE_WAGE}、{TABLE_COLUMNS.SUBJECT_RESERVE_EQUIPMENT}）
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
            {TABLE_COLUMNS.RESERVE_NET} ＝ {TABLE_COLUMNS.RESERVE_INFLOW} － {TABLE_COLUMNS.RESERVE_WITHDRAWAL}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            {TABLE_COLUMNS.RESERVE_CUMULATIVE} ＝ {TABLE_COLUMNS.INITIAL_BALANCE} ＋ ∑ {TABLE_COLUMNS.RESERVE_NET}
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
            <strong>積立金科目</strong>:
            <div style={{ marginTop: 'var(--space-2)' }}>
              <table className="inventory-table auto-height-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>科目名</th>
                    <th style={{ width: '60%' }}>{TABLE_COLUMNS.CALCULATION_METHOD}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>{TABLE_COLUMNS.SUBJECT_RESERVE_WAGE}</strong></td>
                    <td>{TABLE_COLUMNS.FIXED_AMOUNT} または {TABLE_COLUMNS.FIXED_RATE}</td>
                  </tr>
                  <tr>
                    <td><strong>{TABLE_COLUMNS.SUBJECT_RESERVE_EQUIPMENT}</strong></td>
                    <td>{TABLE_COLUMNS.FIXED_AMOUNT} または {TABLE_COLUMNS.FIXED_RATE}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </li>
          <li>
            <strong>{TABLE_COLUMNS.CALCULATION_METHOD}</strong>:
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              ・<strong>定額方式</strong>：設定された定額金額（円）を案件完了時または締め時に自動計上。<br />
              ・<strong>定率方式</strong>：案件収益等の基準額に指定割合（%）を乗じて自動算出。
            </div>
          </li>
          <li>
            <strong>帳簿・レポート連動</strong>:
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              設定された期日に基づき、就労支援事業出納帳および積立金レポートへ自動反映。
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}
