import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { MemberRecipientCertificateItem } from '../types';

export type MemberRecipientCertificateGridRow = {
  id: string; // member_id
  code: string;
  name: string;
  yomigana: string;
  certificates: MemberRecipientCertificateItem[];
};

export function useRecipientCertificates() {
  const [items, setItems] = useState<MemberRecipientCertificateGridRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch Members (active members)
      const memberRes = await supabase
        .from('members')
        .select('*')
        .or('is_deleted.eq.false,is_deleted.is.null')
        .order('code', { ascending: true });

      if (memberRes.error) {
        console.error('Error fetching members:', memberRes.error);
        throw memberRes.error;
      }

      const members = memberRes.data || [];

      // Fetch Recipient Certificates
      let certs: any[] = [];
      try {
        const certRes = await supabase
          .from('member_recipient_certificates')
          .select('*')
          .or('is_deleted.eq.false,is_deleted.is.null')
          .order('valid_from', { ascending: false });

        if (!certRes.error && certRes.data) {
          certs = certRes.data;
        } else if (certRes.error) {
          console.warn('Warning fetching member_recipient_certificates:', certRes.error);
        }
      } catch (cErr) {
        console.warn('Exception fetching member_recipient_certificates:', cErr);
      }

      const formatted: MemberRecipientCertificateGridRow[] = members.map((m: any) => {
        const memberCerts: MemberRecipientCertificateItem[] = certs
          .filter((c: any) => c.member_id === m.id && !c.is_deleted)
          .map((c: any) => {
            let mgmtType = c.copayment_management_type || 'none';
            if (mgmtType === 'self') mgmtType = 'self_internal';
            return {
              id: c.id,
              memberId: c.member_id,
              certificateNumber: c.certificate_number || '',
              issuingMunicipality: c.issuing_municipality || '',
              incomeCategory: c.income_category || 'welfare',
              copaymentLimitAmount: Number(c.copayment_limit_amount) || 0,
              disabilitySupportClass: c.disability_support_class || 'none',
              copaymentManagementType: mgmtType,
              copaymentOfficeId: c.copayment_office_id || null,
              copaymentOfficeCode: c.copayment_office_code || '',
              copaymentOfficeName: c.copayment_office_name || '',
              validFrom: c.valid_from || '',
              validTo: c.valid_to || '',
              remarks: c.remarks || '',
            };
          });

        return {
          id: m.id,
          code: m.code || '',
          name: m.name || '',
          yomigana: m.yomigana || '',
          certificates: memberCerts,
        };
      });

      setItems(formatted);
    } catch (err) {
      console.error('fetchCertificates failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveCertificates = async (drafts: MemberRecipientCertificateGridRow[], deletedIds: string[]) => {
    try {
      const nowIso = new Date().toISOString();

      if (deletedIds.length > 0) {
        const certIdsToDelete = deletedIds.filter(id => !id.startsWith('CRT-') && id.includes('-'));
        if (certIdsToDelete.length > 0) {
          await supabase.from('member_recipient_certificates').update({ deleted_at: nowIso }).in('id', certIdsToDelete);
        }
      }

      for (const draft of drafts) {
        const memberId = draft.id;
        if (!draft.certificates || draft.certificates.length === 0) continue;

        for (const cert of draft.certificates) {
          if (deletedIds.includes(cert.id)) continue;

          let mgmtType = cert.copaymentManagementType || 'none';
          if (mgmtType === 'self') mgmtType = 'self_internal';

          const upsertData: any = {
            member_id: memberId,
            certificate_number: cert.certificateNumber || null,
            issuing_municipality: cert.issuingMunicipality || null,
            income_category: cert.incomeCategory || 'welfare',
            copayment_limit_amount: cert.copaymentLimitAmount || 0,
            disability_support_class: cert.disabilitySupportClass || 'none',
            copayment_management_type: mgmtType,
            copayment_office_id: mgmtType === 'self_internal' ? (cert.copaymentOfficeId || null) : null,
            copayment_office_code: mgmtType === 'other' ? (cert.copaymentOfficeCode || null) : null,
            copayment_office_name: mgmtType === 'other' ? (cert.copaymentOfficeName || null) : null,
            valid_from: cert.validFrom || new Date().toISOString().substring(0, 10),
            valid_to: cert.validTo || '2099-12-31',
            remarks: cert.remarks || null,
          };

          if (!cert.id.startsWith('CRT-')) {
            upsertData.id = cert.id;
          }

          const { error: upsertErr } = await supabase
            .from('member_recipient_certificates')
            .upsert(upsertData);

          if (upsertErr) throw upsertErr;
        }
      }

      await fetchCertificates();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return {
    items,
    loading,
    fetchCertificates,
    batchSaveCertificates,
  };
}
