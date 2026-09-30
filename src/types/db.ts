export type InventoryTableItem = {
  id: string; // UUID
  item_id: string; // UUID
  location_id: string; // UUID
  quantity: number;
  updated_at?: string;
};

export type MasterTableItem = {
  id: string; // UUID
  code: string; // e.g., ING-001
  name: string;
  yomigana: string;
  description: string;
  supplier_id: string; // UUID
  standard_price: number;
  standard_purchase_qty: number;
  category_id: string; // UUID
  location_id: string; // UUID
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type LocationTableItem = {
  id: string; // UUID
  code: string;
  name: string;
  yomigana: string;
  description: string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CategoryTableItem = {
  id: string; // UUID
  code: string;
  name: string;
  yomigana: string;
  description: string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SupplierTableItem = {
  id: string; // UUID
  code: string;
  name: string;
  yomigana: string;
  is_customer?: boolean;
  is_subcontractor?: boolean;
  is_other?: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TransactionTableItem = {
  id: string; // UUID
  date: string;
  item_id: string; // UUID
  type: '受入' | '払出';
  quantity: number;
  location_id: string; // UUID
  staff_id: string; // UUID
  created_at?: string;
};

export type UserTableItem = {
  id: string; // UUID
  email?: string;
  role: string;
  user_type: 'staff' | 'member';
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type OfficeTableItem = {
  id: string; // UUID
  code?: string;
  name: string;
  short_name?: string;
  unit_price?: number;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type StaffTableItem = {
  id: string; // UUID
  user_id?: string; // UUID
  code?: string;
  name: string;
  yomigana: string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type StocktakingTableItem = {
  id: string; // UUID
  date: string;
  item_id: string; // UUID
  system_qty: number;
  actual_qty: number;
  difference: number;
  staff_id: string; // UUID
  location_id: string; // UUID
  created_at?: string;
};

export type QualificationTableItem = {
  id: string; // UUID
  code: string;
  name: string;
  category?: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type StaffQualificationSettingTableItem = {
  id?: string; // UUID
  staff_id: string; // UUID
  qualification_id: string; // UUID
  license_number?: string;
  acquired_on?: string;
  valid_until?: string;
  is_primary?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type OfficeStaffSettingTableItem = {
  id?: string; // UUID
  office_id: string; // UUID
  staff_id: string; // UUID
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ServiceTypeTableItem = {
  id: string; // UUID
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type OfficeServiceTypeSettingTableItem = {
  id?: string; // UUID
  office_id: string; // UUID
  service_type_id: string; // UUID
  capacity?: number;
  created_at?: string;
  updated_at?: string;
};

export type PartnerContactTableItem = {
  id: string; // UUID
  partner_id: string; // UUID
  name: string;
  yomigana?: string;
  department?: string;
  position?: string;
  deleted_at?: string | null;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type OfficeMemberSettingTableItem = {
  id?: string; // UUID
  office_id: string; // UUID
  member_id: string; // UUID
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
};

export type MemberRecipientCertificateTableItem = {
  id: string; // UUID
  member_id: string; // UUID
  certificate_number?: string;
  issuing_municipality?: string;
  income_category?: string;
  copayment_limit_amount: number;
  disability_support_class?: string;
  copayment_management_type?: string;
  copayment_office_name?: string;
  valid_from: string;
  valid_to: string;
  remarks?: string;
  deleted_at?: string | null;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};



