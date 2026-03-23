"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { LucideIcon } from "@/components/lucide-icon";
import type { Locale } from "@/lib/i18n";
import { textFor } from "@/lib/i18n";
import type { TaxSummary, CorporateTaxSummary, CalculationResult } from "@/lib/services/tax-calculation-engine";

interface LiveRefundBannerProps {
  locale: Locale;
  estimate: CalculationResult | null;
}

export function LiveRefundBanner({ locale, estimate }: LiveRefundBannerProps) {
  const t = textFor(locale);
  const [expanded, setExpanded] = useState(false);
  const [delta, setDelta] = useState<number | null>(null);
  const prevBalance = useRef<number | null>(null);
  const deltaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const balance = getBalance(estimate);
  const hasData = estimate !== null && balance !== null;
  const isRefund = hasData && balance < 0;
  const displayAmount = hasData ? Math.abs(balance) : 0;

  useEffect(() => {
    if (balance === null) return;
    if (prevBalance.current !== null && prevBalance.current !== balance) {
      const diff = balance - prevBalance.current;
      setDelta(diff);
      if (deltaTimer.current) clearTimeout(deltaTimer.current);
      deltaTimer.current = setTimeout(() => setDelta(null), 3000);
    }
    prevBalance.current = balance;
    return () => {
      if (deltaTimer.current) clearTimeout(deltaTimer.current);
    };
  }, [balance]);

  const effectiveRate = getEffectiveRate(estimate);

  return (
    <div
      className={`refund-banner ${!hasData ? "refund-banner-neutral" : isRefund ? "refund-banner-positive" : "refund-banner-negative"}`}
      aria-live="polite"
      role="status"
    >
      <button
        type="button"
        className="refund-banner-main"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <div className="refund-banner-icon">
          {!hasData ? (
            <LucideIcon name="calculator" size={18} />
          ) : isRefund ? (
            <LucideIcon name="trending-up" size={18} />
          ) : (
            <LucideIcon name="trending-down" size={18} />
          )}
        </div>
        <div className="refund-banner-content">
          <span className="refund-banner-label">
            {!hasData
              ? t.liveBannerNoData
              : isRefund
                ? t.liveBannerEstimatedRefund
                : t.liveBannerBalanceOwing}
          </span>
          {hasData && (
            <span className="refund-banner-amount">
              {isRefund ? "+" : "−"}{formatCurrency(displayAmount, locale)}
            </span>
          )}
        </div>
        {delta !== null && delta !== 0 && (
          <span className={`refund-banner-delta ${delta < 0 ? "refund-banner-delta-good" : "refund-banner-delta-bad"}`}>
            {delta < 0 ? "▲" : "▼"} {formatCurrency(Math.abs(delta), locale)}
          </span>
        )}
        {hasData && effectiveRate !== null && (
          <span className="refund-banner-rate">
            {effectiveRate.toFixed(1)}%
          </span>
        )}
        <LucideIcon
          name="chevron-down"
          size={14}
          className={`refund-banner-chevron ${expanded ? "refund-banner-chevron-open" : ""}`}
        />
      </button>
      <div className={`refund-banner-body ${expanded ? "refund-banner-body-open" : ""}`}>
        {hasData && renderBreakdown(estimate, locale, t)}
      </div>
    </div>
  );
}

function getBalance(estimate: CalculationResult | null): number | null {
  if (!estimate) return null;
  if (estimate.mode === "COMPANY") {
    return (estimate.summary as CorporateTaxSummary).totalCorporateTax;
  }
  return (estimate.summary as TaxSummary).balanceOwing;
}

function getEffectiveRate(estimate: CalculationResult | null): number | null {
  if (!estimate) return null;
  if (estimate.mode === "COMPANY") {
    const s = estimate.summary as CorporateTaxSummary;
    if (s.corporateRevenue <= 0) return 0;
    return (s.totalCorporateTax / s.corporateRevenue) * 100;
  }
  const s = estimate.summary as TaxSummary;
  if (s.totalIncome <= 0) return 0;
  return (s.totalTax / s.totalIncome) * 100;
}

function renderBreakdown(
  estimate: CalculationResult,
  locale: Locale,
  t: Record<string, string>
) {
  if (estimate.mode === "COMPANY") {
    const s = estimate.summary as CorporateTaxSummary;
    return (
      <div className="refund-banner-breakdown">
        <div className="refund-banner-row">
          <span>{t.liveBannerIncome}</span>
          <span>{formatCurrency(s.corporateRevenue, locale)}</span>
        </div>
        <div className="refund-banner-row">
          <span>{t.liveBannerDeductions}</span>
          <span>−{formatCurrency(s.totalDeductions, locale)}</span>
        </div>
        <div className="refund-banner-row refund-banner-row-total">
          <span>{t.liveBannerCorporateTax}</span>
          <span>{formatCurrency(s.totalCorporateTax, locale)}</span>
        </div>
      </div>
    );
  }

  const s = estimate.summary as TaxSummary;
  const creditsAndPayments = s.refundableCredits + s.totalPayments;
  return (
    <div className="refund-banner-breakdown">
      <div className="refund-banner-row">
        <span>{t.liveBannerIncome}</span>
        <span>{formatCurrency(s.totalIncome, locale)}</span>
      </div>
      <div className="refund-banner-row">
        <span>{t.liveBannerDeductions}</span>
        <span>−{formatCurrency(s.totalDeductions, locale)}</span>
      </div>
      <div className="refund-banner-row">
        <span>{t.liveBannerFederalTax}</span>
        <span>{formatCurrency(s.netFederalTax, locale)}</span>
      </div>
      {s.provincial && (
        <div className="refund-banner-row">
          <span>{t.liveBannerProvincialTax}</span>
          <span>{formatCurrency(s.provincial.netProvincialTax, locale)}</span>
        </div>
      )}
      {creditsAndPayments > 0 && (
        <div className="refund-banner-row">
          <span>{t.liveBannerCredits}</span>
          <span>−{formatCurrency(creditsAndPayments, locale)}</span>
        </div>
      )}
      <div className="refund-banner-row refund-banner-row-total">
        <span>{t.liveBannerNet}</span>
        <span style={{ color: s.balanceOwing < 0 ? "var(--brand)" : s.balanceOwing > 0 ? "var(--alert)" : undefined }}>
          {s.balanceOwing < 0 ? "+" : ""}{formatCurrency(Math.abs(s.balanceOwing), locale)}
          {s.balanceOwing < 0 ? ` ${t.liveBannerEstimatedRefund.toLowerCase()}` : s.balanceOwing > 0 ? ` ${t.liveBannerBalanceOwing.toLowerCase()}` : ""}
        </span>
      </div>
    </div>
  );
}
