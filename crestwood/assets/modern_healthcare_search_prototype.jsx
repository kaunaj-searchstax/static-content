import React, { useEffect, useId, useMemo, useRef, useState } from "react";

type SearchType = "all" | "providers" | "locations" | "services";
type Mode = "providers" | "content";
type Page = "home" | "results";
type ViewMode = "list" | "grid";

type SearchSubmission = {
  query: string;
  location?: string;
  mode?: Mode;
  searchType?: SearchType;
  useNearby?: boolean;
};

type Provider = {
  id: number;
  name: string;
  gender: string;
  specialty: string;
  distance: string;
  accepting: boolean;
  telehealth: boolean;
  nextAvailable: string;
  languages: string[];
  insurance: string[];
  rating: number;
  reviews: number;
  experience: number;
  hospital: string;
  phone: string;
};

type ContentResult = {
  id: number;
  type: "Service" | "Patient Resource" | "Location";
  title: string;
  summary: string;
  cta: string;
  address?: string;
  meta?: string[];
  areaLabel?: string;
};

type FilterGroup = {
  title: string;
  items: string[];
};

type FilterSelectionState = Record<string, string[]>;

type ProviderLocationState = {
  displayLabel: string;
  submittedLocation: string;
  usesNearby: boolean;
};

type SmartAnswerDemo = {
  matchTerms: string[];
  question: string;
  title: string;
  summary: string;
  bullets: string[];
  sources: string[];
  actions: string[];
  disclaimer: string;
};

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const defaultNearbyLabel = "Near you · Within 5 miles";

const SEARCH_TYPE_TABS: Array<{ key: SearchType; label: string }> = [
  { key: "all", label: "All" },
  { key: "providers", label: "Providers" },
  { key: "locations", label: "Locations" },
  { key: "services", label: "Care guidance" },
];

const providers: Provider[] = [
  {
    id: 1,
    name: "Dr. Maya Olson, MD",
    gender: "Female",
    specialty: "Nuclear Medicine",
    distance: "2.7 mi",
    accepting: true,
    telehealth: true,
    nextAvailable: "Tomorrow, 9:20 AM",
    languages: ["English", "Spanish"],
    insurance: ["Aetna", "Blue Cross Blue Shield"],
    rating: 4.8,
    reviews: 367,
    experience: 14,
    hospital: "Melrose Imaging Center",
    phone: "(866) 555-0801",
  },
  {
    id: 2,
    name: "Dr. John Mason, MD",
    gender: "Male",
    specialty: "Nuclear Medicine",
    distance: "3.1 mi",
    accepting: true,
    telehealth: false,
    nextAvailable: "Thu, 1:10 PM",
    languages: ["English"],
    insurance: ["Aetna", "Cigna"],
    rating: 4.7,
    reviews: 475,
    experience: 12,
    hospital: "Downtown LA Diagnostic",
    phone: "(937) 555-1677",
  },
  {
    id: 3,
    name: "Dr. Ava Patel, DO",
    gender: "Female",
    specialty: "Family Medicine",
    distance: "4.4 mi",
    accepting: true,
    telehealth: true,
    nextAvailable: "Today, 4:40 PM",
    languages: ["English", "Hindi"],
    insurance: ["Blue Cross Blue Shield", "Humana"],
    rating: 4.9,
    reviews: 269,
    experience: 7,
    hospital: "Sunset Family Care",
    phone: "(456) 555-3953",
  },
];

const contentResults: ContentResult[] = [
  {
    id: 1,
    type: "Service",
    title: "Nuclear Medicine and PET Imaging",
    summary: "Overview of diagnostic imaging services, preparation steps, and referral requirements.",
    cta: "See details",
  },
  {
    id: 2,
    type: "Patient Resource",
    title: "Using Blue Cross for Specialist Visits",
    summary: "Plain-language guide to referrals, prior authorization, and what to bring to your visit.",
    cta: "Open guide",
  },
  {
    id: 3,
    type: "Location",
    title: "Acme Healthcare Imaging Center - Downtown LA",
    summary: "Hours, parking, transit details, and imaging center contact information.",
    cta: "View location",
    address: "123 Hope St, Los Angeles, CA 90017",
    meta: ["Open until 8 PM", "2.1 mi", "Parking available"],
    areaLabel: "Downtown LA",
  },
  {
    id: 4,
    type: "Location",
    title: "Westwood Specialty Clinic",
    summary: "Specialty clinic details, parking information, accessibility notes, and hours.",
    cta: "View location",
    address: "1090 Glendon Ave, Los Angeles, CA 90024",
    meta: ["Open until 6 PM", "1.4 mi", "Valet parking"],
    areaLabel: "Westwood",
  },
  {
    id: 5,
    type: "Service",
    title: "Cancer screening and diagnostic pathways",
    summary: "Explore screening programs, referrals, imaging, and follow-up care services.",
    cta: "See details",
  },
  {
    id: 6,
    type: "Patient Resource",
    title: "Preparing for your outpatient visit",
    summary: "Checklist for forms, medications, insurance, and arrival guidance before your visit.",
    cta: "Open guide",
  },
];

const smartAnswerDemos: SmartAnswerDemo[] = [
  {
    matchTerms: ["nuclear medicine", "pet imaging", "pet scan"],
    question: "What is nuclear medicine and how is it used?",
    title: "Nuclear medicine and PET imaging overview",
    summary:
      "Nuclear medicine uses small amounts of radiotracer to help clinicians evaluate organ function, detect disease, and support treatment planning. PET imaging is one example and is commonly used to provide more detailed diagnostic information alongside other imaging studies.",
    bullets: [
      "Often used to evaluate organ function, cancer pathways, and certain cardiac or neurological conditions",
      "Preparation can vary by exam, so visit instructions and referrals matter",
      "Insurance approval or prior authorization may be required depending on the study",
    ],
    sources: ["Service overview", "Preparation guidance", "Referral information", "Locations offering this service"],
    actions: ["Explore service details", "Find a specialist", "View locations"],
    disclaimer: "General information only. Talk to a licensed clinician about diagnosis or treatment decisions.",
  },
  {
    matchTerms: ["cancer screening", "screening"],
    question: "What should I know about cancer screening services?",
    title: "Cancer screening service guidance",
    summary:
      "Cancer screening services help identify signs of disease earlier and may include imaging, lab work, or procedure-based screening depending on the program. The right screening pathway depends on age, history, risk factors, and the care team's clinical guidance.",
    bullets: [
      "Screening programs vary by age, history, and risk profile",
      "Some screenings may require referrals, scheduling prep, or follow-up imaging",
      "Care teams can help route patients to the right screening service and location",
    ],
    sources: ["Service details", "Preparation checklist", "Care pathway guidance"],
    actions: ["See screening services", "Find a specialist", "Prepare for your visit"],
    disclaimer: "General information only. Talk to a licensed clinician about diagnosis or treatment decisions.",
  },
  {
    matchTerms: ["primary care"],
    question: "What does primary care help with?",
    title: "Primary care service guidance",
    summary:
      "Primary care supports preventive care, routine health concerns, chronic condition follow-up, and coordination with specialists when needed. It often serves as the starting point for ongoing care and referrals across the healthcare system.",
    bullets: [
      "Often used for wellness visits, common concerns, and ongoing care planning",
      "Can help coordinate referrals, follow-up testing, and specialist access",
      "Visit preparation may include insurance details, medications, and prior records",
    ],
    sources: ["Primary care overview", "Referral guidance", "Patient visit preparation"],
    actions: ["Explore primary care", "Find a provider", "Prepare for your visit"],
    disclaimer: "General information only. Talk to a licensed clinician about diagnosis or treatment decisions.",
  },
];

const providerDemoTerms = [
  "Allergy and Immunology",
  "Cardiology",
  "Dermatology",
  "Family Medicine",
  "Internal Medicine",
  "Neurology",
  "Nuclear Medicine",
  "Orthopedics",
  "Pediatrics",
  "Primary Care",
];

const providerDemoLocations = ["90024", "90210", "90277", "Santa Monica, CA", "Torrance, CA", "Westwood, CA"];

const contentDemoSuggestions = [
  { label: "Billing and insurance", type: "Patient Resource" as const },
  { label: "PET scan preparation", type: "Patient Resource" as const },
  { label: "Nuclear medicine", type: "Service" as const },
  { label: "Patient forms", type: "Patient Resource" as const },
  { label: "Locations near me", type: "Location" as const },
  { label: "Primary care", type: "Service" as const },
  { label: "Westwood clinic", type: "Location" as const },
];

const careGuidanceQuestionSuggestions = [
  { label: "What is nuclear medicine and how is it used?", type: "Service" as const },
  { label: "What should I know about cancer screening services?", type: "Service" as const },
  { label: "What does primary care help with?", type: "Service" as const },
  { label: "How do I prepare for PET imaging?", type: "Patient Resource" as const },
];

const popularProviderSearches = [
  { label: "Nuclear Medicine nearby", query: "Nuclear Medicine" },
  { label: "Family Medicine nearby", query: "Family Medicine" },
  { label: "Cardiology nearby", query: "Cardiology" },
];

const popularContentSearchesByType: Record<Exclude<SearchType, "providers">, string[]> = {
  all: ["billing and insurance", "PET scan preparation", "locations near me", "patient forms"],
  locations: ["downtown imaging center", "westwood clinic", "locations near me", "parking and directions"],
  services: [
    "What is nuclear medicine and how is it used?",
    "What should I know about cancer screening services?",
    "What does primary care help with?",
    "How do I prepare for PET imaging?",
  ],
};

const providerFilterGroups: FilterGroup[] = [
  { title: "Distance", items: ["Within 5 miles", "Within 10 miles", "Within 25 miles"] },
  { title: "Access", items: ["Accepting patients", "Telehealth", "Next available this week"] },
  { title: "Gender", items: ["Female", "Male", "Non-binary"] },
  { title: "Insurance", items: ["Blue Cross", "Aetna", "Cigna", "Humana"] },
  { title: "Languages", items: ["English", "Spanish", "Hindi", "Chinese"] },
];

const contentFilterGroups: FilterGroup[] = [
  { title: "Content Type", items: ["Services", "Patient Resources", "Locations", "Billing"] },
  { title: "Audience", items: ["Patients", "Caregivers", "Families", "Referring Providers"] },
  { title: "Topic", items: ["Insurance", "Preparation", "Appointments", "Primary Care"] },
  { title: "Care Area", items: ["Imaging", "Specialty Care", "Primary Care", "Urgent Care"] },
  { title: "Format", items: ["Guide", "Checklist", "Directory", "FAQ"] },
];

function getModeFromSearchType(searchType: SearchType): Mode {
  return searchType === "providers" ? "providers" : "content";
}

function getSearchTypeLabel(searchType: SearchType): string {
  switch (searchType) {
    case "all":
      return "All";
    case "providers":
      return "Providers";
    case "locations":
      return "Locations";
    case "services":
      return "Care guidance";
    default:
      return "All";
  }
}

function getSearchPlaceholder(searchType: SearchType): string {
  switch (searchType) {
    case "all":
      return "Doctors, locations, services, or topics";
    case "providers":
      return "Specialty, condition, or doctor name";
    case "locations":
      return "Search locations, clinics, and care sites";
    case "services":
      return "Enter a care question";
    default:
      return "Search";
  }
}

function getContentSuggestions(searchType: SearchType): typeof contentDemoSuggestions {
  if (searchType === "services") return careGuidanceQuestionSuggestions;
  if (searchType === "locations") return contentDemoSuggestions.filter((item) => item.type === "Location");
  return contentDemoSuggestions;
}

function filterContentResults(searchType: SearchType, query: string): ContentResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  let scoped = contentResults;

  if (searchType === "locations") {
    scoped = contentResults.filter((item) => item.type === "Location");
  } else if (searchType === "services") {
    scoped = contentResults.filter((item) => item.type === "Service");
  }

  if (!normalizedQuery) return scoped;

  const matched = scoped.filter((item) => {
    const haystack = `${item.title} ${item.summary} ${item.type} ${item.address || ""}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  return matched.length ? matched : scoped;
}

function getResultCountText(searchType: SearchType, total: number, shown: number): string {
  const suffix = searchType === "all" ? "" : ` ${getSearchTypeLabel(searchType).toLowerCase()}`;
  return `${shown} of ${total}${suffix}`;
}

function createInitialSelections(mode: Mode): FilterSelectionState {
  return mode === "providers"
    ? { Distance: ["Within 5 miles"], Access: [], Gender: [], Insurance: [], Languages: [] }
    : { "Content Type": [], Audience: [], Topic: [], "Care Area": [], Format: [] };
}

function clearSelectionsForMode(mode: Mode): FilterSelectionState {
  const initial = createInitialSelections(mode);
  return Object.fromEntries(Object.keys(initial).map((key) => [key, []])) as FilterSelectionState;
}

function getSelectedFilterCount(selectedFilters: FilterSelectionState): number {
  return Object.values(selectedFilters).reduce((count, values) => count + values.length, 0);
}

function resolveProviderLocationState(useNearbyLocation: boolean, location: string): ProviderLocationState {
  const trimmedLocation = location.trim();
  if (!useNearbyLocation && trimmedLocation.length > 0) {
    return {
      displayLabel: `Near ${trimmedLocation} · Within 5 miles`,
      submittedLocation: trimmedLocation,
      usesNearby: false,
    };
  }
  return {
    displayLabel: defaultNearbyLabel,
    submittedLocation: "Near you",
    usesNearby: true,
  };
}

function getSmartAnswerDemo(query: string, searchType: SearchType): SmartAnswerDemo | null {
  if (searchType !== "services") return null;
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return null;
  return smartAnswerDemos.find((demo) => demo.matchTerms.some((term) => normalizedQuery.includes(term))) || null;
}

const providerWorkflowTests: Array<{
  useNearbyLocation: boolean;
  location: string;
  expectedLocation: string;
  expectedNearby: boolean;
}> = [
  { useNearbyLocation: true, location: "", expectedLocation: "Near you", expectedNearby: true },
  { useNearbyLocation: true, location: "90210", expectedLocation: "Near you", expectedNearby: true },
  { useNearbyLocation: false, location: "90210", expectedLocation: "90210", expectedNearby: false },
  { useNearbyLocation: false, location: "", expectedLocation: "Near you", expectedNearby: true },
];

const contentHelperTests: Array<{
  searchType: SearchType;
  expectedTypes: Array<ContentResult["type"]>;
}> = [
  { searchType: "all", expectedTypes: ["Service", "Patient Resource", "Location"] },
  { searchType: "locations", expectedTypes: ["Location"] },
  { searchType: "services", expectedTypes: ["Service"] },
];

const careGuidanceQuestionTests = popularContentSearchesByType.services;
console.assert(careGuidanceQuestionTests.every((item) => item.endsWith("?")), "Care guidance prompt test failed: popular prompts should be questions");
console.assert(careGuidanceQuestionSuggestions.every((item) => item.label.endsWith("?")), "Care guidance autosuggest test failed: autosuggest prompts should be questions");

providerWorkflowTests.forEach((testCase) => {
  const resolved = resolveProviderLocationState(testCase.useNearbyLocation, testCase.location);
  console.assert(resolved.submittedLocation === testCase.expectedLocation, "Provider location test failed: submitted location");
  console.assert(resolved.usesNearby === testCase.expectedNearby, "Provider location test failed: nearby mode");
});

contentHelperTests.forEach((testCase) => {
  const suggestions = getContentSuggestions(testCase.searchType);
  console.assert(Array.isArray(suggestions), "Content suggestions test failed: suggestions not array");
  console.assert(suggestions.every((item) => testCase.expectedTypes.includes(item.type)), "Content suggestions test failed: unexpected type");
});

const locationCardTests = filterContentResults("locations", "downtown");
console.assert(locationCardTests.every((item) => item.type === "Location"), "Location card test failed: locations filter returned non-location items");
console.assert(locationCardTests.some((item) => item.address), "Location card test failed: location items should expose address metadata");

function IconBase({ className = "h-5 w-5", children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </IconBase>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M12 21s-6-5.2-6-11a6 6 0 0 1 12 0c0 5.8-6 11-6 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </IconBase>
  );
}

function SlidersIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M4 21v-7" />
      <path d="M4 10V3" />
      <path d="M12 21v-4" />
      <path d="M12 13V3" />
      <path d="M20 21v-9" />
      <path d="M20 8V3" />
      <path d="M2 14h4" />
      <path d="M10 13h4" />
      <path d="M18 8h4" />
    </IconBase>
  );
}

function HeartPulseIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M12 21s-7-4.3-9-9a5.5 5.5 0 0 1 9-6 5.5 5.5 0 0 1 9 6c-2 4.7-9 9-9 9Z" />
      <path d="M7 12h2l1.3-3 2.4 6 1.3-3H17" />
    </IconBase>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className || "h-5 w-5"} aria-hidden="true">
      <path d="M12 2.8l2.8 5.6 6.2.9-4.5 4.4 1.1 6.2L12 17l-5.6 2.9 1.1-6.2-4.5-4.4 6.2-.9L12 2.8Z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 10h18" />
    </IconBase>
  );
}

function LanguagesIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M4 5h8" />
      <path d="M8 5c0 6-4 9-4 9" />
      <path d="M8 5c0 3 2 6 4 8" />
      <path d="M14 16h6" />
      <path d="M17 6l4 10" />
      <path d="M19 11h-4" />
    </IconBase>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M12 22s7-3 7-10V6l-7-3-7 3v6c0 7 7 10 7 10Z" />
      <path d="m9.5 12 1.8 1.8 3.2-3.6" />
    </IconBase>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </IconBase>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 13" />
      <path d="M14 11a5 5 0 0 1 0 7l-1.5 1.5a5 5 0 0 1-7-7L7 11" />
    </IconBase>
  );
}

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-[22px] border border-slate-200 bg-white shadow-sm transition-shadow duration-200", className)}>{children}</div>;
}

function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline";
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-[18px] px-5 py-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
  const styles =
    variant === "outline"
      ? "border border-slate-300 bg-white text-slate-900 cursor-pointer hover:-translate-y-[1px] hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
      : "bg-slate-900 text-white cursor-pointer hover:-translate-y-[1px] hover:bg-slate-800 hover:shadow-lg";

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cn(base, styles, className)}>
      {children}
    </button>
  );
}

function Badge({ children, tone = "default", className = "" }: { children: React.ReactNode; tone?: "default" | "secondary" | "outline" | "success" | "info"; className?: string }) {
  const tones: Record<string, string> = {
    default: "border border-slate-200 bg-white text-slate-700",
    secondary: "border border-slate-200 bg-slate-100 text-slate-700",
    outline: "border border-slate-300 bg-white text-slate-700",
    success: "border border-emerald-600 bg-emerald-600 text-white",
    info: "border border-blue-700 bg-blue-700 text-white",
  };

  return <span className={cn("inline-flex items-center rounded-[999px] px-3 py-1 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

function SearchTypeTabs({ searchType, setSearchType, compact = false }: { searchType: SearchType; setSearchType: (searchType: SearchType) => void; compact?: boolean }) {
  return (
    <div className={cn("flex flex-wrap gap-2", compact && "gap-1.5")}>
      {SEARCH_TYPE_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => setSearchType(tab.key)}
          aria-pressed={searchType === tab.key}
          className={cn(
            "cursor-pointer rounded-[999px] border px-3.5 py-2 text-[13px] font-semibold transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
            compact ? "px-3 py-1.5 text-xs" : "sm:px-4 sm:text-sm",
            searchType === tab.key ? "border-sky-200 bg-sky-50 text-sky-900 shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function SearchInput({
  icon,
  value,
  onChange,
  onFocus,
  onClear,
  onKeyDown,
  placeholder,
  label,
  compact = false,
  inputRef,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onClear?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
  label: string;
  compact?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const Icon = icon;
  const inputId = useId();
  const hasValue = value.trim().length > 0;

  return (
    <div className={cn("rounded-[14px] border border-slate-200 bg-white transition focus-within:border-slate-900 focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.18)]", compact ? "px-4 py-0" : "px-4 py-3")}>
      {!compact && (
        <label htmlFor={inputId} className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </label>
      )}
      <div className={cn("flex items-center gap-3", compact && "h-[54px]")}>
        <Icon className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          ref={inputRef}
          id={inputId}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label={compact ? label : undefined}
          className="w-full cursor-pointer border-0 bg-transparent p-0 text-[15px] text-slate-900 outline-none placeholder:text-slate-500"
        />
        {hasValue && (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Clear ${label}`}
            className="flex h-6.5 w-6.5 shrink-0 cursor-pointer items-center justify-center rounded-[999px] bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 4l8 8" />
              <path d="M12 4 4 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function TopNav({ setPage }: { setPage: (page: Page) => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = [
    { label: "Find a Doctor", action: () => setPage("home") },
    { label: "Find a Location", action: () => setPage("home") },
    { label: "Patient Resources", action: () => setPage("home") },
    { label: "About Us", action: () => setPage("home") },
  ];

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <button onClick={() => setPage("home")} className="flex cursor-pointer items-center gap-3 text-left transition duration-150 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-sky-700 text-white shadow-sm"><HeartPulseIcon className="h-5 w-5" /></div>
            <div>
              <div className="text-xl font-semibold tracking-tight text-slate-900">Acme Healthcare</div>
              <div className="text-xs text-slate-500">Find doctors, locations, and care guidance</div>
            </div>
          </button>
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 lg:flex">
            {navItems.map((item) => (
              <button key={item.label} onClick={item.action} className="rounded-[10px] cursor-pointer transition duration-150 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                {item.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileMenuOpen} className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-[18px] border border-slate-200 bg-white text-slate-700 transition duration-150 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 lg:hidden">
            {mobileMenuOpen ? (
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 5l10 10" />
                <path d="M15 5 5 15" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M3 6h14" />
                <path d="M3 10h14" />
                <path d="M3 14h14" />
              </svg>
            )}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-3 shadow-lg lg:hidden">
            <div className="space-y-1">
              {navItems.map((item) => (
                <button key={item.label} type="button" onClick={() => { setMobileMenuOpen(false); item.action(); }} className="flex w-full cursor-pointer items-center justify-between rounded-[18px] px-4 py-3 text-left text-sm font-medium text-slate-700 transition duration-150 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                  <span>{item.label}</span>
                  <ArrowRightIcon className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProviderSearchGroup({
  compact = false,
  query,
  setQuery,
  location,
  setLocation,
  onSubmit,
  clearOnAutosuggest = false,
}: {
  compact?: boolean;
  query: string;
  setQuery: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  onSubmit: (payload: { query: string; location: string; useNearby: boolean; clearQuery?: boolean; clearLocation?: boolean }) => void;
  clearOnAutosuggest?: boolean;
}) {
  const [showLocationOverride, setShowLocationOverride] = useState(false);
  const [useNearbyLocation, setUseNearbyLocation] = useState(true);
  const [activeField, setActiveField] = useState<"query" | "location" | null>(null);
  const [providerError, setProviderError] = useState("");
  const providerLocationInputRef = useRef<HTMLInputElement | null>(null);
  const providerQueryId = useId();

  useEffect(() => {
    if (showLocationOverride && activeField === "location") providerLocationInputRef.current?.focus();
  }, [showLocationOverride, activeField]);

  const normalizedQuery = query.trim().toLowerCase();
  const normalizedLocation = location.trim().toLowerCase();
  const filteredTerms = providerDemoTerms.filter((item) => item.toLowerCase().includes(normalizedQuery));
  const filteredLocations = providerDemoLocations.filter((item) => item.toLowerCase().includes(normalizedLocation));
  const showProviderQuerySuggestions = activeField === "query" && normalizedQuery.length > 0 && filteredTerms.length > 0;
  const showProviderLocationSuggestions = showLocationOverride && activeField === "location" && normalizedLocation.length > 0 && filteredLocations.length > 0;
  const providerLocationInfo = resolveProviderLocationState(useNearbyLocation, location);

  const submitProvider = (override?: { query?: string; location?: string; useNearby?: boolean; clearQuery?: boolean; clearLocation?: boolean }) => {
    const nextQuery = (override?.query ?? query).trim();
    const nextLocation = (override?.location ?? location).trim();
    const resolvedLocation = resolveProviderLocationState(override?.useNearby ?? useNearbyLocation, nextLocation);

    if (!nextQuery.length) {
      setProviderError("Add what care you need before searching.");
      setActiveField("query");
      return;
    }

    setProviderError("");
    setUseNearbyLocation(resolvedLocation.usesNearby);
    setActiveField(null);
    onSubmit({
      query: nextQuery,
      location: resolvedLocation.submittedLocation,
      useNearby: resolvedLocation.usesNearby,
      clearQuery: override?.clearQuery,
      clearLocation: override?.clearLocation,
    });
  };

  return (
    <div>
      <div className={cn("grid gap-3 md:items-end", showLocationOverride ? (compact ? "md:grid-cols-[minmax(0,1fr)_minmax(220px,0.78fr)_120px]" : "md:grid-cols-[minmax(0,1fr)_minmax(220px,0.78fr)_132px]") : compact ? "md:grid-cols-[minmax(0,1fr)_120px]" : "md:grid-cols-[minmax(0,1fr)_132px]")}>
        <div className="relative">
          <div className={cn("rounded-[14px] border bg-white transition focus-within:border-slate-900 focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.18)]", compact ? "border-slate-200 px-4 py-2.5" : cn("border-slate-200 px-4 py-3", activeField === "query" && "border-slate-900 shadow-[0_0_0_3px_rgba(15,23,42,0.05)]"))}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <label htmlFor={providerQueryId} className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Providers</label>
              <div className="flex items-center gap-2 text-[11px] font-medium">
                <span className={cn("truncate transition-colors", showLocationOverride ? "text-slate-400" : "text-slate-500")}>{showLocationOverride ? "Near you" : providerLocationInfo.displayLabel}</span>
                {!showLocationOverride && (
                  <button type="button" onClick={() => setShowLocationOverride(true)} className="shrink-0 cursor-pointer text-sky-700 transition hover:text-sky-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                    Change location
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SearchIcon className="h-4 w-4 text-slate-400" />
              <input
                id={providerQueryId}
                value={query}
                onChange={(e) => { setQuery(e.target.value); if (providerError) setProviderError(""); }}
                onFocus={() => setActiveField("query")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitProvider();
                  }
                }}
                aria-describedby={providerError ? `${providerQueryId}-error` : undefined}
                placeholder={getSearchPlaceholder("providers")}
                className="w-full cursor-pointer border-0 bg-transparent p-0 text-[15px] text-slate-900 outline-none placeholder:text-slate-500"
              />
              {query.trim().length > 0 && (
                <button type="button" onClick={() => { setQuery(""); setActiveField("query"); }} aria-label="Clear providers search" className="flex h-6.5 w-6.5 shrink-0 cursor-pointer items-center justify-center rounded-[999px] bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M4 4l8 8" />
                    <path d="M12 4 4 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {showProviderQuerySuggestions && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-xl">
              <div className="p-1.5">
                {filteredTerms.slice(0, 6).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setQuery(item);
                      if (showLocationOverride && !location.trim()) {
                        setActiveField("location");
                        return;
                      }
                      setProviderError("");
                      submitProvider({ query: item, ...(clearOnAutosuggest ? { clearQuery: true, clearLocation: true } : {}) });
                    }}
                    className="flex w-full cursor-pointer items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    <span className="inline-flex items-center gap-2"><SearchIcon className="h-4 w-4 text-slate-400" />{item}</span>
                    <span className="text-xs text-slate-400">Specialty</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {showLocationOverride && (
          <div className="relative">
            <div className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 transition focus-within:border-slate-900 focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.18)]">
              <div className="mb-1 flex items-center justify-between gap-3">
                <label htmlFor={`${providerQueryId}-location`} className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Location override</label>
                <button type="button" onClick={() => { setShowLocationOverride(false); if (!location.trim()) setUseNearbyLocation(true); setActiveField((current) => (current === "location" ? null : current)); }} className="shrink-0 cursor-pointer text-[11px] font-medium text-sky-700 transition hover:text-sky-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                  Hide location
                </button>
              </div>
              <div className="flex items-center gap-3">
                <MapPinIcon className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  ref={providerLocationInputRef}
                  id={`${providerQueryId}-location`}
                  value={location}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setLocation(nextValue);
                    setUseNearbyLocation(nextValue.trim().length === 0);
                  }}
                  onFocus={() => setActiveField("location")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitProvider({ ...(clearOnAutosuggest ? { clearQuery: true, clearLocation: true } : {}) });
                    }
                  }}
                  placeholder="ZIP or city"
                  aria-label="Location override"
                  className="w-full cursor-pointer border-0 bg-transparent p-0 text-[15px] text-slate-900 outline-none placeholder:text-slate-500"
                />
                {location.trim().length > 0 && (
                  <button type="button" onClick={() => { setLocation(""); setUseNearbyLocation(true); setActiveField("location"); }} aria-label="Clear location override" className="flex h-6.5 w-6.5 shrink-0 cursor-pointer items-center justify-center rounded-[999px] bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M4 4l8 8" />
                      <path d="M12 4 4 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {showProviderLocationSuggestions && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-xl">
                <div className="p-1.5">
                  {filteredLocations.slice(0, 6).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setLocation(item);
                        setUseNearbyLocation(false);
                        setActiveField(null);
                        setProviderError("");
                        if (query.trim()) submitProvider({ query: query.trim(), location: item, useNearby: false, ...(clearOnAutosuggest ? { clearQuery: true, clearLocation: true } : {}) });
                      }}
                      className="flex w-full cursor-pointer items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    >
                      <span className="inline-flex items-center gap-2"><MapPinIcon className="h-4 w-4 text-slate-400" />{item}</span>
                      <span className="text-xs text-slate-400">Location</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Button onClick={() => submitProvider()} disabled={!normalizedQuery.length} className={cn(compact ? "h-[54px] w-full px-4 text-[15px] md:min-w-[120px]" : "h-[58px] w-full px-5 text-[15px] md:min-w-[132px]")}>
          Search
        </Button>
      </div>
      {providerError && <div id={`${providerQueryId}-error`} role="alert" className="mt-2 text-sm text-rose-700">{providerError}</div>}
    </div>
  );
}

function HomeHero({ searchType, setSearchType, onSearch }: { searchType: SearchType; setSearchType: (searchType: SearchType) => void; onSearch: (submission: SearchSubmission) => void }) {
  const mode = getModeFromSearchType(searchType);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [activeField, setActiveField] = useState<"query" | null>(null);
  const contentSuggestions = getContentSuggestions(searchType);
  const filteredContentSuggestions = contentSuggestions.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));
  const showContentSuggestions = mode === "content" && activeField === "query" && query.trim().length > 0 && filteredContentSuggestions.length > 0;
  const sampleContentSearches = popularContentSearchesByType[searchType === "providers" ? "all" : searchType];
  const isCareGuidance = searchType === "services";

  return (
    <main id="main-content" className="relative z-20 overflow-visible bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.35),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.24),transparent_28%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.36),rgba(15,23,42,0.68))]" />
      <div className="relative mx-auto max-w-7xl overflow-visible px-6 py-8 md:py-10">
        <div className="mx-auto max-w-[72rem] overflow-visible">
          <div className="mb-4 mx-auto max-w-2xl text-center">
            <h1 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-5xl">Find care faster.</h1>
            <p className="mx-auto mt-3 max-w-[32rem] text-sm leading-6 text-slate-200 md:text-base">Search across providers, locations, services, and trusted site content.</p>
          </div>
          <div className="mx-auto max-w-[72rem] px-6">
            <div className="overflow-visible rounded-[18px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,251,255,0.96))] shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
              <div className="border-b border-slate-200/80 px-5 pt-4">
                <div className="mb-3"><SearchTypeTabs searchType={searchType} setSearchType={setSearchType} /></div>
              </div>
              {mode === "providers" ? (
                <div className="bg-white/35 p-4 md:p-5">
                  <ProviderSearchGroup query={query} setQuery={setQuery} location={location} setLocation={setLocation} onSubmit={({ query: nextQuery, location: nextLocation, useNearby }) => onSearch({ query: nextQuery, location: nextLocation, mode: "providers", searchType: "providers", useNearby })} />
                  <div className="mt-2 pt-1">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Popular searches</div>
                    <div className="mb-3 h-px w-12 bg-gradient-to-r from-slate-200 via-slate-300 to-transparent" aria-hidden="true" />
                    <div className="flex flex-wrap gap-2">
                      {popularProviderSearches.map((item) => (
                        <button key={item.label} type="button" onClick={() => { setQuery(item.query); setLocation(""); onSearch({ query: item.query, location: "Near you", mode: "providers", searchType: "providers", useNearby: true }); }} className="cursor-pointer rounded-[999px] border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition duration-150 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/35 p-4 md:p-5">
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_132px] sm:items-end">
                    <div className="relative">
                      <SearchInput
                        icon={SearchIcon}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setActiveField("query")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (query.trim()) onSearch({ query: query.trim(), mode: "content", searchType });
                          }
                        }}
                        onClear={() => { setQuery(""); setActiveField("query"); }}
                        placeholder={getSearchPlaceholder(searchType)}
                        label={getSearchTypeLabel(searchType)}
                      />
                      {showContentSuggestions && (
                        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-xl">
                          <div className="p-1.5">
                            {filteredContentSuggestions.slice(0, 6).map((item) => (
                              <button key={item.label} type="button" onClick={() => { setQuery(item.label); setActiveField(null); onSearch({ query: item.label, mode: "content", searchType }); }} className="flex w-full cursor-pointer items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                                <span className="inline-flex items-center gap-2"><SearchIcon className="h-4 w-4 text-slate-400" />{item.label}</span>
                                <span className="text-xs text-slate-400">{item.type}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button onClick={() => query.trim() && onSearch({ query: query.trim(), mode: "content", searchType })} disabled={!query.trim().length} className="h-[58px] w-full px-5 text-[15px] sm:min-w-[132px]">
                      Search
                    </Button>
                  </div>
                  <div className="mt-2 pt-1">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{isCareGuidance ? "Popular questions" : "Popular searches"}</div>
                    <div className="mb-3 h-px w-12 bg-gradient-to-r from-slate-200 via-slate-300 to-transparent" aria-hidden="true" />
                    <div className="flex flex-wrap gap-2">
                      {sampleContentSearches.map((item) => (
                        <button key={item} type="button" onClick={() => { setQuery(item); setActiveField(null); onSearch({ query: item, mode: "content", searchType }); }} className="cursor-pointer rounded-[999px] border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition duration-150 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-slate-300/90">For life-threatening emergencies, call 911.</p>
        </div>
      </div>
    </main>
  );
}

function FilterRail({ mode, selectedFilters, onToggleFilter, onReset, mobile = false, onClose }: { mode: Mode; selectedFilters: FilterSelectionState; onToggleFilter: (groupTitle: string, item: string) => void; onReset: () => void; mobile?: boolean; onClose?: () => void }) {
  const initialOpenState = useMemo(() => ({ ...(mode === "providers" ? { Distance: true, Access: true, Gender: true, Insurance: true, Languages: true } : { "Content Type": true, Audience: true, Topic: true, "Care Area": true, Format: true }) }), [mode]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialOpenState);

  useEffect(() => {
    setOpenGroups(initialOpenState);
  }, [initialOpenState]);

  const groups = mode === "providers" ? providerFilterGroups : contentFilterGroups;

  const groupsMarkup = (
    <div className="space-y-4 pb-6">
      {groups.map((group) => {
        const isOpen = openGroups[group.title];
        return (
          <div key={group.title} className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-4 transition duration-150 hover:border-slate-300 hover:bg-slate-50">
            <button type="button" onClick={() => setOpenGroups((current) => ({ ...current, [group.title]: !current[group.title] }))} aria-expanded={isOpen} aria-controls={`filter-group-${group.title}`} className="flex w-full cursor-pointer items-center justify-between rounded-[14px] text-left transition duration-150 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
              <div className="font-medium text-slate-900">{group.title}</div>
              <ChevronDownIcon className={cn("h-4 w-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <div id={`filter-group-${group.title}`} className="mt-3 space-y-2">
                {group.items.map((item) => {
                  const isSelected = (selectedFilters[group.title] || []).includes(item);
                  return (
                    <button key={item} type="button" role="checkbox" aria-checked={isSelected} onClick={() => onToggleFilter(group.title, item)} className="flex w-full cursor-pointer items-center gap-3 rounded-[12px] px-1 py-1 text-left text-sm text-slate-600 transition duration-150 hover:bg-slate-100/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                      <span className={cn("flex h-5 w-5 items-center justify-center rounded-[10px] border bg-white transition", isSelected ? "border-slate-900" : "border-slate-300")}>
                        {isSelected && (
                          <svg viewBox="0 0 16 16" className="h-4 w-4 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                          </svg>
                        )}
                      </span>
                      <span className={cn(isSelected && "text-slate-900")}>{item}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  if (mobile) {
    return (
      <Card className="h-full rounded-none border-0 shadow-none">
        <div className="flex h-full min-h-0 flex-col bg-white">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-5 backdrop-blur">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-slate-100 text-slate-700"><SlidersIcon className="h-5 w-5" /></div><div className="text-xl font-semibold tracking-tight text-slate-900">Filters</div></div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onReset} disabled={getSelectedFilterCount(selectedFilters) === 0} className={cn("rounded-[999px] border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40", getSelectedFilterCount(selectedFilters) === 0 ? "border-slate-200 text-slate-400" : "cursor-pointer border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900")}>
                Reset
              </button>
              <button type="button" onClick={onClose} aria-label="Close filters" className="inline-flex h-10 w-10 items-center justify-center rounded-[999px] border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M5 5l10 10" />
                  <path d="M15 5 5 15" />
                </svg>
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-5">{groupsMarkup}</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-h-[calc(100vh-112px)] overflow-hidden">
      <div className="flex max-h-[calc(100vh-112px)] flex-col bg-white">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-5 backdrop-blur">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-slate-100 text-slate-700"><SlidersIcon className="h-5 w-5" /></div><div className="text-xl font-semibold tracking-tight text-slate-900">Filters</div></div>
          <button type="button" onClick={onReset} disabled={getSelectedFilterCount(selectedFilters) === 0} className={cn("rounded-[999px] border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40", getSelectedFilterCount(selectedFilters) === 0 ? "border-slate-200 text-slate-400" : "cursor-pointer border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900")}>
            Reset
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-0 pt-5">{groupsMarkup}</div>
        <div className="pointer-events-none border-t border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.96)_42%,#ffffff_100%)] px-5 pb-5 pt-4">
          <div className="h-3 w-full rounded-full bg-slate-100/80" />
        </div>
      </div>
    </Card>
  );
}

function ProviderVisual({ name, compact = false }: { name: string; compact?: boolean }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("");
  return (
    <div className={cn("flex h-full items-center justify-center bg-gradient-to-br from-sky-100 via-white to-emerald-100 px-6 text-slate-700", compact ? "min-h-0" : "min-h-[280px]")}>
      <div className="flex h-full w-full flex-col items-center justify-center text-center">
        <div className={cn("mx-auto flex items-center justify-center rounded-[999px] border border-white/70 bg-white/85 font-semibold shadow-sm", compact ? "h-20 w-20 text-2xl" : "h-24 w-24 text-3xl")}>{initials}</div>
        <div className={cn("font-medium uppercase tracking-[0.2em] text-slate-500", compact ? "mt-3 text-xs" : "mt-4 text-sm")}>Provider profile</div>
      </div>
    </div>
  );
}

function ProviderListCard({ item }: { item: Provider }) {
  return (
    <Card className="cursor-pointer overflow-hidden border-slate-200/90 bg-white/98 transition duration-200 hover:-translate-y-[2px] hover:shadow-xl">
      <div className="grid lg:grid-cols-[220px_1fr]">
        <div className="relative h-56 lg:h-full">
          <ProviderVisual name={item.name} />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">{item.accepting && <Badge tone="success">Accepting new patients</Badge>}{item.telehealth && <Badge tone="info">Telehealth</Badge>}</div>
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><Badge tone="secondary">{item.specialty}</Badge><Badge tone="outline">{item.distance}</Badge><Badge tone="outline">{item.gender}</Badge></div>
              <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{item.name}</div>
              <div className="mt-2 text-sm text-slate-500">{item.hospital}</div>
              <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                <div className="flex items-center gap-2"><LanguagesIcon className="h-4 w-4 text-slate-400" />{item.languages.join(", ")}</div>
                <div className="flex items-center gap-2"><ShieldIcon className="h-4 w-4 text-slate-400" />{item.insurance.slice(0, 2).join(", ")}</div>
                <div className="flex items-center gap-2"><StarIcon className="h-4 w-4 text-amber-400" />{item.rating} ({item.reviews} reviews)</div>
                <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-blue-600" />{item.nextAvailable}</div>
              </div>
            </div>
            <div className="xl:w-[220px] xl:shrink-0">
              <div className="rounded-[18px] bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Next available</div>
                <div className="mt-1 font-semibold text-slate-900">{item.nextAvailable}</div>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <div>{item.experience} years experience</div>
                  <div>{item.phone}</div>
                </div>
                <div className="mt-5 flex flex-col gap-3"><Button variant="outline">View profile</Button><Button>Book visit</Button></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ProviderGridCard({ item }: { item: Provider }) {
  return (
    <Card className="cursor-pointer overflow-hidden border-slate-200/90 bg-white/98 transition duration-200 hover:-translate-y-[2px] hover:shadow-xl">
      <div className="p-4 pb-0"><div className="mb-3 flex flex-wrap gap-2">{item.accepting && <Badge tone="success">Accepting</Badge>}{item.telehealth && <Badge tone="info">Telehealth</Badge>}</div></div>
      <div className="px-4"><div className="overflow-hidden rounded-[18px]"><div className="h-48"><ProviderVisual name={item.name} compact /></div></div></div>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2"><Badge tone="secondary">{item.specialty}</Badge><Badge tone="outline">{item.distance}</Badge></div>
        <div className="mt-3 break-words whitespace-normal text-xl font-semibold leading-tight tracking-tight text-slate-900">{item.name}</div>
        <div className="mt-1 text-sm text-slate-500">{item.hospital}</div>
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2"><StarIcon className="h-4 w-4 shrink-0 text-amber-400" /><span>{item.rating} ({item.reviews} reviews)</span></div>
          <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 shrink-0 text-blue-600" /><span>{item.nextAvailable}</span></div>
          <div className="flex items-center gap-2"><ShieldIcon className="h-4 w-4 shrink-0 text-slate-400" /><span>{item.insurance[0]}</span></div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3"><Button variant="outline" className="w-full">Profile</Button><Button className="w-full">Availability</Button></div>
      </div>
    </Card>
  );
}

function ProviderCard({ item, view }: { item: Provider; view: ViewMode }) {
  return view === "grid" ? <ProviderGridCard item={item} /> : <ProviderListCard item={item} />;
}

function LocationMapPlaceholder({ label }: { label?: string }) {
  return (
    <div className="relative h-full min-h-[180px] overflow-hidden rounded-[18px] border border-sky-100/80 bg-[linear-gradient(180deg,#eef5ff_0%,#f8fbff_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(180deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:30px_30px] opacity-70" />
      <div className="absolute left-[14%] top-[18%] h-24 w-24 rounded-full border border-sky-200/70" />
      <div className="absolute right-[16%] top-[24%] h-16 w-16 rounded-full border border-sky-100/90" />
      <div className="absolute left-[30%] top-[52%] h-20 w-20 rounded-full border border-sky-100/80" />
      <div className="absolute left-[12%] top-[56%] h-[2px] w-[38%] rotate-[18deg] bg-slate-300/70" />
      <div className="absolute right-[10%] top-[36%] h-[2px] w-[34%] -rotate-[22deg] bg-slate-300/65" />
      <div className="absolute left-[44%] top-[30%] h-[34%] w-[2px] bg-slate-300/60" />
      <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-white/92 shadow-lg shadow-sky-100/70">
          <MapPinIcon className="h-6 w-6 text-sky-700" />
        </div>
      </div>
      {label && <div className="absolute bottom-4 left-4"><Badge tone="outline" className="border-white/80 bg-white/90 text-slate-700 shadow-sm">{label}</Badge></div>}
    </div>
  );
}

function ContentListCard({ item }: { item: ContentResult }) {
  return (
    <Card className="cursor-pointer rounded-[18px] border-slate-200/90 bg-white/98 transition duration-200 hover:-translate-y-[2px] hover:shadow-lg">
      <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge tone="secondary" className="mb-3">{item.type}</Badge>
          <div className="text-xl font-semibold text-slate-900">{item.title}</div>
          <div className="mt-2 max-w-2xl text-slate-600">{item.summary}</div>
        </div>
        <Button variant="outline">{item.cta}<ArrowRightIcon className="h-4 w-4" /></Button>
      </div>
    </Card>
  );
}

function LocationListCard({ item }: { item: ContentResult }) {
  return (
    <Card className="cursor-pointer overflow-hidden border-slate-200/90 bg-white/98 transition duration-200 hover:-translate-y-[2px] hover:shadow-xl">
      <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
        <div className="p-4 lg:p-5"><LocationMapPlaceholder label={item.areaLabel} /></div>
        <div className="p-6 lg:pl-1">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <Badge tone="secondary" className="mb-3">Location</Badge>
              <div className="text-2xl font-semibold tracking-tight text-slate-900">{item.title}</div>
              {item.address && <div className="mt-3 flex items-start gap-2 text-sm text-slate-600"><MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span>{item.address}</span></div>}
              {item.meta && item.meta.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{item.meta.map((entry) => <Badge key={entry} tone="outline">{entry}</Badge>)}</div>}
              <div className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">{item.summary}</div>
            </div>
            <div className="xl:w-[220px] xl:shrink-0">
              <div className="rounded-[18px] bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Visit details</div>
                <div className="mt-2 space-y-2 text-sm text-slate-600">
                  <div>Directions, parking, and arrival guidance</div>
                  <div>Services and department contact info</div>
                </div>
                <div className="mt-5 flex flex-col gap-3"><Button variant="outline">{item.cta}</Button><Button>Get directions</Button></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ContentGridCard({ item }: { item: ContentResult }) {
  return (
    <Card className="h-full cursor-pointer rounded-[18px] border-slate-200/90 bg-white/98 transition duration-200 hover:-translate-y-[2px] hover:shadow-lg">
      <div className="flex h-full flex-col p-5">
        <Badge tone="secondary" className="mb-3">{item.type}</Badge>
        <div className="text-lg font-semibold text-slate-900">{item.title}</div>
        <div className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</div>
        <div className="mt-auto pt-5"><Button variant="outline" className="w-full">{item.cta}<ArrowRightIcon className="h-4 w-4" /></Button></div>
      </div>
    </Card>
  );
}

function LocationGridCard({ item }: { item: ContentResult }) {
  return (
    <Card className="h-full cursor-pointer overflow-hidden rounded-[18px] border-slate-200/90 bg-white/98 transition duration-200 hover:-translate-y-[2px] hover:shadow-xl">
      <div className="p-4 pb-0"><LocationMapPlaceholder label={item.areaLabel} /></div>
      <div className="flex h-full flex-col p-5">
        <Badge tone="secondary" className="mb-3">Location</Badge>
        <div className="text-lg font-semibold text-slate-900">{item.title}</div>
        {item.address && <div className="mt-3 flex items-start gap-2 text-sm text-slate-600"><MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span>{item.address}</span></div>}
        {item.meta && item.meta.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{item.meta.map((entry) => <Badge key={entry} tone="outline">{entry}</Badge>)}</div>}
        <div className="mt-4 text-sm leading-6 text-slate-600">{item.summary}</div>
        <div className="mt-auto grid grid-cols-2 gap-3 pt-5"><Button variant="outline" className="w-full">{item.cta}</Button><Button className="w-full">Directions</Button></div>
      </div>
    </Card>
  );
}

function ContentResults({ view, items }: { view: ViewMode; items: ContentResult[] }) {
  if (view === "grid") {
    return <div className="grid gap-5 xl:grid-cols-3 xl:items-stretch">{items.map((item) => (item.type === "Location" ? <LocationGridCard key={item.id} item={item} /> : <ContentGridCard key={item.id} item={item} />))}</div>;
  }
  return <div className="space-y-4">{items.map((item) => (item.type === "Location" ? <LocationListCard key={item.id} item={item} /> : <ContentListCard key={item.id} item={item} />))}</div>;
}

function ResultsToolbar({
  countText,
  queryText,
  locationText,
  view,
  setView,
  sortBy,
  setSortBy,
  sortOptions,
  suppressQueryContext = false,
}: {
  countText: string;
  queryText: string;
  locationText?: string;
  view: ViewMode;
  setView: (view: ViewMode) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOptions: Array<{ value: string; label: string }>;
  suppressQueryContext?: boolean;
}) {
  const [sortKeyboardFocus, setSortKeyboardFocus] = useState(false);

  const summaryClass = suppressQueryContext ? "truncate whitespace-nowrap" : "break-words whitespace-normal leading-6";
  const summaryWrapperClass = suppressQueryContext ? "min-w-0 flex-1 overflow-hidden text-sm font-medium text-slate-600 xl:pr-6" : "min-w-0 flex-1 text-sm font-medium text-slate-600 xl:pr-6";

  return (
    <div className="rounded-[18px] border border-slate-200/90 bg-white/96 px-5 py-4 shadow-sm shadow-slate-900/5 transition duration-150 hover:shadow-md">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className={summaryWrapperClass}>
          <div className={summaryClass}>
            {suppressQueryContext ? (
              <>
                Showing <span className="font-semibold text-slate-900">{countText}</span> supporting results
              </>
            ) : (
              <>
                Showing <span className="font-semibold text-slate-900">{countText}</span> results for <span className="font-semibold text-slate-900">&quot;{queryText}&quot;</span>
                {locationText ? (
                  <>
                    {" "}in <span className="font-semibold text-slate-900">&quot;{locationText}&quot;</span>
                  </>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:ml-auto xl:w-auto xl:justify-end">
          <div className="inline-flex w-fit self-start rounded-[999px] border border-slate-200 bg-slate-50/90 p-1 shadow-inner shadow-slate-900/5 sm:self-auto">
            <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")} className={cn("inline-flex cursor-pointer items-center gap-2 rounded-[999px] px-3 py-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2", view === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 5.5h12" /><path d="M4 10h12" /><path d="M4 14.5h12" /></svg>
              <span>List</span>
            </button>
            <button type="button" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={cn("inline-flex cursor-pointer items-center gap-2 rounded-[999px] px-3 py-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2", view === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="5" height="5" rx="1" /><rect x="12" y="3" width="5" height="5" rx="1" /><rect x="3" y="12" width="5" height="5" rx="1" /><rect x="12" y="12" width="5" height="5" rx="1" /></svg>
              <span>Grid</span>
            </button>
          </div>

          <div className="flex w-full items-center gap-3 sm:ml-auto sm:w-auto xl:justify-end">
            <label className="whitespace-nowrap text-sm font-medium text-slate-600">Sort by</label>
            <div className="relative min-w-0 flex-1 sm:min-w-[190px] sm:flex-none">
              <select
                value={sortBy}
                onPointerDown={() => setSortKeyboardFocus(false)}
                onKeyDown={(e) => {
                  if (e.key === "Tab" || e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") setSortKeyboardFocus(true);
                }}
                onBlur={() => setSortKeyboardFocus(false)}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  if (!sortKeyboardFocus) e.currentTarget.blur();
                }}
                aria-label="Sort results"
                className={cn("w-full appearance-none rounded-[14px] border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 outline-none transition duration-150 cursor-pointer hover:border-slate-300 hover:bg-slate-50 focus:border-slate-200 focus:ring-0", sortKeyboardFocus && "border-slate-500 ring-2 ring-blue-600 ring-offset-2")}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SmartAnswerCard({ answer }: { answer: SmartAnswerDemo }) {
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const [visibleSourceCount, setVisibleSourceCount] = useState(0);
  const words = useMemo(() => answer.summary.split(" "), [answer.summary]);

  useEffect(() => {
    setVisibleWordCount(0);
    setVisibleSourceCount(0);

    const timers: number[] = [];
    let nextCount = 0;
    let tick = 0;

    while (nextCount < words.length) {
      const batchSize = Math.min(words.length - nextCount, [2, 3, 4][tick % 3] + (tick % 2));
      nextCount += batchSize;
      timers.push(window.setTimeout(() => setVisibleWordCount(nextCount), 280 + tick * 140 + (tick % 2 === 0 ? 0 : 45)));
      tick += 1;
    }

    answer.sources.forEach((_, index) => {
      timers.push(window.setTimeout(() => setVisibleSourceCount(index + 1), 260 + index * 180));
    });

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [answer, words]);

  const revealedSummary = words.slice(0, visibleWordCount).join(" ");

  return (
    <Card className="overflow-hidden border-sky-100/90 bg-[linear-gradient(180deg,rgba(239,246,255,0.92),rgba(255,255,255,0.98))] shadow-lg shadow-sky-100/40">
      <div className="relative p-6 md:p-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_24%)]" />
        <div className="relative">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-slate-700">
              <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-white/90 shadow-sm ring-1 ring-sky-100">
                <SearchIcon className="h-4.5 w-4.5 text-sky-700" />
              </div>
              <div className="text-sm font-semibold tracking-tight text-slate-900">Smart Answers</div>
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Care guidance</span>
            </div>
            <span className="inline-flex items-center gap-2 rounded-[999px] border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Source-grounded
            </span>
          </div>
          <div className="text-2xl font-semibold tracking-tight text-slate-900">{answer.question}</div>
          <div className="mt-4 text-[15px] leading-7 text-slate-700">
            {revealedSummary}
            {visibleWordCount < words.length && <span className="ml-1 inline-block h-5 w-[2px] animate-pulse bg-sky-700 align-[-2px]" />}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {answer.sources.slice(0, visibleSourceCount).map((source) => (
              <a
                key={source}
                href="#"
                title={source}
                onClick={(e) => e.preventDefault()}
                className="inline-flex max-w-[210px] cursor-pointer items-center gap-2 rounded-[999px] border border-slate-200 bg-white/92 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition duration-150 hover:-translate-y-[1px] hover:border-sky-200 hover:bg-sky-50/90 hover:text-sky-800 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <LinkIcon className="h-3.5 w-3.5 shrink-0 text-slate-400 transition duration-150 group-hover:text-sky-600" />
                <span className="truncate">{source}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function PaginationBar() {
  return (
    <nav aria-label="Pagination" className="rounded-[18px] border border-slate-200 bg-white px-5 py-4 shadow-sm transition duration-150 hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">Page <span className="font-semibold text-slate-900">1</span> of <span className="font-semibold text-slate-900">2</span></div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled className="inline-flex items-center rounded-[999px] border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed">Previous</button>
          <button type="button" aria-current="page" className="inline-flex h-10 min-w-10 items-center justify-center rounded-[999px] bg-slate-900 px-4 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">1</button>
          <button type="button" className="inline-flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-[999px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition duration-150 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">2</button>
          <button type="button" className="inline-flex items-center rounded-[999px] border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition duration-150 cursor-pointer hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Next</button>
        </div>
      </div>
    </nav>
  );
}

function ResultsFollowupBar({ searchType, setSearchType, query, setQuery, location, setLocation, onSearch }: { searchType: SearchType; setSearchType: (searchType: SearchType) => void; query: string; setQuery: (value: string) => void; location: string; setLocation: (value: string) => void; onSearch: (overrides?: { query?: string; location?: string; useNearby?: boolean; clearQuery?: boolean; clearLocation?: boolean }) => void }) {
  const mode = getModeFromSearchType(searchType);
  const [activeField, setActiveField] = useState<"query" | null>(null);
  const contentSuggestions = getContentSuggestions(searchType);
  const filteredContentSuggestions = contentSuggestions.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));
  const showContentSuggestions = mode === "content" && activeField === "query" && query.trim().length > 0 && filteredContentSuggestions.length > 0;

  return (
    <div className="rounded-[22px] border border-slate-200/90 bg-white/96 p-3 shadow-sm shadow-slate-900/5 backdrop-blur">
      <div className="mb-3"><SearchTypeTabs searchType={searchType} setSearchType={setSearchType} compact /></div>
      {mode === "providers" ? (
        <ProviderSearchGroup compact query={query} setQuery={setQuery} location={location} setLocation={setLocation} clearOnAutosuggest onSubmit={({ query: nextQuery, location: nextLocation, useNearby, clearQuery, clearLocation }) => onSearch({ query: nextQuery, location: nextLocation, useNearby, clearQuery, clearLocation })} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px] sm:items-center">
          <div className="relative">
            <SearchInput icon={SearchIcon} value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setActiveField("query")} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (query.trim()) onSearch(); } }} onClear={() => { setQuery(""); setActiveField("query"); }} placeholder={getSearchPlaceholder(searchType)} label={getSearchTypeLabel(searchType)} compact />
            {showContentSuggestions && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-xl">
                <div className="p-1.5">
                  {filteredContentSuggestions.slice(0, 6).map((item) => (
                    <button key={item.label} type="button" onClick={() => { setQuery(item.label); setActiveField(null); onSearch({ query: item.label, clearQuery: true }); }} className="flex w-full cursor-pointer items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                      <span className="inline-flex items-center gap-2"><SearchIcon className="h-4 w-4 text-slate-400" />{item.label}</span>
                      <span className="text-xs text-slate-400">{item.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button onClick={() => query.trim() && onSearch()} disabled={!query.trim().length} className="h-[54px] w-full px-4 text-[15px] sm:min-w-[120px]">Search</Button>
        </div>
      )}
    </div>
  );
}

function SiteFooter() {
  const footerLinks = ["Find a Doctor", "Locations", "Patient Resources", "About Us"];
  return (
    <footer className="relative z-0 overflow-hidden border-t border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_42%,#020617_100%)] text-slate-200">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-sky-700 text-white shadow-sm"><HeartPulseIcon className="h-5 w-5" /></div><div><div className="text-xl font-semibold tracking-tight text-white">Acme Healthcare</div><div className="text-sm text-slate-400">Find doctors, locations, and care guidance</div></div></div>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">Helping you find doctors, care locations, and trusted guidance with confidence.</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">{footerLinks.map((link) => <a key={link} href="#" className="rounded-[10px] text-sm text-slate-400 transition duration-150 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">{link}</a>)}</div>
        </div>
        <div className="mt-6 border-t border-white/10 pt-4 text-sm text-slate-500">© SearchStax 2014-2026</div>
      </div>
    </footer>
  );
}

function ResultsPage({ mode, setMode, isLoading, initialQuery, initialLocation, initialSearchType }: { mode: Mode; setMode: (mode: Mode) => void; isLoading: boolean; initialQuery: string; initialLocation?: string; initialSearchType: SearchType }) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [providerView, setProviderView] = useState<ViewMode>("list");
  const [contentView, setContentView] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState("best-match");
  const [committedMode, setCommittedMode] = useState<Mode>(mode);
  const [draftSearchType, setDraftSearchType] = useState<SearchType>(initialSearchType);
  const [committedSearchType, setCommittedSearchType] = useState<SearchType>(initialSearchType);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery || (mode === "providers" ? "Nuclear Medicine" : "PET scan preparation"));
  const [committedLocation, setCommittedLocation] = useState(initialLocation || "Near you");
  const [draftQuery, setDraftQuery] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<FilterSelectionState>(createInitialSelections(mode));
  const [filterResetNonce, setFilterResetNonce] = useState(0);

  useEffect(() => {
    const nextMode = getModeFromSearchType(initialSearchType);
    setCommittedMode(nextMode);
    setCommittedSearchType(initialSearchType);
    setDraftSearchType(initialSearchType);
    setSubmittedQuery(initialQuery || (nextMode === "providers" ? "Nuclear Medicine" : "PET scan preparation"));
    setCommittedLocation(initialLocation || "Near you");
    setDraftQuery("");
    setDraftLocation("");
    setSelectedFilters(createInitialSelections(nextMode));
  }, [mode, initialQuery, initialLocation, initialSearchType]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [committedMode, committedSearchType]);

  useEffect(() => {
    setDraftQuery("");
    setDraftLocation("");
  }, [draftSearchType]);

  useEffect(() => {
    setSelectedFilters(createInitialSelections(committedMode));
  }, [committedMode]);

  const selectedFilterCount = getSelectedFilterCount(selectedFilters);

  const handleResetAllFilters = () => {
    setSelectedFilters(clearSelectionsForMode(committedMode));
    setFilterResetNonce((value) => value + 1);
  };

  const handleToggleFilter = (groupTitle: string, item: string) => {
    setSelectedFilters((current) => {
      const values = current[groupTitle] || [];
      const nextValues = values.includes(item) ? values.filter((value) => value !== item) : [...values, item];
      return { ...current, [groupTitle]: nextValues };
    });
  };

  const committedContentResults = filterContentResults(committedSearchType, submittedQuery);
  const shownContentResults = committedContentResults.slice(0, 3);
  const activeSmartAnswer = getSmartAnswerDemo(submittedQuery, committedSearchType);

  const providerSortOptions = [
    { value: "best-match", label: "Best match" },
    { value: "distance", label: "Distance" },
    { value: "rating", label: "Highest rated" },
    { value: "availability", label: "Next available" },
  ];
  const contentSortOptions = [
    { value: "best-match", label: "Best match" },
    { value: "type", label: "Content type" },
    { value: "relevance", label: "Most relevant" },
    { value: "recent", label: "Most recent" },
  ];

  const handleResultsSearch = (overrides?: { query?: string; location?: string; useNearby?: boolean; clearQuery?: boolean; clearLocation?: boolean }) => {
    const nextQuery = (overrides?.query ?? draftQuery).trim();
    const nextLocation = (overrides?.location ?? draftLocation).trim();
    const resolvedLocation = resolveProviderLocationState(overrides?.useNearby ?? true, nextLocation);
    const nextMode = getModeFromSearchType(draftSearchType);

    setIsRefreshing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => {
      setCommittedMode(nextMode);
      setCommittedSearchType(draftSearchType);
      setMode(nextMode);
      if (nextQuery) setSubmittedQuery(nextQuery);
      setCommittedLocation(nextMode === "providers" ? resolvedLocation.submittedLocation : "");
      if (overrides?.clearQuery) setDraftQuery("");
      if (overrides?.clearLocation) setDraftLocation("");
      window.scrollTo({ top: 0, behavior: "auto" });
      window.setTimeout(() => setIsRefreshing(false), 80);
    }, 220);
  };

  return (
    <div className={cn("min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_24%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent_20%),linear-gradient(180deg,#fbfdff_0%,#f6f8fc_52%,#f3f5f9_100%)] transition-opacity duration-500", isLoading || isRefreshing ? "opacity-0" : "opacity-100")}>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="sticky top-[73px] z-30 mb-6">
          <div className="relative grid items-start gap-4 lg:grid-cols-[320px_1fr]">
            <div className="hidden lg:block"><div className="absolute left-0 top-0 w-[320px]"><FilterRail key={`desktop-${committedMode}-${filterResetNonce}`} mode={committedMode} selectedFilters={selectedFilters} onToggleFilter={handleToggleFilter} onReset={handleResetAllFilters} /></div></div>
            <ResultsFollowupBar searchType={draftSearchType} setSearchType={setDraftSearchType} query={draftQuery} setQuery={setDraftQuery} location={draftLocation} setLocation={setDraftLocation} onSearch={handleResultsSearch} />
          </div>
        </div>

        <div className="lg:hidden">
          <button type="button" onClick={() => setMobileFiltersOpen(true)} className="fixed bottom-5 right-5 z-40 inline-flex cursor-pointer items-center gap-2 rounded-[999px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg shadow-slate-900/10 transition duration-150 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
            <SlidersIcon className="h-4 w-4" />
            Filters
            {selectedFilterCount > 0 && <span className="inline-flex min-w-5 items-center justify-center rounded-[999px] bg-slate-900 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white">{selectedFilterCount}</span>}
          </button>
        </div>

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog" aria-label="Filters drawer">
            <button type="button" aria-label="Close filters drawer" onClick={() => setMobileFiltersOpen(false)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]" />
            <div className="absolute inset-y-0 left-0 flex w-full max-w-sm min-h-0 flex-col bg-white shadow-2xl">
              <div className="min-h-0 flex-1 overflow-hidden"><FilterRail key={`mobile-${committedMode}-${filterResetNonce}`} mode={committedMode} selectedFilters={selectedFilters} onToggleFilter={handleToggleFilter} onReset={handleResetAllFilters} mobile onClose={() => setMobileFiltersOpen(false)} /></div>
              <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.96)_34%,#ffffff_100%)] p-4 backdrop-blur"><Button onClick={() => setMobileFiltersOpen(false)} className="w-full">Apply filters</Button></div>
            </div>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
          <div className="hidden lg:block" />
          <div className="space-y-5">
            {committedMode === "providers" ? (
              <ResultsToolbar countText={getResultCountText(committedSearchType, 6, 3)} queryText={submittedQuery} locationText={committedLocation || "Near you"} view={providerView} setView={setProviderView} sortBy={sortBy} setSortBy={setSortBy} sortOptions={providerSortOptions} />
            ) : (
              <>
                {activeSmartAnswer && <SmartAnswerCard answer={activeSmartAnswer} />}
                <ResultsToolbar countText={getResultCountText(committedSearchType, committedContentResults.length || 3, shownContentResults.length || 3)} queryText={submittedQuery} view={contentView} setView={setContentView} sortBy={sortBy} setSortBy={setSortBy} sortOptions={contentSortOptions} suppressQueryContext={Boolean(activeSmartAnswer)} />
              </>
            )}

            {committedMode === "providers" ? (
              <>
                <div className={cn(providerView === "grid" ? "grid gap-5 xl:grid-cols-2" : "space-y-5")}>
                  {providers.map((item) => <ProviderCard key={item.id} item={item} view={providerView} />)}
                </div>
                <PaginationBar />
              </>
            ) : (
              <>
                <ContentResults view={contentView} items={shownContentResults} />
                <PaginationBar />
              </>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

export default function ModernHealthcareSearchPrototype() {
  const [page, setPage] = useState<Page>("home");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>("all");
  const [lastSearch, setLastSearch] = useState<SearchSubmission>({ query: "Nuclear Medicine", location: "Near you", mode: "providers", searchType: "providers", useNearby: true });

  const handleSearch = (submission: SearchSubmission) => {
    const nextSearchType = submission.searchType || searchType;
    setSearchType(nextSearchType);
    setLastSearch(submission);
    setIsSubmitting(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => {
      setPage("results");
      window.scrollTo({ top: 0, behavior: "auto" });
      window.setTimeout(() => setIsSubmitting(false), 60);
    }, 220);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[14px] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900">Skip to main content</a>
      <TopNav setPage={setPage} />
      <div className={cn("transition-opacity duration-300", isSubmitting ? "opacity-0" : "opacity-100")}>
        {page === "home" ? (
          <>
            <HomeHero searchType={searchType} setSearchType={setSearchType} onSearch={handleSearch} />
            <SiteFooter />
          </>
        ) : (
          <ResultsPage mode={getModeFromSearchType(lastSearch.searchType || searchType)} setMode={() => undefined} isLoading={isSubmitting} initialQuery={lastSearch.query} initialLocation={getModeFromSearchType(lastSearch.searchType || searchType) === "providers" ? lastSearch.location || "Near you" : undefined} initialSearchType={lastSearch.searchType || searchType} />
        )}
      </div>
    </div>
  );
}
