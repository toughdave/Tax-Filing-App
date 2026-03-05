export type FilingMode = "INDIVIDUAL" | "SELF_EMPLOYED" | "COMPANY";

export type FieldType = "text" | "number" | "date" | "select";

export interface SelectOption {
  value: string;
  labelKey: string;
}

export interface TaxField {
  key: string;
  labelKey: string;
  helpKey: string;
  type: FieldType;
  required?: boolean;
  options?: SelectOption[];
}

export interface FieldGroup {
  id: string;
  titleKey: string;
  fields: TaxField[];
}

export interface ProfileFlag {
  key: string;
  labelKey: string;
  helpKey: string;
}

export interface WizardSection {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  fields: TaxField[];
  mode?: FilingMode[];
  profileFlag?: string;
}

export const PROVINCES: SelectOption[] = [
  { value: "AB", labelKey: "provinceAB" },
  { value: "BC", labelKey: "provinceBC" },
  { value: "MB", labelKey: "provinceMB" },
  { value: "NB", labelKey: "provinceNB" },
  { value: "NL", labelKey: "provinceNL" },
  { value: "NS", labelKey: "provinceNS" },
  { value: "NT", labelKey: "provinceNT" },
  { value: "NU", labelKey: "provinceNU" },
  { value: "ON", labelKey: "provinceON" },
  { value: "PE", labelKey: "provincePE" },
  { value: "QC", labelKey: "provinceQC" },
  { value: "SK", labelKey: "provinceSK" },
  { value: "YT", labelKey: "provinceYT" }
];

export const MARITAL_STATUSES: SelectOption[] = [
  { value: "single", labelKey: "maritalSingle" },
  { value: "married", labelKey: "maritalMarried" },
  { value: "commonLaw", labelKey: "maritalCommonLaw" },
  { value: "separated", labelKey: "maritalSeparated" },
  { value: "divorced", labelKey: "maritalDivorced" },
  { value: "widowed", labelKey: "maritalWidowed" }
];

export const TAX_YEARS: SelectOption[] = [
  { value: "2025", labelKey: "year2025" },
  { value: "2024", labelKey: "year2024" },
  { value: "2023", labelKey: "year2023" }
];

export const PROFILE_FLAGS: ProfileFlag[] = [
  { key: "isStudent", labelKey: "profileIsStudent", helpKey: "profileIsStudentHelp" },
  { key: "isRetired", labelKey: "profileIsRetired", helpKey: "profileIsRetiredHelp" },
  { key: "hasInvestments", labelKey: "profileHasInvestments", helpKey: "profileHasInvestmentsHelp" },
  { key: "hasRentalIncome", labelKey: "profileHasRentalIncome", helpKey: "profileHasRentalIncomeHelp" },
  { key: "hasMedicalExpenses", labelKey: "profileHasMedicalExpenses", helpKey: "profileHasMedicalExpensesHelp" },
  { key: "hasDonations", labelKey: "profileHasDonations", helpKey: "profileHasDonationsHelp" },
  { key: "hasDisability", labelKey: "profileHasDisability", helpKey: "profileHasDisabilityHelp" },
  { key: "hasDependants", labelKey: "profileHasDependants", helpKey: "profileHasDependantsHelp" }
];

export const filingModes: { value: FilingMode; labelKey: string; descriptionKey: string }[] = [
  {
    value: "INDIVIDUAL",
    labelKey: "modeIndividual",
    descriptionKey: "modeIndividualDesc"
  },
  {
    value: "SELF_EMPLOYED",
    labelKey: "modeSelfEmployed",
    descriptionKey: "modeSelfEmployedDesc"
  },
  {
    value: "COMPANY",
    labelKey: "modeCompany",
    descriptionKey: "modeCompanyDesc"
  }
];

export const baseFieldGroups: FieldGroup[] = [
  {
    id: "identity",
    titleKey: "groupIdentity",
    fields: [
      { key: "legalName", labelKey: "fieldLegalName", helpKey: "fieldLegalNameHelp", type: "text", required: true },
      { key: "sinLast4", labelKey: "fieldSinLast4", helpKey: "fieldSinLast4Help", type: "text", required: true },
      { key: "birthDate", labelKey: "fieldBirthDate", helpKey: "fieldBirthDateHelp", type: "date", required: true }
    ]
  },
  {
    id: "residency",
    titleKey: "groupResidency",
    fields: [
      {
        key: "residencyProvince",
        labelKey: "fieldResidencyProvince",
        helpKey: "fieldResidencyProvinceHelp",
        type: "select",
        required: true,
        options: PROVINCES
      },
      {
        key: "maritalStatus",
        labelKey: "fieldMaritalStatus",
        helpKey: "fieldMaritalStatusHelp",
        type: "select",
        options: MARITAL_STATUSES
      },
      { key: "dependants", labelKey: "fieldDependants", helpKey: "fieldDependantsHelp", type: "number" }
    ]
  },
  {
    id: "income",
    titleKey: "groupIncome",
    fields: [
      {
        key: "employmentIncome",
        labelKey: "fieldEmploymentIncome",
        helpKey: "fieldEmploymentIncomeHelp",
        type: "number"
      },
      { key: "otherIncome", labelKey: "fieldOtherIncome", helpKey: "fieldOtherIncomeHelp", type: "number" },
      { key: "interestIncome", labelKey: "fieldInterestIncome", helpKey: "fieldInterestIncomeHelp", type: "number" },
      { key: "dividendIncome", labelKey: "fieldDividendIncome", helpKey: "fieldDividendIncomeHelp", type: "number" },
      { key: "capitalGains", labelKey: "fieldCapitalGains", helpKey: "fieldCapitalGainsHelp", type: "number" },
      { key: "rentalIncome", labelKey: "fieldRentalIncome", helpKey: "fieldRentalIncomeHelp", type: "number" },
      { key: "pensionIncome", labelKey: "fieldPensionIncome", helpKey: "fieldPensionIncomeHelp", type: "number" },
      { key: "eiBenefits", labelKey: "fieldEiBenefits", helpKey: "fieldEiBenefitsHelp", type: "number" }
    ]
  },
  {
    id: "deductions",
    titleKey: "groupDeductions",
    fields: [
      { key: "rrsp", labelKey: "fieldRrsp", helpKey: "fieldRrspHelp", type: "number" },
      { key: "fhsa", labelKey: "fieldFhsa", helpKey: "fieldFhsaHelp", type: "number" },
      { key: "unionDues", labelKey: "fieldUnionDues", helpKey: "fieldUnionDuesHelp", type: "number" },
      { key: "childCareExpenses", labelKey: "fieldChildCareExpenses", helpKey: "fieldChildCareExpensesHelp", type: "number" },
      { key: "movingExpenses", labelKey: "fieldMovingExpenses", helpKey: "fieldMovingExpensesHelp", type: "number" },
      { key: "supportPaymentsMade", labelKey: "fieldSupportPaymentsMade", helpKey: "fieldSupportPaymentsMadeHelp", type: "number" },
      { key: "carryingCharges", labelKey: "fieldCarryingCharges", helpKey: "fieldCarryingChargesHelp", type: "number" },
      { key: "northernResidents", labelKey: "fieldNorthernResidents", helpKey: "fieldNorthernResidentsHelp", type: "number" }
    ]
  },
  {
    id: "credits",
    titleKey: "groupCredits",
    fields: [
      { key: "tuition", labelKey: "fieldTuition", helpKey: "fieldTuitionHelp", type: "number" },
      { key: "medical", labelKey: "fieldMedical", helpKey: "fieldMedicalHelp", type: "number" },
      { key: "donations", labelKey: "fieldDonations", helpKey: "fieldDonationsHelp", type: "number" },
      { key: "ageAmount", labelKey: "fieldAgeAmount", helpKey: "fieldAgeAmountHelp", type: "number" },
      { key: "spouseAmount", labelKey: "fieldSpouseAmount", helpKey: "fieldSpouseAmountHelp", type: "number" },
      { key: "eligibleDependantAmount", labelKey: "fieldEligibleDependantAmount", helpKey: "fieldEligibleDependantAmountHelp", type: "number" },
      { key: "canadaCaregiverAmount", labelKey: "fieldCanadaCaregiverAmount", helpKey: "fieldCanadaCaregiverAmountHelp", type: "number" },
      { key: "disabilityAmount", labelKey: "fieldDisabilityAmount", helpKey: "fieldDisabilityAmountHelp", type: "number" },
      { key: "cppEiOverpayment", labelKey: "fieldCppEiOverpayment", helpKey: "fieldCppEiOverpaymentHelp", type: "number" },
      { key: "canadaEmploymentAmount", labelKey: "fieldCanadaEmploymentAmount", helpKey: "fieldCanadaEmploymentAmountHelp", type: "number" },
      { key: "homeBuyersAmount", labelKey: "fieldHomeBuyersAmount", helpKey: "fieldHomeBuyersAmountHelp", type: "number" },
      { key: "pensionIncomeAmount", labelKey: "fieldPensionIncomeAmount", helpKey: "fieldPensionIncomeAmountHelp", type: "number" },
      { key: "studentLoanInterest", labelKey: "fieldStudentLoanInterest", helpKey: "fieldStudentLoanInterestHelp", type: "number" }
    ]
  },
  {
    id: "refundable-credits",
    titleKey: "groupRefundableCredits",
    fields: [
      { key: "canadaWorkersAmount", labelKey: "fieldCanadaWorkersAmount", helpKey: "fieldCanadaWorkersAmountHelp", type: "number" },
      { key: "canadaTrainingCredit", labelKey: "fieldCanadaTrainingCredit", helpKey: "fieldCanadaTrainingCreditHelp", type: "number" },
      { key: "refundableMedical", labelKey: "fieldRefundableMedical", helpKey: "fieldRefundableMedicalHelp", type: "number" },
      { key: "taxPaidByInstalments", labelKey: "fieldTaxPaidByInstalments", helpKey: "fieldTaxPaidByInstalmentsHelp", type: "number" },
      { key: "totalIncomeTaxDeducted", labelKey: "fieldTotalIncomeTaxDeducted", helpKey: "fieldTotalIncomeTaxDeductedHelp", type: "number" }
    ]
  }
];

export const modeSpecificFieldGroups: Record<FilingMode, FieldGroup[]> = {
  INDIVIDUAL: [],
  SELF_EMPLOYED: [
    {
      id: "self-employed",
      titleKey: "groupSelfEmployed",
      fields: [
        {
          key: "businessIncome",
          labelKey: "fieldBusinessIncome",
          helpKey: "fieldBusinessIncomeHelp",
          type: "number",
          required: true
        },
        {
          key: "businessExpenses",
          labelKey: "fieldBusinessExpenses",
          helpKey: "fieldBusinessExpensesHelp",
          type: "number",
          required: true
        },
        { key: "gstHst", labelKey: "fieldGstHst", helpKey: "fieldGstHstHelp", type: "number" },
        {
          key: "businessUseHome",
          labelKey: "fieldBusinessUseHome",
          helpKey: "fieldBusinessUseHomeHelp",
          type: "number"
        }
      ]
    }
  ],
  COMPANY: [
    {
      id: "company",
      titleKey: "groupCompany",
      fields: [
        {
          key: "corporationName",
          labelKey: "fieldCorpName",
          helpKey: "fieldCorpNameHelp",
          type: "text",
          required: true
        },
        {
          key: "businessNumber",
          labelKey: "fieldBusinessNumber",
          helpKey: "fieldBusinessNumberHelp",
          type: "text",
          required: true
        },
        {
          key: "fiscalYearEnd",
          labelKey: "fieldFiscalYearEnd",
          helpKey: "fieldFiscalYearEndHelp",
          type: "date",
          required: true
        },
        {
          key: "corporateRevenue",
          labelKey: "fieldCorpRevenue",
          helpKey: "fieldCorpRevenueHelp",
          type: "number",
          required: true
        },
        {
          key: "corporateDeductions",
          labelKey: "fieldCorpDeductions",
          helpKey: "fieldCorpDeductionsHelp",
          type: "number"
        },
        {
          key: "capitalCostAllowance",
          labelKey: "fieldCapitalCostAllowance",
          helpKey: "fieldCapitalCostAllowanceHelp",
          type: "number"
        },
        {
          key: "retainedEarnings",
          labelKey: "fieldRetainedEarnings",
          helpKey: "fieldRetainedEarningsHelp",
          type: "number"
        }
      ]
    },
    {
      id: "payroll",
      titleKey: "groupPayroll",
      fields: [
        {
          key: "corporatePayroll",
          labelKey: "fieldCorpPayroll",
          helpKey: "fieldCorpPayrollHelp",
          type: "number"
        },
        {
          key: "employeeCount",
          labelKey: "fieldEmployeeCount",
          helpKey: "fieldEmployeeCountHelp",
          type: "number"
        },
        {
          key: "cppContributions",
          labelKey: "fieldCppContributions",
          helpKey: "fieldCppContributionsHelp",
          type: "number"
        },
        {
          key: "eiPremiums",
          labelKey: "fieldEiPremiums",
          helpKey: "fieldEiPremiumsHelp",
          type: "number"
        },
        {
          key: "incomeTaxWithheld",
          labelKey: "fieldIncomeTaxWithheld",
          helpKey: "fieldIncomeTaxWithheldHelp",
          type: "number"
        }
      ]
    },
    {
      id: "gst-hst",
      titleKey: "groupGstHst",
      fields: [
        {
          key: "gstHstCollected",
          labelKey: "fieldGstHstCollected",
          helpKey: "fieldGstHstCollectedHelp",
          type: "number"
        },
        {
          key: "gstHstPaid",
          labelKey: "fieldGstHstPaid",
          helpKey: "fieldGstHstPaidHelp",
          type: "number"
        },
        {
          key: "gstHstNetRemittance",
          labelKey: "fieldGstHstNetRemittance",
          helpKey: "fieldGstHstNetRemittanceHelp",
          type: "number"
        }
      ]
    }
  ]
};

export const individualWizardSections: WizardSection[] = [
  {
    id: "personal-info",
    titleKey: "wizardPersonalInfo",
    descriptionKey: "wizardPersonalInfoDesc",
    icon: "👤",
    fields: [
      { key: "legalName", labelKey: "fieldLegalName", helpKey: "fieldLegalNameHelp", type: "text", required: true },
      { key: "sinLast4", labelKey: "fieldSinLast4", helpKey: "fieldSinLast4Help", type: "text", required: true },
      { key: "birthDate", labelKey: "fieldBirthDate", helpKey: "fieldBirthDateHelp", type: "date", required: true }
    ]
  },
  {
    id: "residency-family",
    titleKey: "wizardResidencyFamily",
    descriptionKey: "wizardResidencyFamilyDesc",
    icon: "🏠",
    fields: [
      { key: "residencyProvince", labelKey: "fieldResidencyProvince", helpKey: "fieldResidencyProvinceHelp", type: "select", required: true, options: PROVINCES },
      { key: "maritalStatus", labelKey: "fieldMaritalStatus", helpKey: "fieldMaritalStatusHelp", type: "select", options: MARITAL_STATUSES },
      { key: "dependants", labelKey: "fieldDependants", helpKey: "fieldDependantsHelp", type: "number" }
    ]
  },
  {
    id: "employment-income",
    titleKey: "wizardEmploymentIncome",
    descriptionKey: "wizardEmploymentIncomeDesc",
    icon: "💼",
    fields: [
      { key: "employmentIncome", labelKey: "fieldEmploymentIncome", helpKey: "fieldEmploymentIncomeHelp", type: "number", required: true },
      { key: "eiBenefits", labelKey: "fieldEiBenefits", helpKey: "fieldEiBenefitsHelp", type: "number" },
      { key: "otherIncome", labelKey: "fieldOtherIncome", helpKey: "fieldOtherIncomeHelp", type: "number" }
    ]
  },
  {
    id: "investment-income",
    titleKey: "wizardInvestmentIncome",
    descriptionKey: "wizardInvestmentIncomeDesc",
    icon: "📈",
    profileFlag: "hasInvestments",
    fields: [
      { key: "interestIncome", labelKey: "fieldInterestIncome", helpKey: "fieldInterestIncomeHelp", type: "number" },
      { key: "dividendIncome", labelKey: "fieldDividendIncome", helpKey: "fieldDividendIncomeHelp", type: "number" },
      { key: "capitalGains", labelKey: "fieldCapitalGains", helpKey: "fieldCapitalGainsHelp", type: "number" }
    ]
  },
  {
    id: "rental-income",
    titleKey: "wizardRentalIncome",
    descriptionKey: "wizardRentalIncomeDesc",
    icon: "🏢",
    profileFlag: "hasRentalIncome",
    fields: [
      { key: "rentalIncome", labelKey: "fieldRentalIncome", helpKey: "fieldRentalIncomeHelp", type: "number", required: true }
    ]
  },
  {
    id: "pension-benefits",
    titleKey: "wizardPensionBenefits",
    descriptionKey: "wizardPensionBenefitsDesc",
    icon: "🎖️",
    profileFlag: "isRetired",
    fields: [
      { key: "pensionIncome", labelKey: "fieldPensionIncome", helpKey: "fieldPensionIncomeHelp", type: "number", required: true },
      { key: "ageAmount", labelKey: "fieldAgeAmount", helpKey: "fieldAgeAmountHelp", type: "number" },
      { key: "pensionIncomeAmount", labelKey: "fieldPensionIncomeAmount", helpKey: "fieldPensionIncomeAmountHelp", type: "number" }
    ]
  },
  {
    id: "self-employment",
    titleKey: "wizardSelfEmployment",
    descriptionKey: "wizardSelfEmploymentDesc",
    icon: "🧾",
    mode: ["SELF_EMPLOYED"],
    fields: [
      { key: "businessIncome", labelKey: "fieldBusinessIncome", helpKey: "fieldBusinessIncomeHelp", type: "number", required: true },
      { key: "businessExpenses", labelKey: "fieldBusinessExpenses", helpKey: "fieldBusinessExpensesHelp", type: "number", required: true },
      { key: "gstHst", labelKey: "fieldGstHst", helpKey: "fieldGstHstHelp", type: "number" },
      { key: "businessUseHome", labelKey: "fieldBusinessUseHome", helpKey: "fieldBusinessUseHomeHelp", type: "number" }
    ]
  },
  {
    id: "deductions",
    titleKey: "wizardDeductions",
    descriptionKey: "wizardDeductionsDesc",
    icon: "📋",
    fields: [
      { key: "rrsp", labelKey: "fieldRrsp", helpKey: "fieldRrspHelp", type: "number" },
      { key: "fhsa", labelKey: "fieldFhsa", helpKey: "fieldFhsaHelp", type: "number" },
      { key: "unionDues", labelKey: "fieldUnionDues", helpKey: "fieldUnionDuesHelp", type: "number" },
      { key: "childCareExpenses", labelKey: "fieldChildCareExpenses", helpKey: "fieldChildCareExpensesHelp", type: "number" },
      { key: "movingExpenses", labelKey: "fieldMovingExpenses", helpKey: "fieldMovingExpensesHelp", type: "number" },
      { key: "supportPaymentsMade", labelKey: "fieldSupportPaymentsMade", helpKey: "fieldSupportPaymentsMadeHelp", type: "number" },
      { key: "carryingCharges", labelKey: "fieldCarryingCharges", helpKey: "fieldCarryingChargesHelp", type: "number" },
      { key: "northernResidents", labelKey: "fieldNorthernResidents", helpKey: "fieldNorthernResidentsHelp", type: "number" }
    ]
  },
  {
    id: "education",
    titleKey: "wizardEducation",
    descriptionKey: "wizardEducationDesc",
    icon: "🎓",
    profileFlag: "isStudent",
    fields: [
      { key: "tuition", labelKey: "fieldTuition", helpKey: "fieldTuitionHelp", type: "number", required: true },
      { key: "studentLoanInterest", labelKey: "fieldStudentLoanInterest", helpKey: "fieldStudentLoanInterestHelp", type: "number" },
      { key: "canadaTrainingCredit", labelKey: "fieldCanadaTrainingCredit", helpKey: "fieldCanadaTrainingCreditHelp", type: "number" }
    ]
  },
  {
    id: "medical-donations",
    titleKey: "wizardMedicalDonations",
    descriptionKey: "wizardMedicalDonationsDesc",
    icon: "❤️",
    fields: [
      { key: "medical", labelKey: "fieldMedical", helpKey: "fieldMedicalHelp", type: "number" },
      { key: "refundableMedical", labelKey: "fieldRefundableMedical", helpKey: "fieldRefundableMedicalHelp", type: "number" },
      { key: "donations", labelKey: "fieldDonations", helpKey: "fieldDonationsHelp", type: "number" },
      { key: "disabilityAmount", labelKey: "fieldDisabilityAmount", helpKey: "fieldDisabilityAmountHelp", type: "number" }
    ]
  },
  {
    id: "other-credits",
    titleKey: "wizardOtherCredits",
    descriptionKey: "wizardOtherCreditsDesc",
    icon: "✨",
    fields: [
      { key: "spouseAmount", labelKey: "fieldSpouseAmount", helpKey: "fieldSpouseAmountHelp", type: "number" },
      { key: "eligibleDependantAmount", labelKey: "fieldEligibleDependantAmount", helpKey: "fieldEligibleDependantAmountHelp", type: "number" },
      { key: "canadaCaregiverAmount", labelKey: "fieldCanadaCaregiverAmount", helpKey: "fieldCanadaCaregiverAmountHelp", type: "number" },
      { key: "cppEiOverpayment", labelKey: "fieldCppEiOverpayment", helpKey: "fieldCppEiOverpaymentHelp", type: "number" },
      { key: "canadaEmploymentAmount", labelKey: "fieldCanadaEmploymentAmount", helpKey: "fieldCanadaEmploymentAmountHelp", type: "number" },
      { key: "homeBuyersAmount", labelKey: "fieldHomeBuyersAmount", helpKey: "fieldHomeBuyersAmountHelp", type: "number" },
      { key: "canadaWorkersAmount", labelKey: "fieldCanadaWorkersAmount", helpKey: "fieldCanadaWorkersAmountHelp", type: "number" }
    ]
  },
  {
    id: "payments",
    titleKey: "wizardPayments",
    descriptionKey: "wizardPaymentsDesc",
    icon: "💳",
    fields: [
      { key: "taxPaidByInstalments", labelKey: "fieldTaxPaidByInstalments", helpKey: "fieldTaxPaidByInstalmentsHelp", type: "number" },
      { key: "totalIncomeTaxDeducted", labelKey: "fieldTotalIncomeTaxDeducted", helpKey: "fieldTotalIncomeTaxDeductedHelp", type: "number", required: true }
    ]
  }
];

export const companyWizardSections: WizardSection[] = [
  {
    id: "company-info",
    titleKey: "wizardCompanyInfo",
    descriptionKey: "wizardCompanyInfoDesc",
    icon: "🏛️",
    fields: [
      { key: "corporationName", labelKey: "fieldCorpName", helpKey: "fieldCorpNameHelp", type: "text", required: true },
      { key: "businessNumber", labelKey: "fieldBusinessNumber", helpKey: "fieldBusinessNumberHelp", type: "text", required: true },
      { key: "fiscalYearEnd", labelKey: "fieldFiscalYearEnd", helpKey: "fieldFiscalYearEndHelp", type: "date", required: true }
    ]
  },
  {
    id: "company-revenue",
    titleKey: "wizardCompanyRevenue",
    descriptionKey: "wizardCompanyRevenueDesc",
    icon: "💰",
    fields: [
      { key: "corporateRevenue", labelKey: "fieldCorpRevenue", helpKey: "fieldCorpRevenueHelp", type: "number", required: true },
      { key: "corporateDeductions", labelKey: "fieldCorpDeductions", helpKey: "fieldCorpDeductionsHelp", type: "number" },
      { key: "capitalCostAllowance", labelKey: "fieldCapitalCostAllowance", helpKey: "fieldCapitalCostAllowanceHelp", type: "number" },
      { key: "retainedEarnings", labelKey: "fieldRetainedEarnings", helpKey: "fieldRetainedEarningsHelp", type: "number" }
    ]
  },
  {
    id: "company-payroll",
    titleKey: "wizardCompanyPayroll",
    descriptionKey: "wizardCompanyPayrollDesc",
    icon: "👥",
    fields: [
      { key: "corporatePayroll", labelKey: "fieldCorpPayroll", helpKey: "fieldCorpPayrollHelp", type: "number" },
      { key: "employeeCount", labelKey: "fieldEmployeeCount", helpKey: "fieldEmployeeCountHelp", type: "number" },
      { key: "cppContributions", labelKey: "fieldCppContributions", helpKey: "fieldCppContributionsHelp", type: "number" },
      { key: "eiPremiums", labelKey: "fieldEiPremiums", helpKey: "fieldEiPremiumsHelp", type: "number" },
      { key: "incomeTaxWithheld", labelKey: "fieldIncomeTaxWithheld", helpKey: "fieldIncomeTaxWithheldHelp", type: "number" }
    ]
  },
  {
    id: "company-gst",
    titleKey: "wizardCompanyGst",
    descriptionKey: "wizardCompanyGstDesc",
    icon: "🧮",
    fields: [
      { key: "gstHstCollected", labelKey: "fieldGstHstCollected", helpKey: "fieldGstHstCollectedHelp", type: "number" },
      { key: "gstHstPaid", labelKey: "fieldGstHstPaid", helpKey: "fieldGstHstPaidHelp", type: "number" },
      { key: "gstHstNetRemittance", labelKey: "fieldGstHstNetRemittance", helpKey: "fieldGstHstNetRemittanceHelp", type: "number" }
    ]
  }
];

export function getWizardSections(mode: FilingMode, profileFlags: Record<string, boolean>): WizardSection[] {
  const base = mode === "COMPANY" ? companyWizardSections : individualWizardSections;
  return base.filter((section) => {
    if (section.mode && !section.mode.includes(mode)) return false;
    if (section.profileFlag && !profileFlags[section.profileFlag]) return false;
    return true;
  });
}

export function requiredFieldsForMode(mode: FilingMode): string[] {
  const allGroups = [...baseFieldGroups, ...(modeSpecificFieldGroups[mode] ?? [])];
  return allGroups.flatMap((g) => g.fields).filter((f) => f.required).map((f) => f.key);
}

export function parseFilingMode(raw: string | undefined): FilingMode {
  if (raw === "SELF_EMPLOYED" || raw === "COMPANY" || raw === "INDIVIDUAL") {
    return raw;
  }

  return "INDIVIDUAL";
}
