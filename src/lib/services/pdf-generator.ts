import { jsPDF } from "jspdf";
import type { TaxSummary, CorporateTaxSummary, CalculationResult } from "./tax-calculation-engine";

interface PdfReturnData {
  id: string;
  taxYear: number;
  filingMode: string;
  status: string;
  data: Record<string, unknown>;
  taxSummary: CalculationResult | null;
  updatedAt: string | Date;
  submittedAt: string | Date | null;
  externalSubmissionRef: string | null;
}

const LABEL_MAP: Record<string, string> = {
  legalName: "Legal Name",
  sinLast4: "SIN (last 4)",
  birthDate: "Date of Birth",
  residencyProvince: "Province",
  maritalStatus: "Marital Status",
  employmentIncome: "Employment Income",
  selfEmploymentIncome: "Self-Employment Income",
  capitalGains: "Capital Gains",
  interestIncome: "Interest Income",
  dividendIncome: "Dividend Income",
  rentalIncome: "Rental Income",
  otherIncome: "Other Income",
  rrspDeduction: "RRSP Deduction",
  unionDues: "Union Dues",
  childcareExpenses: "Childcare Expenses",
  movingExpenses: "Moving Expenses",
  businessExpenses: "Business Expenses",
  homeOfficeExpenses: "Home Office Expenses",
  vehicleExpenses: "Vehicle Expenses",
  medicalExpenses: "Medical Expenses",
  donationCredits: "Donation Credits",
  tuitionCredits: "Tuition Credits",
  disabilityCredit: "Disability Credit",
  taxPaid: "Tax Already Paid",
  instalmentsPaid: "Instalments Paid",
  corporateRevenue: "Corporate Revenue",
  corporateExpenses: "Corporate Expenses",
  payrollExpenses: "Payroll Expenses",
  gstCollected: "GST/HST Collected",
  gstInputCredits: "GST/HST Input Credits"
};

function fmt(value: number): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value);
}

function safeStr(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function generateReturnPdf(returnData: PdfReturnData): Uint8Array {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  function addPage() {
    doc.addPage();
    y = 20;
  }

  function checkPage(needed: number) {
    if (y + needed > 260) addPage();
  }

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Canada Tax Filing — Return Summary", margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated ${new Date().toLocaleDateString("en-CA")} — For personal records only. Not an official CRA document.`, margin, y);
  doc.setTextColor(0, 0, 0);
  y += 8;

  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  // Return info block
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Return Information", margin, y);
  y += 6;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");

  const infoLines = [
    ["Return ID", returnData.id],
    ["Tax Year", String(returnData.taxYear)],
    ["Filing Mode", returnData.filingMode],
    ["Status", returnData.status],
    ["Last Updated", new Date(returnData.updatedAt).toLocaleDateString("en-CA")],
  ];

  if (returnData.submittedAt) {
    infoLines.push(["Submitted", new Date(returnData.submittedAt).toLocaleDateString("en-CA")]);
  }
  if (returnData.externalSubmissionRef) {
    infoLines.push(["Confirmation #", returnData.externalSubmissionRef]);
  }

  for (const [label, value] of infoLines) {
    doc.setFont("helvetica", "bold");
    doc.text(label + ":", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 38, y);
    y += 5;
  }
  y += 4;

  // Taxpayer data
  const data = returnData.data;
  const filledFields = Object.entries(data).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );

  if (filledFields.length > 0) {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Taxpayer Information", margin, y);
    y += 6;
    doc.setFontSize(9.5);

    for (const [key, value] of filledFields) {
      checkPage(6);
      const label = LABEL_MAP[key] ?? key;
      doc.setFont("helvetica", "normal");
      doc.text(label + ":", margin, y);
      const displayValue = typeof value === "number" ? fmt(value) : safeStr(value);
      doc.text(displayValue, margin + 55, y);
      y += 5;
    }
    y += 4;
  }

  // Tax Summary
  const taxSummary = returnData.taxSummary;
  if (taxSummary) {
    checkPage(30);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Tax Summary", margin, y);
    y += 7;
    doc.setFontSize(9.5);

    if (taxSummary.mode === "COMPANY") {
      const s = taxSummary.summary as CorporateTaxSummary;
      const corpLines: [string, string][] = [
        ["Corporate Revenue", fmt(s.corporateRevenue)],
        ["Total Deductions", fmt(s.totalDeductions)],
        ["Taxable Income", fmt(s.taxableIncome)],
        ["Small Business Tax", fmt(s.smallBusinessTax)],
        ["General Tax", fmt(s.generalTax)],
        ["Total Corporate Tax", fmt(s.totalCorporateTax)],
      ];
      for (const [label, value] of corpLines) {
        checkPage(6);
        doc.setFont("helvetica", "normal");
        doc.text(label + ":", margin, y);
        doc.text(value, margin + 55, y);
        y += 5;
      }
    } else {
      const s = taxSummary.summary as TaxSummary;
      const personalLines: [string, string][] = [
        ["Total Income", fmt(s.totalIncome)],
        ["Total Deductions", fmt(s.totalDeductions)],
        ["Net Income", fmt(s.netIncome)],
        ["Taxable Income", fmt(s.taxableIncome)],
        ["", ""],
        ["Federal Tax", fmt(s.federalTax)],
        ["Basic Personal Credit", fmt(s.basicPersonalCredit)],
        ["Non-Refundable Credits", fmt(s.nonRefundableCredits)],
        ["Net Federal Tax", fmt(s.netFederalTax)],
      ];

      if (s.provincial) {
        personalLines.push(
          ["", ""],
          [`Provincial Tax (${s.provincial.provinceName})`, fmt(s.provincial.provincialTax)],
          ["Provincial Credits", fmt(s.provincial.provincialNonRefundableCredits)],
          ["Net Provincial Tax", fmt(s.provincial.netProvincialTax)]
        );
        if (s.provincial.provincialSurtax > 0) {
          personalLines.push(["Provincial Surtax", fmt(s.provincial.provincialSurtax)]);
        }
      }

      personalLines.push(
        ["", ""],
        ["Total Tax", fmt(s.totalTax)],
        ["Refundable Credits", fmt(s.refundableCredits)],
        ["Total Payments", fmt(s.totalPayments)],
        ["Balance Owing", fmt(s.balanceOwing)]
      );

      for (const [label, value] of personalLines) {
        if (label === "" && value === "") {
          y += 2;
          continue;
        }
        checkPage(6);
        const isBold = label === "Balance Owing" || label === "Net Federal Tax" || label === "Total Corporate Tax";
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.text(label + ":", margin, y);
        doc.text(value, margin + 55, y);
        y += 5;
      }
    }
  }

  // Footer
  y += 8;
  checkPage(12);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(130, 130, 130);
  doc.text(
    "This document is generated for personal record-keeping. It is not an official CRA filing document.",
    margin,
    y
  );
  y += 4;
  doc.text(
    `Canada Tax Filing — ${new Date().getFullYear()} — https://canada-tax-filing.vercel.app`,
    margin,
    y
  );

  return doc.output("arraybuffer") as unknown as Uint8Array;
}
