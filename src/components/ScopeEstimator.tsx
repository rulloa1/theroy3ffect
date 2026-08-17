import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Sparkles, ArrowRight, Calculator, ShieldCheck, Clock, Zap } from "lucide-react";

export interface ScopeFeature {
  id: string;
  label: string;
  description: string;
  price: number;
  daysAdded: number;
}

const PROJECT_TYPES = [
  {
    id: "landing_page",
    name: "Conversion Landing Page",
    basePrice: 2500,
    baseDays: 7,
    description: "High-impact single page designed for maximum lead capture & sales.",
    defaultPages: 1,
    maxPages: 3,
  },
  {
    id: "full_website",
    name: "Full Multi-Page Website",
    basePrice: 5000,
    baseDays: 18,
    description: "Complete custom digital experience: marketing, services, case studies & CMS.",
    defaultPages: 5,
    maxPages: 15,
  },
  {
    id: "brand_identity",
    name: "Brand Identity System",
    basePrice: 1500,
    baseDays: 5,
    description: "Comprehensive logo mark, typography guidelines, color palette & assets.",
    defaultPages: 0,
    maxPages: 0,
  },
  {
    id: "retainer",
    name: "Monthly Design Retainer",
    basePrice: 4500,
    baseDays: 30,
    description: "Continuous UI/UX design & development queue with dedicated turnaround.",
    defaultPages: 0,
    maxPages: 0,
    isRetainer: true,
  },
] as const;

const OPTIONAL_FEATURES: ScopeFeature[] = [
  {
    id: "webgl_3d",
    label: "3D / WebGL Shader Animations",
    description: "Custom interactive canvas, particle physics & kinetic micro-interactions",
    price: 1000,
    daysAdded: 4,
  },
  {
    id: "cms_system",
    label: "Dynamic CMS / Case Studies",
    description: "Self-serve content management for blog articles, work & client showcases",
    price: 750,
    daysAdded: 3,
  },
  {
    id: "stripe_commerce",
    label: "Stripe eCommerce & Checkouts",
    description: "Full cart, checkout sessions, customer portal & automatic receipt emails",
    price: 1000,
    daysAdded: 4,
  },
  {
    id: "brand_bundle",
    label: "Full Brand Visual Identity Suite",
    description: "Vector logo mark suite, custom fonts, favicon, and brand styleguide",
    price: 1500,
    daysAdded: 5,
  },
  {
    id: "seo_copy",
    label: "SEO Architecture & Copywriting",
    description: "High-converting sales copy, meta tags, schema markup & sitemap setup",
    price: 750,
    daysAdded: 2,
  },
  {
    id: "rush_delivery",
    label: "Priority Rush Kickoff (Save ~40% Timeline)",
    description: "Dedicated priority build slot with expedited milestone reviews",
    price: 1500,
    daysAdded: -5,
  },
];

export function ScopeEstimator({
  onSelectScope,
}: {
  onSelectScope?: (summary: {
    projectType: string;
    pageCount: number;
    features: string[];
    totalPrice: number;
    depositPrice: number;
    timelineWeeks: string;
  }) => void;
}) {
  const [selectedType, setSelectedType] = useState<string>("full_website");
  const [pageCount, setPageCount] = useState<number>(5);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    "webgl_3d",
    "seo_copy",
  ]);

  const activeTypeObj = useMemo(
    () => PROJECT_TYPES.find((t) => t.id === selectedType) ?? PROJECT_TYPES[1]!,
    [selectedType],
  );

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId],
    );
  };

  const { totalPrice, depositPrice, timelineString } = useMemo(() => {
    let price = activeTypeObj.basePrice;
    let days = activeTypeObj.baseDays;

    if (activeTypeObj.maxPages > 0 && pageCount > activeTypeObj.defaultPages) {
      const extraPages = pageCount - activeTypeObj.defaultPages;
      price += extraPages * 400; // $400 per extra designed & built page
      days += extraPages * 1.5;
    }

    if (!activeTypeObj.isRetainer) {
      for (const featId of selectedFeatures) {
        const feat = OPTIONAL_FEATURES.find((f) => f.id === featId);
        if (feat) {
          price += feat.price;
          days += feat.daysAdded;
        }
      }
    }

    const calculatedDays = Math.max(days, 5);
    const weeksMin = Math.max(1, Math.round(calculatedDays / 7));
    const weeksMax = weeksMin + 1;
    const timeline = activeTypeObj.isRetainer
      ? "Monthly (Continuous)"
      : `${weeksMin}–${weeksMax} Weeks`;

    return {
      totalPrice: price,
      depositPrice: Math.round(price * 0.5),
      timelineString: timeline,
    };
  }, [activeTypeObj, pageCount, selectedFeatures]);

  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(totalPrice);

  const formattedDeposit = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(depositPrice);

  const scopePayload = {
    projectType: activeTypeObj.name,
    pageCount: activeTypeObj.maxPages > 0 ? pageCount : 1,
    features: selectedFeatures,
    totalPrice,
    depositPrice,
    timelineWeeks: timelineString,
  };

  return (
    <div className="w-full border border-white/15 bg-white/[0.02] p-6 md:p-10 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.25em] text-[#DFBA73] uppercase">
            <Calculator className="size-3.5" />
            INTERACTIVE SCOPE &amp; INVESTMENT ESTIMATOR
          </div>
          <h3 className="mt-2 font-display text-3xl uppercase text-white sm:text-4xl">
            CALCULATE YOUR PROJECT INVESTMENT
          </h3>
        </div>
        <div className="font-mono text-xs text-white/50">
          Transparent, fixed milestone pricing &bull; No hidden fees
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Left Options Controls (8 Cols) */}
        <div className="space-y-8 lg:col-span-7">
          {/* Step 1: Select Engagement Model */}
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-white/70">
              1. Select Project Type
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {PROJECT_TYPES.map((pt) => {
                const isSelected = selectedType === pt.id;
                return (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => {
                      setSelectedType(pt.id);
                      if (pt.defaultPages > 0) setPageCount(pt.defaultPages);
                    }}
                    className={`flex flex-col justify-between border p-4 text-left transition-all ${
                      isSelected
                        ? "border-[#DFBA73] bg-[#DFBA73]/10 text-white shadow-[0_0_20px_rgba(223,186,115,0.2)]"
                        : "border-white/10 bg-white/[0.01] text-white/70 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-display text-lg uppercase text-white">{pt.name}</span>
                        {isSelected && <Check className="size-4 text-[#DFBA73]" />}
                      </div>
                      <p className="mt-1 font-mono text-[11px] leading-relaxed text-white/50">
                        {pt.description}
                      </p>
                    </div>
                    <span className="mt-3 font-mono text-xs font-semibold text-[#DFBA73]">
                      Starting at ${pt.basePrice.toLocaleString()} {pt.isRetainer ? "/mo" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Page Count Slider (If applicable) */}
          {activeTypeObj.maxPages > 0 && (
            <div>
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs uppercase tracking-wider text-white/70">
                  2. Number of Custom Pages
                </label>
                <span className="font-mono text-sm font-bold text-[#DFBA73]">
                  {pageCount} {pageCount === 1 ? "Page" : "Pages"}
                </span>
              </div>
              <input
                type="range"
                min={activeTypeObj.defaultPages}
                max={activeTypeObj.maxPages}
                step={1}
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-[#DFBA73]"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-white/40">
                <span>{activeTypeObj.defaultPages} Pages (Base)</span>
                <span>{activeTypeObj.maxPages} Pages (Complex Multi-Page)</span>
              </div>
            </div>
          )}

          {/* Step 3: Interactive Feature Add-Ons */}
          {!activeTypeObj.isRetainer && (
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-white/70">
                {activeTypeObj.maxPages > 0 ? "3." : "2."} Select Features &amp; Add-Ons
              </label>
              <div className="mt-3 space-y-2.5">
                {OPTIONAL_FEATURES.map((feat) => {
                  const isChecked = selectedFeatures.includes(feat.id);
                  return (
                    <button
                      key={feat.id}
                      type="button"
                      onClick={() => toggleFeature(feat.id)}
                      className={`flex w-full items-center justify-between border p-3.5 text-left transition-all ${
                        isChecked
                          ? "border-[#DFBA73]/60 bg-[#DFBA73]/10 text-white"
                          : "border-white/10 bg-white/[0.01] text-white/70 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex size-4 shrink-0 items-center justify-center border ${
                            isChecked
                              ? "border-[#DFBA73] bg-[#DFBA73] text-black"
                              : "border-white/30"
                          }`}
                        >
                          {isChecked && <Check className="size-3 stroke-[3]" />}
                        </div>
                        <div>
                          <span className="font-display text-sm uppercase tracking-wide text-white">
                            {feat.label}
                          </span>
                          <p className="font-mono text-[11px] text-white/50">{feat.description}</p>
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-xs font-semibold text-[#DFBA73]">
                        +${feat.price.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Summary Card (5 Cols) */}
        <div className="flex flex-col justify-between border border-[#DFBA73]/30 bg-[#0a0a14] p-6 shadow-xl lg:col-span-5">
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#DFBA73]">
                PROJECT ESTIMATE BREAKDOWN
              </span>
              <h4 className="mt-1 font-display text-2xl uppercase text-white">
                {activeTypeObj.name}
              </h4>
              <p className="mt-1 font-mono text-xs text-white/50">{timelineString} Estimated Delivery</p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between text-white/70">
                <span>Base Scope:</span>
                <span className="text-white">${activeTypeObj.basePrice.toLocaleString()}</span>
              </div>

              {activeTypeObj.maxPages > 0 && pageCount > activeTypeObj.defaultPages && (
                <div className="flex justify-between text-white/70">
                  <span>Additional Pages ({pageCount - activeTypeObj.defaultPages}):</span>
                  <span className="text-white">
                    +${((pageCount - activeTypeObj.defaultPages) * 400).toLocaleString()}
                  </span>
                </div>
              )}

              {!activeTypeObj.isRetainer &&
                selectedFeatures.map((fId) => {
                  const feat = OPTIONAL_FEATURES.find((f) => f.id === fId);
                  if (!feat) return null;
                  return (
                    <div key={fId} className="flex justify-between text-white/70">
                      <span className="truncate pr-2">{feat.label}:</span>
                      <span className="text-white">+${feat.price.toLocaleString()}</span>
                    </div>
                  );
                })}
            </div>

            <div className="border-t border-white/15 pt-4">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-white/60">
                  Estimated Total:
                </span>
                <span className="font-display text-4xl text-[#E51924] drop-shadow-[0_0_16px_rgba(229,25,36,0.4)]">
                  {formattedTotal}
                </span>
              </div>

              {!activeTypeObj.isRetainer && (
                <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2 font-mono text-xs text-[#DFBA73]">
                  <span>50% Kickoff Deposit:</span>
                  <span className="font-bold">{formattedDeposit}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border border-white/10 bg-white/[0.02] p-3 font-mono text-[10px] text-white/60">
              <ShieldCheck className="size-4 shrink-0 text-[#DFBA73]" />
              <span>Deposits are 100% refundable prior to directional kickoff.</span>
            </div>
          </div>

          <div className="mt-8 space-y-2.5">
            <Link
              to="/brief"
              search={{
                scope_type: activeTypeObj.name,
                scope_estimate: String(totalPrice),
              }}
              className="flex w-full items-center justify-center gap-2 bg-[#E51924] py-3.5 font-mono text-xs font-bold tracking-widest text-white transition-all hover:bg-[#FF3333] hover:shadow-[0_0_24px_rgba(229,25,36,0.6)]"
            >
              LOCK IN SCOPE &amp; SUBMIT BRIEF <ArrowRight className="size-4" />
            </Link>

            <p className="text-center font-mono text-[10px] text-white/40">
              Direct consultation with Rory Ulloa &bull; Written scope within 24 hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
