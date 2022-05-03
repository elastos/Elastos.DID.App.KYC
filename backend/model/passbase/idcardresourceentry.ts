export type NationalIDCardResourceEntry = {
  id_authenticity_factor: number; // eg: 0.95,
  face_match_factor: number;  // eg: 0,
  document_origin_country: string; // eg: 'cn',
  document_number: string; // eg: '12345678',
  date_of_issue: string; // eg: '2007-09-04',
  date_of_expiry: string; // eg: '2027-09-04',
  date_of_birth: string; // eg: '1989-04-20',
  country: string; // eg: 'CN'
  personal_id_number: string; // eg; '1234567',
  authority: string; // eg: '上海市...',
  sex: string; // eg: 'male',
  nationality: string; // eg: 'cn',
  last_name: string; // eg: 'xxxx',
  first_names: string; // eg: 'yyyy',
}
