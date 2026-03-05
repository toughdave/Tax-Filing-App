import type { WizardSection } from "./tax-field-config";

/**
 * Province-specific wizard sections injected dynamically based on the
 * user's selected province of residence. Keyed by province code (e.g. "ON").
 *
 * Each province returns an array of WizardSection configs that are appended
 * after the federal sections in the wizard timeline.
 */

const ontarioSections: WizardSection[] = [
  {
    id: "on428",
    titleKey: "wizardON428",
    descriptionKey: "wizardON428Desc",
    icon: "map-pin",
    craFormRef: "ON428",
    fields: [
      { key: "onBasicPersonal", labelKey: "fieldOnBasicPersonal", helpKey: "fieldOnBasicPersonalHelp", type: "number", craLine: "58040", friendlyLabelKey: "friendlyOnBasicPersonal" },
      { key: "onSpouseAmount", labelKey: "fieldOnSpouseAmount", helpKey: "fieldOnSpouseAmountHelp", type: "number", craLine: "58120", friendlyLabelKey: "friendlyOnSpouseAmount", promptType: "yesno" },
      { key: "onAgeAmount", labelKey: "fieldOnAgeAmount", helpKey: "fieldOnAgeAmountHelp", type: "number", craLine: "58160", friendlyLabelKey: "friendlyOnAgeAmount", promptType: "yesno" },
      { key: "onDonations", labelKey: "fieldOnDonations", helpKey: "fieldOnDonationsHelp", type: "number", craLine: "58969", friendlyLabelKey: "friendlyOnDonations", promptType: "yesno" },
      { key: "onSurtax", labelKey: "fieldOnSurtax", helpKey: "fieldOnSurtaxHelp", type: "number", craLine: "60920", friendlyLabelKey: "friendlyOnSurtax" }
    ]
  },
  {
    id: "on-ben",
    titleKey: "wizardONBEN",
    descriptionKey: "wizardONBENDesc",
    icon: "home",
    craFormRef: "ON-BEN",
    fields: [
      { key: "onPropertyTax", labelKey: "fieldOnPropertyTax", helpKey: "fieldOnPropertyTaxHelp", type: "number", friendlyLabelKey: "friendlyOnPropertyTax", promptType: "yesno" },
      { key: "onEnergyCredit", labelKey: "fieldOnEnergyCredit", helpKey: "fieldOnEnergyCreditHelp", type: "number", friendlyLabelKey: "friendlyOnEnergyCredit", promptType: "yesno" },
      { key: "onRent", labelKey: "fieldOnRent", helpKey: "fieldOnRentHelp", type: "number", friendlyLabelKey: "friendlyOnRent", promptType: "yesno" },
      { key: "onNorthernEnergy", labelKey: "fieldOnNorthernEnergy", helpKey: "fieldOnNorthernEnergyHelp", type: "number", friendlyLabelKey: "friendlyOnNorthernEnergy", promptType: "yesno" }
    ]
  }
];

const provincialSectionsMap: Record<string, WizardSection[]> = {
  ON: ontarioSections
};

/**
 * Returns province-specific wizard sections for a given province code.
 * Returns an empty array for provinces without custom forms yet.
 */
export function getProvincialSections(provinceCode: string): WizardSection[] {
  return provincialSectionsMap[provinceCode] ?? [];
}

/** List of provinces that have custom form sections. */
export const provincesWithForms: string[] = Object.keys(provincialSectionsMap);
