export type FilingMode = "INDIVIDUAL" | "SELF_EMPLOYED" | "COMPANY";

export type FieldType = "text" | "number" | "date";

export interface TaxField {
  key: string;
  labelKey: string;
  helpKey: string;
  type: FieldType;
  required?: boolean;
}

export interface FieldGroup {
  id: string;
  titleKey: string;
  fields: TaxField[];
}

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
        type: "text",
        required: true
      },
      {
        key: "maritalStatus",
        labelKey: "fieldMaritalStatus",
        helpKey: "fieldMaritalStatusHelp",
        type: "text"
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
      { key: "otherIncome", labelKey: "fieldOtherIncome", helpKey: "fieldOtherIncomeHelp", type: "number" }
    ]
  },
  {
    id: "deductions",
    titleKey: "groupDeductions",
    fields: [
      { key: "rrsp", labelKey: "fieldRrsp", helpKey: "fieldRrspHelp", type: "number" },
      { key: "tuition", labelKey: "fieldTuition", helpKey: "fieldTuitionHelp", type: "number" },
      { key: "medical", labelKey: "fieldMedical", helpKey: "fieldMedicalHelp", type: "number" }
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
          key: "corporateRevenue",
          labelKey: "fieldCorpRevenue",
          helpKey: "fieldCorpRevenueHelp",
          type: "number",
          required: true
        },
        {
          key: "corporatePayroll",
          labelKey: "fieldCorpPayroll",
          helpKey: "fieldCorpPayrollHelp",
          type: "number"
        },
        {
          key: "corporateDeductions",
          labelKey: "fieldCorpDeductions",
          helpKey: "fieldCorpDeductionsHelp",
          type: "number"
        }
      ]
    }
  ]
};

export function parseFilingMode(raw: string | undefined): FilingMode {
  if (raw === "SELF_EMPLOYED" || raw === "COMPANY" || raw === "INDIVIDUAL") {
    return raw;
  }

  return "INDIVIDUAL";
}
