export type PassportResourceEntry = {
  authority: string; // 'Préfecture de xxxx',
  date_of_issue: string; // '2019-03-09',
  place_of_birth: string; // 'city name',
  id_authenticity_factor: number; // 0.95 between 0 and 1
  face_match_factor: number; // 0.95 between 0 and 1
  mrtd_verified: boolean; // Whether the passport verification code has been checked using a central authentication service or not
  raw_mrz_string: string; // Standardized passport identifier. 'P<FRANAME<<FIRSTNAME1<FIRSTNAME2<<<<<<<<<<<<<\n15AP010400FRA8109183M2505060<<<<<<<<<<<<<<08\n',
  mrtd_issuing_country: string; // standardized ISO country name 'FRA',
  mrtd_document_code: string; // 'P',
  sex: string; // 'female',
  nationality: string; // 'FR',
  last_name: string; // 'last name',
  first_names: string; // Comma separated first names. 'ME ME2',
  document_number: string; // Passport number - '34ET99876',
  date_of_expiry: string; // '2029-03-08',
  date_of_birth: string; // '1990-11-07',
  country: string; // 'FR',
  document_origin_country: string; // 'FR'
}