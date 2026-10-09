  "use client";

  import { useEffect, useMemo, useState } from "react";
  import NextImage from "next/image";
  import Tesseract from "tesseract.js";
  import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Trash2, X } from "lucide-react";
  import {
    apiCreateInvoice,
    apiPreviewCegid,
    type CegidPreviewResponse,
  } from "@/features/invoice/api/invoice.api";
  import { useNegara } from "@/features/negara/hooks/useNegara";
  import { getActiveStoreCode, getActiveStoreEmail, getActiveStoreName } from "@/shared/lib/auth-token";
  import { NEGARA_LIST, type NegaraOption } from "@/shared/constants/negara.constant";
  import { NegaraCombobox } from "@/shared/components/negara-combobox";
  import {
    LandingStepProgress,
    type LandingStep,
  } from "@/features/invoice/components/landing-step-progress";
  import { formatApiDateOnly } from "@/shared/lib/date-time";

  const initialForm = {
    fullName: "",
    email: "",
    address: "",
    nationality: "",
    passportNumber: "",
  };

  type Step = LandingStep;

  function formatAmount(value: number) {
    return `IDR ${Number(value ?? 0).toLocaleString("en-US")}`;
  }

  const MINIMUM_INVOICE_TOTAL = 504545;

  function getValidationWibDate() {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }

  function isAllowedTransactionDate(transactionDate: string) {
    return Boolean(transactionDate) && transactionDate === getValidationWibDate();
  }

  function normalizeTransactionDate(value: string) {
    const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
  }

  function formatFriendlyInvoiceLookupError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error ?? "");
    const normalized = message.toLowerCase();

    if (
      normalized.includes("404") ||
      normalized.includes("not found") ||
      normalized.includes("no invoice") ||
      normalized.includes("invoice not found") ||
      normalized.includes("failed to fetch")
    ) {
      return "No invoice data was found for this site and invoice number. Please check the number and try again.";
    }

    return message || "No invoice data was found for this site and invoice number. Please check the number and try again.";
  }

  type CustomerInfo = {
    id?: string | number;
    fullName: string;
    email: string;
    address: string;
    nationality: string;
    passportNumber: string;
  };

  const fieldClass =
    "min-h-12 w-full min-w-0 rounded-xl border border-[#0B1B3B]/12 bg-white px-4 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-[#0B1B3B]/40 sm:text-sm";

  const helperTextClass = "text-xs leading-5 text-amber-700";
  const helperTextSideClass = "mt-2 whitespace-nowrap text-left text-[11px] leading-5 text-amber-700";

  const primaryButtonClass =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1B3B] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0B1B3B]/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-3";

  const secondaryButtonClass =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#0B1B3B]/15 bg-white px-5 py-3.5 text-sm font-medium text-[#0B1B3B] transition hover:border-[#0B1B3B]/30 hover:bg-[#0B1B3B]/[0.02] sm:w-auto sm:py-3";

  const toneDotColor: Record<"info" | "success" | "warning" | "error", string> = {
    info: "bg-sky-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
  };

  function Toast({
    message,
    tone,
    onClose,
  }: {
    message: string;
    tone: "info" | "success" | "warning" | "error";
    onClose: () => void;
  }) {
    return (
      <div className="pointer-events-auto fixed left-1/2 top-4 z-50 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 duration-300 animate-in fade-in slide-in-from-top-2 sm:left-auto sm:right-4 sm:top-5 sm:w-auto sm:translate-x-0">
        <div className="flex items-start gap-3 rounded-2xl border border-[#0B1B3B]/10 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(11,27,59,0.10)]">
          <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${toneDotColor[tone]}`} />
          <p className="flex-1 text-sm leading-5 text-[#0B1B3B]/85">{message}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss notification"
            className="mt-0.5 shrink-0 text-[#0B1B3B]/30 transition hover:text-[#0B1B3B]/60"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  function EnglishPolicyContent({ policy }: { policy: "terms" | "privacy" }) {
    if (policy !== "terms") return null;

    return (
      <>
      <div className="rounded-xl border border-[#0B1B3B]/10 bg-[#FAFAF8] p-4 text-lg font-semibold text-[#0B1B3B]">
        VAT Refund for Tourists: Terms &amp; Conditions
      </div>
          <p>
            Applicable at all Delamibrands brand stores (EXECUTIVE, COLORBOX, et cetera, WOOD, Wrangler, JENAHARA, and cirka) that are registered under the Tax Refund for Tourists scheme and display the official "Tax Refund for Tourists" logo issued by the Directorate General of Taxes (DJP), Ministry of Finance of the Republic of Indonesia. 
          </p>

          <h3 className="font-semibold text-[#0B1B3B]">1. Definition of VAT Refund for Tourists Facility</h3>
          <p>
            VAT Refund for Tourists (Tax Refund) is a facility provided by the Government of Indonesia that allows eligible foreign tourists to claim back the Value Added Tax (VAT/PPN) paid on goods purchased from participating retailers, including Delamibrands stores, provided the goods are taken out of Indonesia as accompanied baggage. 
          </p>

          <h3 className="font-semibold text-[#0B1B3B]">2. Eligibility</h3>
          <p>VAT Refund is available for tourists who meet the following criteria:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Hold a valid foreign passport (non-Indonesian citizen and non-permanent resident of Indonesia).</li>
            <li>
              Stay in Indonesia for no longer than 60 (sixty) calendar days from the date of arrival. Foreign diplomatic representatives (Embassy staff) residing in Indonesia are not eligible for this facility.
            </li>
          </ul>

          <h3 className="font-semibold text-[#0B1B3B]">3. Minimum Purchase Requirement</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              A valid Tax Invoice (Faktur Pajak Turis) requires a minimum purchase of IDR 504,545 per transaction/receipt, including VAT of IDR 50,000 (fifty thousand rupiah).
            </li>
            <li>
              The total accumulated purchase submitted for a VAT refund claim must be at least IDR 5,045,455, including VAT of IDR 500,000 (five hundred thousand rupiah).
            </li>
            <li>
              To meet the minimum claim amount, eligible Tax Invoices issued by Delamibrands and/or other participating retailers may be combined.  
            </li>
            <li>Purchases must be made within 1 (one) month before the customer&apos;s departure from Indonesia.</li>
          </ul>
          <p className="text-xs italic text-[#0B1B3B]/55">
            Note: the figures above follow the minimum threshold published by DJP (pajak.go.id) as
            of the date of this document. The minimum thresholds and the prevailing VAT rate are
            subject to change in accordance with the applicable government regulation. Please
            consult the DJP official channel or ask our store staff for the latest information.
          </p>

          <h3 className="font-semibold text-[#0B1B3B]">4. How to Obtain a Tax Invoice at Delamibrands Stores</h3>
<ol className="list-decimal space-y-1 pl-5">
  <li>
    Purchase goods at any participating Delamibrands brand store (excluding bazaars and
    department stores) and meet the minimum purchase requirements in a single
    transaction.
  </li>
    <li>
    Request the Tax Invoice from our store staff{" "}
    <strong>on the same day as the transaction</strong>, then complete the{" "}
    <a
      href="https://tax-refund.delamibrands.com/landing-page?mode=self-service"
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold underline"
    >
      Tax Refund for Tourists form
    </a>{" "}
    by providing accurate personal information.
  </li>
  <li>
    Your Tax Invoice will be issued through the DJP Tax System (Coretax) and sent to
    your registered email address, generally no later than 11:59 PM (GMT +7) on the
    following day. Please plan your claim around your flight schedule accordingly.
  </li>
  <li>
    If the Tax Invoice cannot be issued due to a system error or delay on the DJP Tax
    System, Delamibrands will notify you by email and continue to monitor the status of
    your invoice.
  </li>
</ol>
          <p className="text-xs italic text-[#0B1B3B]/55">
            Note: The Tax Refund for Tourist Facility is currently available only at Delamibrands
            brand stores located at Grand Outlet Bali and will be made available at other
            Delamibrands brand stores gradually.
          </p>

          <h3 className="font-semibold text-[#0B1B3B]">5. Accuracy of Information</h3>
          <p>
            Please ensure that all information submitted in the Tax Refund for Tourist
            application form (including passport details and email address) is complete and
            accurate. Delamibrands is not responsible for any incorrect, delayed, or unissued Tax
            Invoice resulting from inaccurate information provided by the customer, or from
            technical issues within the DJP Tax System, which is outside Delamibrands&apos; control.
          </p>

          <h3 className="font-semibold text-[#0B1B3B]">6. Personal Data Safety</h3>
          <p>
            All personal data provided by the customer during the Tax Refund for Tourist
            application process will only be used for the administration of the Tax Refund for
            Tourist program in accordance with the applicable laws and regulations in Indonesia.
          </p>

          <h3 className="font-semibold text-[#0B1B3B]">7. Conditions for Claiming Your VAT Refund</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              The purchased goods must be carried out of Indonesia as accompanied baggage (i.e.,
              not shipped separately by courier or cargo).
            </li>
            <li>The goods must leave Indonesia within 1 (one) month (30 calendar days) of the purchase date.</li>
            <li>
              The claim can only be made by the tourist departing Indonesia by air, at a VAT
              Refund counter located in the international departure area of the airport of
              departure. Tourists departing by cruise ship are not eligible, as a valid flight
              boarding pass is a mandatory document for the claim.
            </li>
            <li>
              Tax Invoices cannot be combined across separate trips. If a tourist departs,
              re-enters Indonesia, purchases again, and departs a second time, each departure
              must be claimed separately using the Tax Invoices relevant to that trip only.
            </li>
          </ul>

          <h3 className="font-semibold text-[#0B1B3B]">8. How to Claim VAT Refund at the Airport</h3>
          <p className="font-medium text-[#0B1B3B]/90">Step A — Prepare your claim online (before going to the counter)</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Access{" "}
              <a
                href="https://vatrefundapp.pajak.go.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                https://vatrefundapp.pajak.go.id/
              </a>{" "}
              via your phone or laptop.
            </li>
            <li>Sign in or create a new account if you do not already have one.</li>
            <li>Head over to the &quot;Refunds&quot; menu and create a new refund claim.</li>
            <li>Fill in your address, arrival date, and departure date.</li>
            <li>Select the Tax Invoice(s) you wish to claim.</li>
            <li>Choose your preferred refund method.</li>
            <li>Take a photo of your purchased goods as requested in the application.</li>
            <li>Click Submit.</li>
          </ol>
          <p className="font-medium text-[#0B1B3B]/90">Step B — Visit the VAT Refund counter at the airport</p>
          <p>
            Proceed to the VAT Refund counter at your departure airport and present the following
            for verification:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Your passport.</li>
            <li>Your boarding pass.</li>
            <li>The original purchase receipt(s) and corresponding Tax Invoice(s).</li>
            <li>The purchased goods, available for inspection.</li>
          </ul>
          <p>
            If your Tax Invoice cannot be found in the vatrefundapp.pajak.go.id system, you may
            still proceed directly to the VAT Refund counter and present the Tax Invoice sent to
            you by email, together with your purchase receipt, passport, boarding pass, and the
            goods purchased.
          </p>

          <h3 className="font-semibold text-[#0B1B3B]">9. VAT Refund Counter Locations</h3>
          <p>VAT Refund counters are available at selected international airports in Indonesia, including:</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#0B1B3B]/15 text-[#0B1B3B]">
                  <th className="py-2 pr-3 font-semibold">Airport</th>
                  <th className="py-2 pr-3 font-semibold">Counter Location</th>
                  <th className="py-2 font-semibold">Website</th>
                </tr>
              </thead>
              <tbody className="text-[#0B1B3B]/70">
                <tr className="border-b border-[#0B1B3B]/8">
                  <td className="py-2 pr-3">Ngurah Rai, Denpasar (Bali)</td>
                  <td className="py-2 pr-3">International Terminal, 3rd Floor</td>
                  <td className="py-2"><a href="https://www.baliairport.com/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">www.baliairport.com</a></td>
                </tr>
                <tr className="border-b border-[#0B1B3B]/8">
                  <td className="py-2 pr-3">Soekarno-Hatta, Jakarta — Counter 1</td>
                  <td className="py-2 pr-3">Terminal 2F, International Departure, 2nd Floor</td>
                  <td className="py-2"><a href="https://soekarnohatta-airport.co.id/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">soekarnohatta-airport.co.id</a></td>
                </tr>
                <tr className="border-b border-[#0B1B3B]/8">
                  <td className="py-2 pr-3">Soekarno-Hatta, Jakarta — Counter 2</td>
                  <td className="py-2 pr-3">Terminal 3, Gate 1, 2nd Floor</td>
                  <td className="py-2"><a href="https://soekarnohatta-airport.co.id/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">soekarnohatta-airport.co.id</a></td>
                </tr>
                <tr className="border-b border-[#0B1B3B]/8">
                  <td className="py-2 pr-3">Kualanamu, Medan</td>
                  <td className="py-2 pr-3">Departure Terminal, 2nd Floor</td>
                  <td className="py-2"><a href="https://kualanamu-airport.co.id/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">kualanamu-airport.co.id</a></td>
                </tr>
                <tr className="border-b border-[#0B1B3B]/8">
                  <td className="py-2 pr-3">Juanda, Surabaya</td>
                  <td className="py-2 pr-3">Terminal 2, Ground Floor</td>
                  <td className="py-2"><a href="https://juanda-airport.com/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">juanda-airport.com</a></td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Yogyakarta International Airport</td>
                  <td className="py-2 pr-3">Departure Terminal</td>
                  <td className="py-2"><a href="https://yogyakarta-airport.co.id/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">yogyakarta-airport.co.id</a></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-semibold text-[#0B1B3B]">10. Refund Method and Timing</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              If the total refund amount is IDR 5,000,000 (five million rupiah) or less, the
              refund will be paid in cash in Indonesian Rupiah (IDR) at the airport counter on the
              date of departure.
            </li>
            <li>
              If the total refund amount exceeds IDR 5,000,000, the refund will be made by bank
              transfer within 1 (one) month of the claim, using the bank account details provided
              by the customer during the claim process.
            </li>
            <li>
              If the refund amount exceeds IDR 5,000,000 and the customer does not wish to
              receive payment by transfer, only IDR 5,000,000 will be refunded in cash, and the
              remaining amount is not refundable.
            </li>
          </ul>
          <div className="overflow-hidden rounded-xl border border-[#0B1B3B]/10">
            <NextImage
              src="/tax-refund-workflow.png"
              alt="Easy Steps to Get Your Tax Refund"
              width={1000}
              height={700}
              className="h-auto w-full object-contain"
            />
          </div>

          <h3 className="font-semibold text-[#0B1B3B]">11. Important Notes</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Delamibrands stores cannot provide cash refunds or any form of VAT reimbursement
              directly at the point of sale. All VAT refund claims must be processed exclusively
              through the official VAT Refund counter at the airport of departure.
            </li>
            <li>
              Delamibrands issues Tax Invoices through the DJP Tax System and has no direct
              control over that system&apos;s processing time; Delamibrands is not liable for delays
              caused by the DJP Tax System.
            </li>
            <li>
              The issuance of Tax Invoice does not guarantee the approval of the VAT Refund
              application. The final decision on the VAT Refund application is solely determined
              by the Directorate General of Taxes (DJP) through the verification process at the
              VAT Refund counter at the airport.
            </li>
            <li>
              This facility applies only to purchases made at Delamibrands brand counters
              registered as &quot;Tax Refund for Tourists&quot; participants. Please confirm
              participation status with our store staff at the time of purchase.
            </li>
            <li>
              Delamibrands reserves the right to update these Terms &amp; Conditions from time to
              time to remain consistent with prevailing regulations issued by the Directorate
              General of Taxes (DJP) and the Ministry of Finance of the Republic of Indonesia.
            </li>
          </ul>

          <h3 className="font-semibold text-[#0B1B3B]">12. Regulatory Basis</h3>
          <p>
            This facility is administered in accordance with the prevailing regulations of the
            Ministry of Finance of the Republic of Indonesia and the Directorate General of Taxes
            (DJP) concerning Value Added Tax Refund for Tourists (Tax Refund for Tourists), as
            published on the official DJP website:{" "}
            <a href="https://pajak.go.id/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
              pajak.go.id.
            </a>
          </p>

          <h3 className="font-semibold text-[#0B1B3B]">13. Contact Us</h3>
          <p>
            For questions about your Tax Invoice or this facility, please contact our store staff
            at the counter, or reach Delamibrands Customer Service via email at
            taxrefund@delamibrands.com. For questions regarding your refund claim status at the
            airport, please contact the DJP VAT Refund counter directly or visit{" "}
            <a href="https://vatrefundapp.pajak.go.id/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
              vatrefundapp.pajak.go.id.
            </a>
          </p>
        </>
    );
  }

  export default function TouristLandingPage() {
    // Defer reading URL params to client mount to avoid SSR/CSR hydration mismatches.
    const initialStep: Step = "customer";
    const initialFormState = { ...initialForm };

    const [step, setStep] = useState<Step>(initialStep);
    const [form, setForm] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [messageTone, setMessageTone] = useState<"info" | "success" | "warning" | "error">("info");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [activeField, setActiveField] = useState<string | null>(null);
    const [customer, setCustomer] = useState<CustomerInfo | null>(null);
    const [invoiceNo, setInvoiceNo] = useState("");
    const [selectedStoreCode, setSelectedStoreCode] = useState("");
    const [resolvedInvoiceKey, setResolvedInvoiceKey] = useState("");
    const [invoiceQueue, setInvoiceQueue] = useState<
      Array<{
        id: string;
        noInvoice: string;
        storeCode: string;
        storeName?: string;
        preview?: CegidPreviewResponse;
      }>
    >([]);
    const [activeQueuedInvoiceId, setActiveQueuedInvoiceId] = useState<string | null>(null);
    const [showInvoiceFinder, setShowInvoiceFinder] = useState(false);
    const [preview, setPreview] = useState<CegidPreviewResponse | null>(null);
    const [ocrStatus, setOcrStatus] = useState<"idle" | "running" | "ready">("idle");
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrError, setOcrError] = useState<string | null>(null);
    const [passportPreviewUrl, setPassportPreviewUrl] = useState<string | null>(null);
    const [isCustomerReviewing, setIsCustomerReviewing] = useState(false);
    const [ocrDetectedFields, setOcrDetectedFields] = useState<{
      fullName?: string;
      passportNumber?: string;
      nationality?: string;
      dateOfBirth?: string;
      expiryDate?: string;
    } | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [openPolicy, setOpenPolicy] = useState<"terms" | "privacy" | null>(null);
    const [policyLanguage, setPolicyLanguage] = useState<"id" | "en">("en");
    const [consentLanguage, setConsentLanguage] = useState<"id" | "en">("en");
    const { data: fetchedNegara = [] } = useNegara();
    const [isSelfServiceMode, setIsSelfServiceMode] = useState(false);
    // true when SA opens an existing customer from the dashboard.
    const [isSaProcessingMode, setIsSaProcessingMode] = useState(false);
    const hasQueuedDuplicates = invoiceQueue.some((item) => item.preview?.alreadyExists);

    // On mount, read URL params and active store from localStorage. Do this in an effect
    // to avoid server-client markup mismatches during hydration.
    useEffect(() => {
      // Defer reading/writing client-only state to next tick to avoid cascading renders
      const init = () => {
        // read active store
        setSelectedStoreCode(getActiveStoreCode() ?? "");

        // read mode params
        try {
          const params = new URLSearchParams(window.location.search);
          const modeParam = params.get("mode");
          if (modeParam === "self-service") {
            setIsSelfServiceMode(true);
          }
          const customerIdParam = params.get("customerId");
          const customerNameParam = params.get("customerName");
          if (customerIdParam || customerNameParam) {
            setIsSaProcessingMode(true);

            if (customerNameParam) {
              const initialCustomerFromParams: CustomerInfo = {
                id: Number(customerIdParam ?? undefined) || undefined,
                fullName: customerNameParam ?? "",
                email: params.get("customerEmail") ?? "",
                address: params.get("customerAddress") ?? "",
                nationality: params.get("customerNationality") ?? "",
                passportNumber: params.get("customerPassportNumber") ?? "",
              };

              setCustomer(initialCustomerFromParams);
              setForm((prev) => ({
                ...prev,
                fullName: initialCustomerFromParams.fullName,
                email: initialCustomerFromParams.email,
                address: initialCustomerFromParams.address,
                nationality: initialCustomerFromParams.nationality,
                passportNumber: initialCustomerFromParams.passportNumber,
              }));
              setStep("customer");
            } else if (customerIdParam) {
              const id = Number(customerIdParam);
              if (!Number.isNaN(id) && id > 0) {
                (async () => {
                  try {
                    const res = await fetch(`/api/gw/tax-refund-customer/${id}`);
                    const json = await res.json();
                    if (res.ok && json?.success && json.data) {
                      const t = json.data;
                      const fetched: CustomerInfo = {
                        id: t.id,
                        fullName: t.fullName ?? t.full_name ?? "",
                        email: t.email ?? "",
                        address: t.address ?? "",
                        nationality: t.nationality ?? "",
                        passportNumber: t.passportNumber ?? t.passport_number ?? "",
                      };
                      setCustomer(fetched);
                      setForm((prev) => ({
                        ...prev,
                        fullName: fetched.fullName,
                        email: fetched.email,
                        address: fetched.address,
                        nationality: fetched.nationality,
                        passportNumber: fetched.passportNumber,
                      }));
                      setStep("customer");
                    }
                  } catch {
                    // ignore fetch error
                  }
                })();
              }
            }
          }
        } catch {
          // ignore malformed URL
        }
      };

      const timer = window.setTimeout(init, 0);
      return () => window.clearTimeout(timer);
    }, []);



    useEffect(() => {
      if (!message) return;
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }, [message]);

    useEffect(() => {
      return () => {
        if (passportPreviewUrl) URL.revokeObjectURL(passportPreviewUrl);
      };
    }, [passportPreviewUrl]);

    const isIndonesiaCountry = (country: Partial<NegaraOption> | null | undefined) => {
      const nama = String(country?.nama ?? "").trim().toLowerCase();
      const kode = String(country?.kode ?? "").trim().toLowerCase();
      return kode === "idn" || kode === "id" || nama === "indonesia";
    };

    const negaraOptions = useMemo(() => {
      const source = fetchedNegara.length ? fetchedNegara : NEGARA_LIST;
      return source.filter((country: Partial<NegaraOption>) => !isIndonesiaCountry(country));
    }, [fetchedNegara]);

    const normalizeCountryName = (value: string) => value.trim().toLowerCase();

    const findCountryByName = (value: string) => {
      const normalized = normalizeCountryName(value);
      if (!normalized) return undefined;

      return negaraOptions.find((country) => normalizeCountryName(country.nama) === normalized);
    };

    const findCountryByValue = (value: string) => {
      const normalized = normalizeCountryName(value);
      if (!normalized) return undefined;

      return negaraOptions.find(
        (country) =>
          normalizeCountryName(country.kode) === normalized ||
          normalizeCountryName(country.nama) === normalized
      );
    };

    const countryCode = (value?: string | null) => {
      const normalized = (value ?? "").trim();
      if (!normalized) return "-";
      return (
        negaraOptions.find(
          (country) =>
            country.kode.toLowerCase() === normalized.toLowerCase() ||
            country.nama.toLowerCase() === normalized.toLowerCase()
        )?.kode ?? normalized.toUpperCase()
      );
    };

    const sanitizePassportName = (value: string) => {
      const cleaned = cleanPassportValue(value)
        .replace(/^(?:X|Y|Z)\s+/i, "")
        .replace(/\b(?:EG|TND|IND|IDN|G|JL|NO|ADDRESS|ALAMAT|PASSPORT|FULL|NAME|KOTA|PUSAT)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

      const tokens = cleaned.split(" ").filter(Boolean);
      while (tokens.length > 1 && tokens[tokens.length - 1].length <= 2) {
        tokens.pop();
      }

      return tokens.join(" ");
    };

    const handleNegaraChange = (kodeNegara: string) => {
      const matchedCountry = negaraOptions.find((country) => country.kode === kodeNegara);
      if (matchedCountry) {
        handleChange("nationality", matchedCountry.kode);
      }
    };

    const handleChange = (field: string, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setFieldErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    };

    const normalizePassportText = (rawText: string) =>
      rawText
        .replace(/\r/g, "\n")
        .replace(/[|]+/g, " ")
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const extractPassportField = (text: string, patterns: RegExp[]) => {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1].replace(/\s+/g, " ").trim();
        }
      }

      return "";
    };

    const cleanPassportValue = (value: string) =>
      value
        .replace(/[^A-Z0-9<>'\-\.\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const findPassportLabelValue = (lines: string[], labels: string[]) => {
      for (let i = 0; i < lines.length; i += 1) {
        const current = lines[i].toUpperCase();
        if (!labels.some((label) => current.includes(label))) continue;

        for (let j = i + 1; j < Math.min(lines.length, i + 5); j += 1) {
          const candidate = cleanPassportValue(lines[j]);
          if (!candidate) continue;
          if (/^(JL\.|JLN|ADDRESS|ALAMAT|NO\.|NO\b|DATE|BIRTH|EXP|NATIONALITY|INDONESIA|P\s*IDN)/i.test(candidate)) {
            continue;
          }
          return candidate;
        }
      }

      return "";
    };

    const preprocessPassportImage = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        const img = new window.Image();

        reader.onload = () => {
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              reject(new Error("Canvas not available"));
              return;
            }

            const width = Math.max(1200, img.width);
            const height = Math.max(800, img.height);
            canvas.width = width;
            canvas.height = height;

            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, width, height);
            ctx.filter = "grayscale(1) contrast(1.8) brightness(1.1)";
            ctx.drawImage(img, 0, 0, width, height);
            ctx.filter = "none";

            const imageData = ctx.getImageData(0, 0, width, height);
            const pixels = imageData.data;

            for (let i = 0; i < pixels.length; i += 4) {
              const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
              const threshold = brightness > 180 ? 255 : 0;
              pixels[i] = threshold;
              pixels[i + 1] = threshold;
              pixels[i + 2] = threshold;
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          };

          img.onerror = () => reject(new Error("Image could not be loaded"));
          img.src = String(reader.result);
        };

        reader.onerror = () => reject(new Error("File could not be read"));
        reader.readAsDataURL(file);
      });

    const applyPassportOcrData = (rawText: string) => {
      const text = normalizePassportText(rawText);

      if (!text) {
        setOcrStatus("ready");
        setOcrError("OCR could not read the passport image. Please complete the fields manually.");
        return;
      }

      const normalizedText = text.toUpperCase();
      const lines = rawText
        .split(/\n+/)
        .map((line) => line.replace(/[^A-Z0-9<>'\-\.\s/]/g, " ").replace(/\s+/g, " ").trim())
        .filter(Boolean);

      const passportNumber =
        extractPassportField(normalizedText, [
          /(?:PASSPORT\s*(?:NO|NUMBER|N0)?\s*[:#-]?\s*)(C\s*\d{6,8})/i,
          /\b(C\s*\d{6,8})\b/i,
        ]) ||
        lines
          .map((line) => line.match(/\bC\s*\d{6,8}\b/i)?.[0] ?? "")
          .find(Boolean) ||
        "";

      const fullName =
        sanitizePassportName(findPassportLabelValue(lines, ["NAMA", "FULL NAME", "NAME"])) ||
        sanitizePassportName(
          extractPassportField(normalizedText, [
            /(?:NAME|FULL\s*NAME|NAMA\s*LENGKAP)\s*[:#-]?\s*([A-Z][A-Z'\-\. ]{2,})/i,
          ])
        );

      const nationality =
        findPassportLabelValue(lines, ["NATIONALITY", "KEWARGANEGARAAN", "NAT"]) ||
        extractPassportField(normalizedText, [
          /(?:NATIONALITY|NAT)\s*[:#-]?\s*([A-Z][A-Z ]{2,})/i,
        ]) ||
        "";

      const dateOfBirth =
        extractPassportField(normalizedText, [
          /DOB\s*[:#-]?\s*([0-9]{2}[\/\-][0-9]{2}[\/\-][0-9]{4})/i,
          /DATE\s*OF\s*BIRTH\s*[:#-]?\s*([0-9]{2}[\/\-][0-9]{2}[\/\-][0-9]{4})/i,
        ]) ||
        "";

      const expiryDate =
        extractPassportField(normalizedText, [
          /EXP\s*(?:DATE|IRY)?\s*[:#-]?\s*([0-9]{2}[\/\-][0-9]{2}[\/\-][0-9]{4})/i,
          /DATE\s*OF\s*EXPIRY\s*[:#-]?\s*([0-9]{2}[\/\-][0-9]{2}[\/\-][0-9]{4})/i,
        ]) ||
        "";

      const detectedNationality = cleanPassportValue(nationality);
      const matchedNationality = detectedNationality ? findCountryByName(detectedNationality)?.kode ?? detectedNationality : "";

      const detected = {
        fullName: sanitizePassportName(fullName) || undefined,
        passportNumber: cleanPassportValue(passportNumber).replace(/\s+/g, "") || undefined,
        nationality: matchedNationality || undefined,
        dateOfBirth: dateOfBirth || undefined,
        expiryDate: expiryDate || undefined,
      };

      setOcrDetectedFields(detected);
      setForm((prev) => ({
        ...prev,
        fullName: detected.fullName || prev.fullName,
        passportNumber: detected.passportNumber || prev.passportNumber,
        nationality: detected.nationality || prev.nationality,
      }));

      const hasAnyDetected = Object.values(detected).some(Boolean);
      setOcrStatus("ready");

      if (hasAnyDetected) {
        setNotice(
          "Passport text was detected and matching fields were filled automatically. Please review before continuing.",
          "success"
        );
        return;
      }

      setNotice(
        "OCR read the image but no matching passport fields were detected. Please complete the details manually.",
        "warning"
      );
    };

    const handlePassportUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const nextPreviewUrl = URL.createObjectURL(file);
      setPassportPreviewUrl(nextPreviewUrl);
      setOcrStatus("running");
      setOcrProgress(0);
      setOcrError(null);
      setOcrDetectedFields(null);
      setNotice("Reading passport image…", "info");

      try {
        const processedDataUrl = await preprocessPassportImage(file);
        const result = await Tesseract.recognize(processedDataUrl, "eng", {
          logger: (info) => {
            if (info.status === "recognizing text") {
              setOcrStatus("running");
              setOcrProgress(Math.round((info.progress ?? 0) * 100));
            }
          },
        });

        setOcrProgress(100);
        applyPassportOcrData(result.data.text);
      } catch (error) {
        console.error("Passport OCR failed", error);
        setOcrStatus("ready");
        setOcrError("OCR failed to read the image. Please try again or enter the data manually.");
        setNotice("OCR failed on this image. Please complete the form manually.", "warning");
      } finally {
        event.target.value = "";
      }
    };

    const setNotice = (text: string | null, tone: "info" | "success" | "warning" | "error" = "info") => {
      setMessage(text);
      setMessageTone(tone);
    };

    const resetFlow = () => {
      setStep("customer");
      setForm(initialForm);
      setCustomer(null);
      setInvoiceNo("");
      setSelectedStoreCode(getActiveStoreCode() ?? "");
      setResolvedInvoiceKey("");
      setInvoiceQueue([]);
      setActiveQueuedInvoiceId(null);
      setShowInvoiceFinder(false);
      setPreview(null);
      setTermsAccepted(false);
      setOpenPolicy(null);
      setIsCustomerReviewing(false);
      setPassportPreviewUrl(null);
      setOcrProgress(0);
      setOcrStatus("idle");
      setOcrError(null);
      setOcrDetectedFields(null);
      setNotice(null, "info");
    };

    const resetInvoiceSelection = () => {
      setSelectedStoreCode(getActiveStoreCode() ?? "");
      setResolvedInvoiceKey("");
      setPreview(null);
      setNotice(null, "info");
    };

    const openInvoiceFinderForNewEntry = () => {
      setInvoiceNo("");
      setPreview(null);
      setResolvedInvoiceKey("");
      setShowInvoiceFinder(true);
      setStep("invoice-search");
      setNotice(null, "info");
    };

    const removeQueuedInvoice = (itemId: string) => {
      const nextQueue = invoiceQueue.filter((queued) => queued.id !== itemId);
      setInvoiceQueue(nextQueue);

      if (activeQueuedInvoiceId === itemId) {
        setActiveQueuedInvoiceId(nextQueue[0]?.id ?? null);
        const nextActive = nextQueue[0];
        if (nextActive) {
          const activeStoreCode = getActiveStoreCode() ?? nextActive.storeCode;
          setInvoiceNo(nextActive.noInvoice);
          setSelectedStoreCode(activeStoreCode);
          setResolvedInvoiceKey(`${nextActive.noInvoice.toLowerCase()}|${activeStoreCode.toLowerCase()}`);
          setPreview(nextActive.preview ?? null);
        } else {
          setInvoiceNo("");
          setSelectedStoreCode(getActiveStoreCode() ?? "");
          setResolvedInvoiceKey("");
          setPreview(null);
          openInvoiceFinderForNewEntry();
        }
      }

      if (nextQueue.length === 0) {
        setShowInvoiceFinder(true);
        setNotice("Invoice removed from the invoice list.", "info");
      } else {
        setNotice("Invoice removed from the invoice list.", "info");
      }
    };

    const openQueuedInvoice = (itemId: string) => {
      const item = invoiceQueue.find((queued) => queued.id === itemId);
      if (!item) return;

      const isSameItem = activeQueuedInvoiceId === itemId;
      const activeStoreCode = getActiveStoreCode() ?? item.storeCode;

      setActiveQueuedInvoiceId(isSameItem ? null : itemId);
      setInvoiceNo(isSameItem ? "" : item.noInvoice);
      setSelectedStoreCode(activeStoreCode);
      setResolvedInvoiceKey(isSameItem ? "" : `${item.noInvoice.toLowerCase()}|${activeStoreCode.toLowerCase()}`);
      setPreview(isSameItem ? null : item.preview ?? null);
      setShowInvoiceFinder(false);
      setStep("invoice-search");
    };

    const addInvoiceToQueue = () => {
      if (!customer || !preview) {
        setNotice("Invoice preview is not available yet.", "warning");
        return;
      }

      const nextInvoiceNo = (preview.receiptNo || invoiceNo.trim()).trim();
      const activeStoreCode = getActiveStoreCode() ?? "";
      const nextStoreCode = (activeStoreCode || selectedStoreCode || preview.storeCode || "").trim();
      const nextStoreName = preview.storeName || getActiveStoreName() || nextStoreCode;

      if (!nextInvoiceNo || !nextStoreCode) {
        setNotice("Please select an invoice and matching site before adding it to the list.", "warning");
        return;
      }

      const duplicate = invoiceQueue.some(
        (item) =>
          item.noInvoice.trim().toLowerCase() === nextInvoiceNo.toLowerCase() &&
          item.storeCode.trim().toLowerCase() === nextStoreCode.toLowerCase()
      );

      if (duplicate) {
        setNotice("This invoice is already in the invoice list.", "warning");
        return;
      }

      const queuedItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        noInvoice: nextInvoiceNo,
        storeCode: nextStoreCode,
        storeName: nextStoreName,
        preview: typeof structuredClone === "function" ? structuredClone(preview) : preview,
      };

      setInvoiceQueue((prev) => [...prev, queuedItem]);
      setActiveQueuedInvoiceId(queuedItem.id);
      setInvoiceNo("");
      setResolvedInvoiceKey("");
      setPreview(null);
      setSelectedStoreCode(getActiveStoreCode() ?? "");
      setShowInvoiceFinder(false);
      setNotice(`Invoice ${nextInvoiceNo} was added to the invoice list.`, "success");
      setStep("invoice-search");
    };

    const submitQueuedInvoice = async () => {
      if (!customer || invoiceQueue.length === 0) {
        setNotice("No invoice is in the invoice list yet.", "warning");
        return;
      }
      if (!isSaProcessingMode && !termsAccepted) {
        setNotice("Please accept the Terms and Conditions and Privacy Policy before submitting.", "warning");
        return;
      }

      const queuedPreview = invoiceQueue[0].preview;
      if (queuedPreview && Number(queuedPreview.subtotal ?? 0) < MINIMUM_INVOICE_TOTAL) {
        setNotice(
          `Invoice ditolak. Total transaksi minimal Rp${MINIMUM_INVOICE_TOTAL.toLocaleString("id-ID")}.`,
          "warning"
        );
        return;
      }

      const validationWibDate = getValidationWibDate();
      const queuedTransactionDate = queuedPreview
        ? normalizeTransactionDate(queuedPreview.transDate)
        : "";
      if (
        queuedPreview &&
        !isAllowedTransactionDate(queuedTransactionDate)
      ) {
        setNotice(
          `Invoice hanya dapat diajukan untuk transaksi tanggal ${validationWibDate}.`,
          "warning"
        );
        return;
      }

      if (hasQueuedDuplicates) {
        setNotice("Remove the invoice(s) already used for this store before submitting.", "warning");
        return;
      }

      const finalBuyerName = (form.fullName || customer?.fullName || preview?.namaMember || "").trim();
      const finalBuyerEmail = (form.email || customer?.email || preview?.email || "").trim();
      const finalAddress = (form.address || customer?.address || preview?.address || "").trim();
      const finalNationalityValue = (form.nationality || customer?.nationality || "").trim();
      const finalNationality =
        negaraOptions.find(
          (country) =>
            country.kode.toLowerCase() === finalNationalityValue.toLowerCase() ||
            country.nama.toLowerCase() === finalNationalityValue.toLowerCase()
        )?.kode ?? finalNationalityValue.toUpperCase();
      const finalPassport = customer?.passportNumber || "";

      try {
        setIsSubmitting(true);
        setNotice(null, "info");

        const queuedInvoice = invoiceQueue[0];
        const payload = {
          storeCode: queuedInvoice.storeCode,
          storeEmail: getActiveStoreEmail() ?? undefined,
          noInvoice: queuedInvoice.noInvoice,
          namaPembeli: finalBuyerName,
          emailPembeli: finalBuyerEmail,
          negaraPembeli: finalNationality,
          nomorDokumenPembeli: finalPassport,
          alamatPembeli: finalAddress,
        };

        await apiCreateInvoice(payload);
        setInvoiceQueue([]);
        setStep("success");
        setNotice("Invoice was created for this customer.", "success");
      } catch (error) {
        const submitError = error instanceof Error ? error.message : "Failed to create the invoice.";
        setNotice(submitError, "error");
      } finally {
        setIsSubmitting(false);
      }
    };

    const validateCustomerForm = () => {
      const trimmedFullName = form.fullName.trim();
      const trimmedEmail = form.email.trim();
      const trimmedAddress = form.address.trim();
      const trimmedNationality = form.nationality.trim();
      const trimmedPassport = form.passportNumber.trim();
      const nextErrors: Record<string, string> = {};

      if (!trimmedFullName) nextErrors.fullName = "Full name is required.";
      if (!trimmedEmail) {
        nextErrors.email = "Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        nextErrors.email = "Please enter a valid email address.";
      }
      if (!trimmedAddress) {
        nextErrors.address = "Address is required.";
      }
      if (!trimmedNationality) nextErrors.nationality = "Nationality is required.";
      if (!trimmedPassport) nextErrors.passportNumber = "Passport number is required.";

      setFieldErrors(nextErrors);
      return nextErrors;
    };

    const openCustomerReview = () => {
      if (!termsAccepted) {
        setNotice("Please accept the Terms and Conditions and Privacy Policy before continuing.", "warning");
        return;
      }

      const nextErrors = validateCustomerForm();
      if (Object.keys(nextErrors).length > 0) {
        setNotice("Please fix the highlighted fields before reviewing your data.", "error");
        return;
      }

      setNotice(null, "info");
      setIsCustomerReviewing(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const createCustomer = async () => {
      if (!termsAccepted) {
        setNotice("Please accept the Terms and Conditions and Privacy Policy before submitting.", "warning");
        return;
      }

      setIsSubmitting(true);
      setNotice(null, "info");

      try {
        const nextErrors = validateCustomerForm();
        if (Object.keys(nextErrors).length > 0) {
          setIsCustomerReviewing(false);
          setNotice("Please fix the highlighted fields.", "error");
          return;
        }

        const sourceChannel = "tourist_self_service";

        const response = await fetch("/api/gw/tax-refund-customer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: form.fullName,
            email: form.email,
            address: form.address,
            nationality: form.nationality,
            passportNumber: form.passportNumber,
            sourceChannel,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Failed to save customer data.");
        }

        const createdCustomer = result.data;
        // log full server response for easier debugging
        console.debug("createCustomer response:", result);

        setCustomer({
          id: createdCustomer.id,
          fullName: createdCustomer.fullName,
          email: form.email,
          address: form.address,
          nationality: form.nationality,
          passportNumber: form.passportNumber,
        });

        // broadcast new customer event to other tabs (non-persistent)
        try {
          const bc = new BroadcastChannel("customer-events");
          bc.postMessage({ id: createdCustomer.id, createdAt: new Date().toISOString() });
          bc.close();
        } catch (e) {
          // BroadcastChannel may not be available in some envs — ignore silently
        }

        setIsCustomerReviewing(false);
        setNotice(
          `Customer data has been saved (ID: ${createdCustomer.id}). The SA team will review it on the dashboard.`,
          "success"
        );
        setStep("success");
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Something went wrong.", "error");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handlePreviewInvoice = async () => {
      if (!customer) {
        setNotice("Please save customer details first.", "warning");
        return;
      }

      const noInvoice = invoiceNo.trim();
      if (!noInvoice) {
        setNotice("Invoice number is required.", "warning");
        return;
      }

      const activeStore = getActiveStoreCode() ?? "";
      const requestedStoreCode = (activeStore || selectedStoreCode || "").trim();
      const resolvedLookupKey = `${noInvoice.toLowerCase()}|${requestedStoreCode.toLowerCase()}`;

      if (resolvedInvoiceKey && resolvedInvoiceKey === resolvedLookupKey && preview) {
        setStep("invoice-search");
        return;
      }

      try {
        setIsSubmitting(true);
        setNotice(null, "info");

        const data = await apiPreviewCegid(requestedStoreCode, noInvoice);
        const chosenStoreCode = activeStore || requestedStoreCode || data.storeCode || "";
        const normalizedInvoiceNo = (data.receiptNo || noInvoice).trim();
        const itemPayload = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          noInvoice: normalizedInvoiceNo,
          storeCode: chosenStoreCode,
          storeName: data.storeName || getActiveStoreName() || chosenStoreCode,
          preview: data,
        };

        const duplicate = invoiceQueue.some(
          (item) =>
            item.noInvoice.trim().toLowerCase() === normalizedInvoiceNo.toLowerCase() &&
            item.storeCode.trim().toLowerCase() === chosenStoreCode.toLowerCase()
        );

        if (duplicate) {
          setNotice("This invoice is already in the invoice list.", "warning");
          return;
        }

        const transactionDate = normalizeTransactionDate(data.transDate);
        if (Number(data.subtotal ?? 0) < MINIMUM_INVOICE_TOTAL) {
          setNotice(
            `Invoice ditolak. Total transaksi minimal Rp${MINIMUM_INVOICE_TOTAL.toLocaleString("id-ID")}.`,
            "warning"
          );
          return;
        }

        const validationWibDate = getValidationWibDate();
        if (
          !isAllowedTransactionDate(transactionDate)
        ) {
          setNotice(
            `Invoice hanya dapat diajukan untuk transaksi tanggal ${validationWibDate}.`,
            "warning"
          );
          return;
        }

        setInvoiceQueue([itemPayload]);
        setActiveQueuedInvoiceId(itemPayload.id);
        setSelectedStoreCode(chosenStoreCode);
        setPreview(null);
        setResolvedInvoiceKey(`${normalizedInvoiceNo.toLowerCase()}|${chosenStoreCode.toLowerCase()}`);
        setInvoiceNo("");
        setShowInvoiceFinder(false);

        setForm((prev) => ({
          ...prev,
          address: prev.address || customer?.address || data.address || "",
        }));
        setStep("invoice-search");
        setNotice(`Invoice ${normalizedInvoiceNo} siap diajukan.`, "success");
      } catch (error) {
        setNotice(formatFriendlyInvoiceLookupError(error), "error");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleSubmitInvoice = async () => {
      if (!customer || !preview) {
        setNotice("Invoice preview is not available yet.", "warning");
        return;
      }
      if (!isSaProcessingMode && !termsAccepted) {
        setNotice("Please accept the Terms and Conditions and Privacy Policy before submitting.", "warning");
        return;
      }

      if (preview.alreadyExists) {
        setNotice("This invoice has already been used for this store. Submission is blocked.", "warning");
        return;
      }

      setIsSubmitting(true);
      setNotice(null, "info");

      try {
        const finalAddress = (form.address || customer?.address || preview.address || "").trim();
        const activeStoreCode = getActiveStoreCode() || selectedStoreCode || preview.storeCode || "";

        // Determine final buyer fields with priority: SA-typed (form) > tourist (customer) > CEGID preview fallback
        const finalBuyerName = (form.fullName || customer?.fullName || preview?.namaMember || "").trim();
        const finalBuyerEmail = (form.email || customer?.email || preview?.email || "").trim();

        console.log("Submitting invoice with buyer:", { finalBuyerName, finalBuyerEmail, activeStoreCode });

        await apiCreateInvoice({
          storeCode: activeStoreCode,
          storeEmail: getActiveStoreEmail() ?? undefined,
          noInvoice: preview.receiptNo || invoiceNo.trim(),
          namaPembeli: finalBuyerName,
          emailPembeli: finalBuyerEmail,
          negaraPembeli: countryCode(form.nationality || customer?.nationality || ""),
          nomorDokumenPembeli: customer?.passportNumber || "",
          alamatPembeli: finalAddress,
        });

        setStep("success");
        setNotice("Invoice created successfully. Customer details have been kept.", "success");
      } catch (error) {
        const submitError = error instanceof Error ? error.message : "Failed to save the invoice.";
        setNotice(submitError, "error");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleStepSelect = (nextStep: LandingStep) => {
      if (nextStep === "customer") {
        setStep("customer");
        return;
      }

      if (nextStep === "invoice-confirm") {
        setStep("invoice-search");
        return;
      }

      if (nextStep === "invoice-search" && customer) {
        setStep("invoice-search");
      }
    };

    const stepCopy: Record<Step, { title: string; subtitle: string }> = {
      customer: {
        title: "LET'S GET TO KNOW YOU",
        subtitle: "Provide your details as they appear in your passport.",
      },
      "invoice-search": {
        title: "Find your invoice",
        subtitle: "Enter the receipt number so we can match your purchase.",
      },
      "invoice-confirm": {
        title: "Review and confirm",
        subtitle: "Check buyer details and purchased items before submitting.",
      },
      success: {
        title: "Request submitted",
        subtitle: "Your invoice is ready for the next processing stage.",
      },
    };

    const isCustomerStep = step === "customer";
    const fieldHelperText: Record<string, string> = {
      fullName: "Please enter the name exactly as shown in the passport.",
      passportNumber: "Please enter the passport number exactly as shown in the passport.",
      email: "Use your active email address so we can send refund updates.",
      address: "Please enter the address exactly as shown in the passport.",
      nationality: "Please select the nationality that matches the passport.",
    };

    return (
      <>
        {message && <Toast message={message} tone={messageTone} onClose={() => setMessage(null)} />}
        {openPolicy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1B3B]/45 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="policy-title"
                className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl lg:max-h-[88vh] lg:max-w-4xl lg:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                 <div className="flex min-w-0 items-center gap-4">
                   <h2 id="policy-title" className="text-lg font-semibold text-[#0B1B3B]">
                     {openPolicy === "terms"
                       ? policyLanguage === "id"
                         ? "Syarat dan Ketentuan"
                         : "Terms and Conditions"
                       : policyLanguage === "id"
                         ? "Kebijakan Privasi"
                         : "Privacy Policy"}
                   </h2>
                   <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-[#0B1B3B]/60">
                     <span className="sr-only">Policy language</span>
                     <select
                       value={policyLanguage}
                       onChange={(event) => setPolicyLanguage(event.target.value as "id" | "en")}
                       className="rounded-lg border border-[#0B1B3B]/15 bg-white px-2.5 py-1.5 text-xs text-[#0B1B3B] outline-none focus:border-[#0B1B3B]/40"
                       aria-label="Policy language"
                     >
                       <option value="id">Indonesia</option>
                       <option value="en">English</option>
                     </select>
                   </label>
                 </div>
                 <button
                   type="button"
                   onClick={() => setOpenPolicy(null)}
                   aria-label="Close policy"
                   className="rounded-full p-1 text-[#0B1B3B]/50 hover:bg-[#0B1B3B]/5"
                 >
                   <X className="size-5" />
                 </button>
               </div>
               {policyLanguage === "en" ? (
                 <div className="mt-4 space-y-4 text-sm leading-6 text-[#0B1B3B]/70">
                   <EnglishPolicyContent policy={openPolicy} />
                 </div>
               ) : openPolicy === "terms" ? (
                                <div className="mt-4 space-y-4 text-sm leading-6 text-[#0B1B3B]/70">
                  <div className="rounded-xl border border-[#0B1B3B]/10 bg-[#FAFAF8] p-4 text-lg font-semibold text-[#0B1B3B]">
                   Pengembalian PPN untuk Turis: Syarat &amp; Ketentuan
                  </div>
                  <p>
                    Berlaku di seluruh gerai merek Delamibrands (EXECUTIVE, COLORBOX, et cetera,
                    WOOD, Wrangler, JENAHARA, dan cirka) yang telah terdaftar serta menampilkan
                    logo resmi &quot;Tax Refund for Tourists&quot; yang dikeluarkan oleh Direktorat
                    Jenderal Pajak (DJP), Kementerian Keuangan Republik Indonesia.
                  </p>

                  <h3 className="font-semibold text-[#0B1B3B]">1. Definisi Program Pengembalian PPN untuk Turis</h3>
                  <p>
                    Pengembalian PPN untuk Turis (Tax Refund) adalah program yang disediakan oleh
                    Pemerintah Indonesia yang memungkinkan turis asing yang memenuhi syarat untuk
                    mendapatkan kembali Pajak Pertambahan Nilai (PPN) yang telah dibayarkan atas
                    barang yang dibeli dari toko peserta program, termasuk gerai Delamibrands,
                    dengan ketentuan barang tersebut dibawa keluar dari Indonesia sebagai barang
                    bawaan atau bagasi.
                  </p>

                  <h3 className="font-semibold text-[#0B1B3B]">2. Kriteria Eligibilitas</h3>
                  <p>Pengembalian PPN dapat diberikan kepada turis yang memenuhi ketentuan sebagai berikut:</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Setiap pemegang paspor asing yang bukan warga negara Indonesia dan bukan pemegang izin tinggal tetap (Permanent Resident) di Indonesia.</li>
                    <li>
                      Yang tinggal atau berada di Indonesia tidak lebih dari 60 (enam puluh) hari
                      kalender terhitung sejak tanggal kedatangan. Perwakilan diplomatik asing
                      (staf Kedutaan Besar) yang berdomisili di Indonesia tidak berhak mendapatkan
                      pengembalian PPN.
                    </li>
                  </ul>

                  <h3 className="font-semibold text-[#0B1B3B]">3. Ketentuan Minimum Pembelian</h3>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>
                      Untuk memperoleh Faktur Pajak (Tax Invoice) yang sah, nilai pembelian
                      minimum adalah IDR 504.545 per transaksi/struk, termasuk PPN sebesar IDR
                      50.000 (lima puluh ribu rupiah).
                    </li>
                    <li>
                      Total akumulasi pembelian yang diajukan untuk pengembalian PPN harus
                      mencapai setidaknya IDR 5.045.455, termasuk PPN sebesar IDR 500.000 (lima
                      ratus ribu rupiah).
                    </li>
                    <li>
                      Untuk memenuhi nilai minimum pengajuan pengembalian PPN, Faktur Pajak Turis
                      yang memenuhi syarat dari Delamibrands atau toko peserta program lainnya
                      dapat digabungkan.
                    </li>
                    <li>Pembelian harus dilakukan dalam kurun waktu 1 (satu) bulan sebelum keberangkatan pelanggan dari Indonesia.</li>
                  </ul>
                  <p className="text-xs italic text-[#0B1B3B]/55">
                    Catatan: angka di atas mengikuti ambang batas minimum yang dipublikasikan oleh
                    DJP (pajak.go.id) pada saat dokumen ini disusun. Ambang batas dan tarif PPN
                    yang berlaku ditetapkan oleh Pemerintah dan dapat berubah sewaktu-waktu; mohon
                    merujuk pada kanal resmi DJP atau bertanya kepada staf toko kami untuk
                    informasi terkini pada saat pembelian Anda.
                  </p>

                  <h3 className="font-semibold text-[#0B1B3B]">4. Cara Mendapatkan Faktur Pajak di Gerai Delamibrands</h3>
                  <ol className="list-decimal space-y-1 pl-5">
                    <li>
                      Lakukan pembelian di semua gerai merek Delamibrands (tidak berlaku di bazar
                      dan department store) dan penuhi ketentuan minimum pembelian dalam satu
                      transaksi.
                    </li>
                    <li>
                      Minta Faktur Pajak kepada staf toko kami{" "}
                      <strong>pada hari yang sama dengan transaksi</strong>, kemudian isi{" "}
                      <a href="https://tax-refund.delamibrands.com/landing-page?mode=self-service" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                        formulir Pengembalian PPN untuk Turis
                      </a>{" "}
                      (Tax Refund for Tourists) dengan data diri yang benar.
                    </li>
                    <li>
                      Faktur Pajak Anda akan diterbitkan melalui Sistem Pajak DJP (Coretax) dan
                      dikirimkan ke alamat email yang Anda daftarkan, umumnya paling lambat pukul
                      23.59 (GMT +7) pada hari berikutnya. Mohon menyesuaikan waktu pengajuan
                      klaim dengan jadwal penerbangan Anda.
                    </li>
                    <li>
                      Apabila Faktur Pajak tidak dapat diterbitkan karena kendala atau
                      keterlambatan pada Sistem Pajak DJP, Delamibrands akan menginformasikan Anda
                      melalui email dan terus memantau status faktur Anda.
                    </li>
                  </ol>
                  <p className="text-xs italic text-[#0B1B3B]/55">
                    Catatan: Saat ini, program Pengembalian PPN untuk Turis hanya tersedia di
                    gerai Delamibrands di Grand Outlet Bali dan akan tersedia secara bertahap di
                    gerai Delamibrands lainnya.
                  </p>

                  <h3 className="font-semibold text-[#0B1B3B]">5. Keakuratan Informasi</h3>
                  <p>
                    Mohon pastikan seluruh informasi yang disampaikan dalam formulir permohonan
                    Tax Refund for Tourist (termasuk data paspor dan alamat email) telah lengkap
                    dan akurat. Delamibrands tidak bertanggung jawab atas Faktur Pajak yang salah,
                    tertunda, atau tidak diterbitkan akibat informasi yang tidak akurat dari
                    pelanggan, maupun akibat kendala teknis pada Sistem Pajak DJP yang berada di
                    luar kendali Delamibrands.
                  </p>

                  <h3 className="font-semibold text-[#0B1B3B]">6. Keamanan Data Pribadi</h3>
                  <p>
                    Seluruh data pribadi yang diberikan pelanggan dalam proses pengajuan Tax
                    Refund for Tourist hanya akan digunakan untuk keperluan pelaksanaan program
                    Tax Refund for Tourist sesuai dengan ketentuan peraturan perundang-undangan
                    yang berlaku di Indonesia.
                  </p>

                  <h3 className="font-semibold text-[#0B1B3B]">7. Syarat untuk Mengklaim Pengembalian PPN</h3>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>
                      Barang yang dibeli harus dibawa keluar dari Indonesia sebagai barang
                      bawaan/bagasi penumpang (bukan dikirim terpisah melalui jasa kurir atau
                      kargo).
                    </li>
                    <li>Barang harus dibawa keluar dari Indonesia dalam kurun waktu 1 (satu) bulan (30 hari kalender) sejak tanggal pembelian.</li>
                    <li>
                      Klaim hanya dapat diajukan oleh turis yang berangkat dari Indonesia melalui
                      jalur udara, di konter VAT Refund yang berada di area keberangkatan
                      internasional bandara keberangkatan. Turis yang berangkat menggunakan kapal
                      pesiar (cruise) tidak berhak mendapatkan pengembalian PPN, karena boarding
                      pass penerbangan yang sah merupakan dokumen wajib untuk pengajuan klaim.
                    </li>
                    <li>
                      Faktur Pajak tidak dapat digabungkan antar perjalanan yang berbeda. Apabila
                      seorang turis berangkat, kembali masuk ke Indonesia, berbelanja kembali,
                      lalu berangkat untuk kedua kalinya, setiap keberangkatan harus diklaim
                      secara terpisah menggunakan Faktur Pajak yang relevan dengan perjalanan
                      tersebut saja.
                    </li>
                  </ul>

                  <h3 className="font-semibold text-[#0B1B3B]">8. Cara Mengklaim di Bandara</h3>
                  <p className="font-medium text-[#0B1B3B]/90">Langkah A — Siapkan klaim Anda secara daring (sebelum menuju konter)</p>
                  <ol className="list-decimal space-y-1 pl-5">
                    <li>
                      Buka situs{" "}
                      <a href="https://vatrefundapp.pajak.go.id/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                        https://vatrefundapp.pajak.go.id/
                      </a>{" "}
                      melalui ponsel atau laptop Anda.
                    </li>
                    <li>Masuk (sign in), atau buat akun baru apabila Anda belum memilikinya.</li>
                    <li>Buka menu &quot;Refunds&quot; dan buat klaim pengembalian baru.</li>
                    <li>Isi alamat, tanggal kedatangan, dan tanggal keberangkatan Anda.</li>
                    <li>Pilih Faktur Pajak yang ingin Anda klaim.</li>
                    <li>Pilih metode pengembalian yang Anda kehendaki.</li>
                    <li>Ambil foto barang yang telah Anda beli sesuai permintaan pada aplikasi.</li>
                    <li>Klik Submit.</li>
                  </ol>
                  <p className="font-medium text-[#0B1B3B]/90">Langkah B — Kunjungi konter Pengembalian PPN (VAT Refund) di bandara</p>
                  <p>
                    Kunjungi konter VAT Refund di bandara keberangkatan Anda dan tunjukkan
                    dokumen berikut untuk keperluan verifikasi:
                  </p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Paspor Anda.</li>
                    <li>Boarding pass Anda.</li>
                    <li>Struk pembelian asli beserta Faktur Pajak terkait.</li>
                    <li>Barang yang telah dibeli, untuk keperluan pemeriksaan.</li>
                  </ul>
                  <p>
                    Apabila Faktur Pajak Anda tidak ditemukan pada sistem
                    vatrefundapp.pajak.go.id, Anda tetap dapat langsung menuju konter VAT Refund
                    dengan menunjukkan Faktur Pajak yang dikirimkan melalui email, beserta struk
                    pembelian, paspor, boarding pass, dan barang yang dibeli.
                  </p>

                  <h3 className="font-semibold text-[#0B1B3B]">9. Lokasi Konter Pengembalian PPN</h3>
                  <p>Konter VAT Refund tersedia di sejumlah bandara internasional terpilih di Indonesia, di antaranya:</p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#0B1B3B]/15 text-[#0B1B3B]">
                          <th className="py-2 pr-3 font-semibold">Bandara</th>
                          <th className="py-2 pr-3 font-semibold">Lokasi Konter</th>
                          <th className="py-2 font-semibold">Website</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#0B1B3B]/70">
                        <tr className="border-b border-[#0B1B3B]/8">
                          <td className="py-2 pr-3">Ngurah Rai, Denpasar (Bali)</td>
                          <td className="py-2 pr-3">Terminal Internasional, Lantai 3</td>
                          <td className="py-2"><a href="https://www.baliairport.com/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">www.baliairport.com</a></td>
                        </tr>
                        <tr className="border-b border-[#0B1B3B]/8">
                          <td className="py-2 pr-3">Soekarno-Hatta, Jakarta — Counter 1</td>
                          <td className="py-2 pr-3">Terminal 2F, Keberangkatan Internasional, Lantai 2</td>
                          <td className="py-2"><a href="https://soekarnohatta-airport.co.id/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">soekarnohatta-airport.co.id</a></td>
                        </tr>
                        <tr className="border-b border-[#0B1B3B]/8">
                          <td className="py-2 pr-3">Soekarno-Hatta, Jakarta — Counter 2</td>
                          <td className="py-2 pr-3">Terminal 3, Gate 1, Lantai 2</td>
                          <td className="py-2"><a href="https://soekarnohatta-airport.co.id/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">soekarnohatta-airport.co.id</a></td>
                        </tr>
                        <tr className="border-b border-[#0B1B3B]/8">
                          <td className="py-2 pr-3">Kualanamu, Medan</td>
                          <td className="py-2 pr-3">Terminal Keberangkatan, Lantai 2</td>
                          <td className="py-2"><a href="https://kualanamu-airport.co.id/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">kualanamu-airport.co.id</a></td>
                        </tr>
                        <tr className="border-b border-[#0B1B3B]/8">
                          <td className="py-2 pr-3">Juanda, Surabaya</td>
                          <td className="py-2 pr-3">Terminal 2, Lantai Dasar</td>
                          <td className="py-2"><a href="https://juanda-airport.com/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">juanda-airport.com</a></td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-3">Yogyakarta International Airport</td>
                          <td className="py-2 pr-3">Terminal Keberangkatan</td>
                          <td className="py-2"><a href="https://yogyakarta-airport.co.id/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">yogyakarta-airport.co.id</a></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h3 className="font-semibold text-[#0B1B3B]">10. Metode dan Waktu Pengembalian</h3>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>
                      Apabila total nilai pengembalian IDR 5.000.000 (lima juta rupiah) atau
                      kurang, pengembalian akan dibayarkan secara tunai dalam mata uang Rupiah
                      (IDR) di konter bandara pada tanggal keberangkatan.
                    </li>
                    <li>
                      Apabila total nilai pengembalian melebihi IDR 5.000.000, pengembalian akan
                      dilakukan melalui transfer bank dalam kurun waktu 1 (satu) bulan sejak klaim
                      diajukan, menggunakan data rekening bank yang disampaikan pelanggan pada
                      saat proses klaim.
                    </li>
                    <li>
                      Apabila nilai pengembalian melebihi IDR 5.000.000 dan pelanggan tidak
                      berkehendak menerima pembayaran melalui transfer, maka nilai yang
                      dikembalikan secara tunai hanya sebesar IDR 5.000.000, dan sisanya tidak
                      dapat dikembalikan.
                    </li>
                  </ul>
                  <div className="overflow-hidden rounded-xl border border-[#0B1B3B]/10">
                    <NextImage
                      src="/tax-refund-workflow.png"
                      alt="Easy Steps to Get Your Tax Refund"
                      width={1000}
                      height={700}
                      className="h-auto w-full object-contain"
                    />
                  </div>

                  <h3 className="font-semibold text-[#0B1B3B]">11. Catatan Penting</h3>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>
                      Gerai Delamibrands tidak dapat memberikan pengembalian tunai atau bentuk
                      kompensasi PPN dalam bentuk apa pun secara langsung di titik penjualan.
                      Seluruh klaim pengembalian PPN wajib diproses secara eksklusif melalui
                      konter VAT Refund resmi di bandara keberangkatan.
                    </li>
                    <li>
                      Delamibrands menerbitkan Faktur Pajak melalui Sistem Pajak DJP dan tidak
                      memiliki kendali langsung atas waktu pemrosesan sistem tersebut;
                      Delamibrands tidak bertanggung jawab atas keterlambatan yang disebabkan oleh
                      Sistem Pajak DJP.
                    </li>
                    <li>
                      Penerbitan Faktur Pajak tidak menjamin bahwa permohonan Tax Refund akan
                      disetujui. Keputusan akhir atas permohonan Tax Refund sepenuhnya berada pada
                      Direktorat Jenderal Pajak (DJP) melalui proses verifikasi di konter VAT
                      Refund di bandara.
                    </li>
                    <li>
                      Program ini hanya berlaku untuk pembelian di gerai merek Delamibrands yang
                      terdaftar sebagai peserta &quot;Tax Refund for Tourists&quot;. Mohon
                      konfirmasi status keikutsertaan kepada staf toko kami pada saat pembelian.
                    </li>
                    <li>
                      Delamibrands berhak untuk memperbarui Syarat &amp; Ketentuan ini dari waktu
                      ke waktu agar tetap sesuai dengan peraturan yang berlaku dari Direktorat
                      Jenderal Pajak (DJP) dan Kementerian Keuangan Republik Indonesia.
                    </li>
                  </ul>

                  <h3 className="font-semibold text-[#0B1B3B]">12. Dasar Peraturan</h3>
                  <p>
                    Program ini diselenggarakan sesuai dengan peraturan yang berlaku dari
                    Kementerian Keuangan Republik Indonesia dan Direktorat Jenderal Pajak (DJP)
                    mengenai Pengembalian Pajak Pertambahan Nilai bagi Turis (Tax Refund for
                    Tourists), sebagaimana dipublikasikan pada laman resmi DJP:{" "}
                    <a href="https://pajak.go.id/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                      pajak.go.id.
                    </a>
                  </p>

                  <h3 className="font-semibold text-[#0B1B3B]">13. Contact Us</h3>
                  <p>
                    Untuk pertanyaan mengenai Faktur Pajak Anda atau program ini, silakan hubungi
                    staf toko kami di konter, atau hubungi Layanan Pelanggan (Customer Service)
                    Delamibrands melalui email ke taxrefund@delamibrands.com. Untuk pertanyaan
                    mengenai status klaim pengembalian Anda di bandara, silakan hubungi konter VAT
                    Refund DJP secara langsung atau kunjungi{" "}
                    <a href="https://vatrefundapp.pajak.go.id/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                      vatrefundapp.pajak.go.id.
                    </a>
                  </p>
                </div>

                ) : null}
                <button
                  type="button"
                  onClick={() => setOpenPolicy(null)}
                  className={`${primaryButtonClass} mt-6`}
                >
                  Close
                </button>
              </div>
            </div>
          )}

        <main className="min-h-screen bg-[#F3F1EE] text-[#0B1B3B]">
          <div className="flex min-h-screen flex-col lg:flex-row">
            {/* Desktop sidebar — full-height image */}
            <aside className="relative hidden w-full self-start bg-[#0B0B18] lg:sticky lg:top-0 lg:block lg:h-screen lg:w-[38%]">
    <NextImage
      src="/Web.png"
      alt="Delamibrands — Premium Tax Refund Partner"
      width={800}
      height={1400}
      priority
      className="h-full w-full object-contain"
      sizes="38vw"
    />
    <p className="pointer-events-none absolute inset-x-0 bottom-[1.5%] text-center text-[10px] tracking-wide text-white/55 xl:text-xs">
      ©2026 Delamibrands. All Rights Reserved
    </p>
  </aside>

            {/* Mobile top image — natural aspect ratio, no forced crop/zoom */}
          {/* Mobile top image + luxury accents — hidden entirely on desktop (lg:hidden) */}
  <div className="relative w-full overflow-hidden lg:hidden">
    <div className="relative">
      <NextImage
        src="/Mobile.png"
        alt="Delamibrands — Premium Tax Refund Partner"
        width={800}
        height={950}
        priority
        className="h-auto w-full object-cover"
        sizes="100vw"
      />
      <p className="pointer-events-none absolute inset-x-0 top-[59%] z-10 text-center text-[9px] tracking-wide text-white/55 sm:text-xs">
        ©2026 Delamibrands. All Rights Reserved
      </p>
      {/* Soft fade so the image blends into the white form below, not a hard cut */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
    </div>

    {/* Gold accent strip — a small luxury touch tying the image to the form below */}
    <div className="relative -mt-1 flex items-center justify-center gap-3 bg-white px-6 pb-4 pt-1">
      <span className="h-px w-8 bg-[#D9B86B]" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B8944A]">
        TAX REFUND
      </span>
      <span className="h-px w-8 bg-[#D9B86B]" />
    </div>
  </div>

            <section className="flex-1 bg-white px-4 py-5 sm:px-6 lg:px-7 xl:px-10">
              <div className="mx-auto max-w-[950px] pt-3 lg:pt-6">

                {!isSelfServiceMode && (
                  <div className="mt-7">
                    <LandingStepProgress currentStep={step} onStepSelect={handleStepSelect} />
                  </div>
                )}

                {/* Active site info when SA opens an existing customer from the dashboard. */}
                {isSaProcessingMode && (selectedStoreCode || getActiveStoreName()) && (
                  <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                    <strong>Site aktif:</strong>
                    <span className="font-semibold">{getActiveStoreName() || "Unknown store"}</span>
                    <span className="text-xs text-muted-foreground">({selectedStoreCode || getActiveStoreCode() || "-"})</span>
                  </div>
                )}

                <div className={isSelfServiceMode ? "mt-6 rounded-[24px] border border-[#0B1B3B]/10 bg-white p-4 shadow-[0_18px_40px_rgba(11,27,59,0.04)] sm:mt-8 sm:rounded-[30px] sm:p-6 lg:p-7" : "mt-6 rounded-[24px] border border-[#0B1B3B]/10 bg-white p-4 shadow-[0_18px_40px_rgba(11,27,59,0.04)] sm:mt-8 sm:rounded-[30px] sm:p-6 lg:p-7"}>
                  <section className="min-w-0">
                  {step === "customer" && (
                    isSaProcessingMode && customer ? (
                      <div className="space-y-6">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0B1B3B]/45">
                            Customer details
                          </div>
                          <h2 className="mt-2 font-serif text-[2rem] leading-[1.05] tracking-[-0.05em] text-[#0B1B3B] sm:text-[2.6rem]">
                            Review customer data
                          </h2>
                          <p className="mt-2 text-sm leading-6 text-[#0B1B3B]/60">
                            This information was submitted by the customer and is shown for verification only.
                          </p>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-[#0B1B3B]/10 bg-white">
                          {[
                            { label: "Full name", value: customer.fullName },
                            { label: "Passport number", value: customer.passportNumber },
                            { label: "Email", value: customer.email },
                            { label: "Address", value: customer.address },
                            {
                              label: "Nationality",
                              value: findCountryByValue(customer.nationality)?.nama ?? customer.nationality,
                            },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="border-b border-[#0B1B3B]/8 px-4 py-4 last:border-b-0 sm:grid sm:grid-cols-[180px_1fr] sm:gap-6"
                            >
                              <div className="text-xs font-medium uppercase tracking-[0.1em] text-[#0B1B3B]/45">
                                {item.label}
                              </div>
                              <div className="mt-1 break-words text-sm font-medium text-[#0B1B3B] sm:mt-0">
                                {item.value || "-"}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-800">
                          Customer data is read-only. Continue to the Invoice step to process this submission.
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setStep("invoice-search")}
                            className={primaryButtonClass}
                          >
                            Continue to invoice
                            <ArrowRight className="size-4" />
                          </button>
                        </div>
                      </div>
                    ) : isCustomerReviewing ? (
                      <div className="space-y-6">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0B1B3B]/45">
                            Final review
                          </div>
                          <h2 className="mt-2 font-serif text-[2rem] leading-[1.05] tracking-[-0.05em] text-[#0B1B3B] sm:text-[2.6rem]">
                            Check your details
                          </h2>
                          <p className="mt-2 text-sm leading-6 text-[#0B1B3B]/60">
                            Make sure every detail matches your passport before submitting.
                          </p>
                        </div>

                        {passportPreviewUrl && (
                          <div className="overflow-hidden rounded-2xl border border-[#0B1B3B]/10 bg-[#F8F7F4]">
                            <div
                              role="img"
                              aria-label="Selected passport preview"
                              className="h-52 w-full bg-contain bg-center bg-no-repeat sm:h-64"
                              style={{ backgroundImage: `url(${passportPreviewUrl})` }}
                            />
                          </div>
                        )}

                        {ocrDetectedFields && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                            Some fields were filled from OCR. Please compare them carefully with the passport image.
                          </div>
                        )}

                        <div className="overflow-hidden rounded-2xl border border-[#0B1B3B]/10">
                          {[
                            {
                              label: "Full name",
                              value: form.fullName,
                              detected: Boolean(ocrDetectedFields?.fullName),
                            },
                            {
                              label: "Passport number",
                              value: form.passportNumber,
                              detected: Boolean(ocrDetectedFields?.passportNumber),
                            },
                            { label: "Email", value: form.email, detected: false },
                            { label: "Address", value: form.address, detected: false },
                            {
                              label: "Nationality",
                              value: findCountryByValue(form.nationality)?.nama ?? form.nationality,
                              detected: Boolean(ocrDetectedFields?.nationality),
                            },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="border-b border-[#0B1B3B]/8 px-4 py-3.5 last:border-b-0 sm:flex sm:items-start sm:justify-between sm:gap-6"
                            >
                              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-[#0B1B3B]/45">
                                {item.label}
                                {item.detected && (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold tracking-normal text-emerald-700">
                                    OCR
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 break-words text-sm font-medium text-[#0B1B3B] sm:mt-0 sm:max-w-[60%] sm:text-right">
                                {item.value || "-"}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                          Terms and data-processing consent accepted. Your data will only be sent after you confirm below.
                        </div>

                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={() => setIsCustomerReviewing(false)}
                            disabled={isSubmitting}
                            className={secondaryButtonClass}
                          >
                            Edit data
                          </button>
                          <button
                            type="button"
                            onClick={createCustomer}
                            disabled={isSubmitting}
                            className={primaryButtonClass}
                          >
                            {isSubmitting ? "Submitting..." : "Confirm & submit"}
                            {!isSubmitting && <ArrowRight className="size-4" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                    <>
                      <div className="mb-6 text-center sm:mb-7 sm:text-left">
                      <h2 className="font-serif text-[2rem] leading-[1.05] tracking-[-0.06em] text-[#0B1B3B] sm:text-[2.8rem]">
                          Let&apos;s get to know you
                        </h2>
                        <p className="mt-2 text-sm text-[#0B1B3B]/60">
                          Provide your details as they appear in your passport.
                        </p>
                      </div>

                      <div className="mb-5 rounded-2xl border border-dashed border-[#0B1B3B]/15 bg-[#F8F7F4] p-3 sm:p-4">
                      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#0B1B3B]/50">
                              Passport photo
                            </div>
                            <p className="mt-1 text-sm text-[#0B1B3B]/70">
                              Upload the passport page to help auto-fill the main fields.
                            </p>
                          </div>
                          <label className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-[#0B1B3B] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-[#0B1B3B]/90 sm:w-auto">
                            {passportPreviewUrl ? "Change file" : "Choose file"}
                            <input type="file" accept="image/*" onChange={handlePassportUpload} className="hidden" />
                          </label>
                        </div>

                        {passportPreviewUrl && (
                          <div className="mt-3 overflow-hidden rounded-xl border border-[#0B1B3B]/10 bg-white p-2">
                            <div
                              role="img"
                              aria-label="Selected passport preview"
                              className="h-44 w-full rounded-lg bg-contain bg-center bg-no-repeat sm:h-56"
                              style={{ backgroundImage: `url(${passportPreviewUrl})` }}
                            />
                          </div>
                        )}

                        {(ocrStatus === "running" || ocrError || ocrDetectedFields) && (
                          <div className="mt-3 rounded-xl border border-[#0B1B3B]/10 bg-white px-3 py-2 text-xs text-[#0B1B3B]/70">
                            {ocrStatus === "running" && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                  <span>Reading passport text…</span>
                                  <span className="font-semibold text-[#0B1B3B]">{ocrProgress}%</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-[#0B1B3B]/10">
                                  <div
                                    className="h-full rounded-full bg-[#0B1B3B] transition-[width] duration-300"
                                    style={{ width: `${ocrProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            {ocrError && <span className="text-red-600">{ocrError}</span>}
                            {ocrDetectedFields && !ocrError && (
                              <div className="flex flex-wrap gap-1.5">
                                {ocrDetectedFields.fullName && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-medium text-emerald-700">Name detected</span>}
                                {ocrDetectedFields.passportNumber && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-medium text-emerald-700">Passport detected</span>}
                                {ocrDetectedFields.nationality && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-medium text-emerald-700">Nationality detected</span>}
                                {ocrDetectedFields.dateOfBirth && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-medium text-amber-700">DOB detected</span>}
                                {ocrDetectedFields.expiryDate && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-medium text-amber-700">Expiry detected</span>}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                          Please review the auto-filled data carefully before continuing. If anything looks incorrect, please update it manually.
                        </div>
                      </div>
  
                      {/* Single-column, vertically stacked form. */}
                      <div className="flex flex-col gap-5">
                        <label className="space-y-1.5">
                          <span className="block text-sm font-medium text-[#0B1B3B]/75">Full name</span>
                          <input
                            value={form.fullName}
                            onChange={(e) => handleChange("fullName", e.target.value)}
                            onFocus={() => setActiveField("fullName")}
                            onBlur={() => setActiveField((prev) => (prev === "fullName" ? null : prev))}
                            aria-invalid={Boolean(fieldErrors.fullName)}
                            className={`${fieldClass} ${fieldErrors.fullName ? "border-red-500 focus:border-red-500" : ""}`}
                            placeholder="e.g. Amanda Wijaya"
                          />
                          {activeField === "fullName" && !fieldErrors.fullName && (
                            <p className={helperTextClass}>{fieldHelperText.fullName}</p>
                          )}
                          {fieldErrors.fullName && (
                            <p className="text-xs text-red-600">{fieldErrors.fullName}</p>
                          )}
                        </label>

                        <label className="space-y-1.5">
                          <span className="block text-sm font-medium text-[#0B1B3B]/75">Passport number</span>
                          <input
                            value={form.passportNumber}
                            onChange={(e) => handleChange("passportNumber", e.target.value)}
                            onFocus={() => setActiveField("passportNumber")}
                            onBlur={() => setActiveField((prev) => (prev === "passportNumber" ? null : prev))}
                            aria-invalid={Boolean(fieldErrors.passportNumber)}
                            className={`${fieldClass} ${fieldErrors.passportNumber ? "border-red-500 focus:border-red-500" : ""}`}
                            placeholder="e.g. P1234567"
                          />
                          {activeField === "passportNumber" && !fieldErrors.passportNumber && (
                            <p className={helperTextClass}>{fieldHelperText.passportNumber}</p>
                          )}
                          {fieldErrors.passportNumber && (
                            <p className="text-xs text-red-600">{fieldErrors.passportNumber}</p>
                          )}
                        </label>

                        <label className="space-y-1.5">
                          <span className="block text-sm font-medium text-[#0B1B3B]/75">Email</span>
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            onFocus={() => setActiveField("email")}
                            onBlur={() => setActiveField((prev) => (prev === "email" ? null : prev))}
                            aria-invalid={Boolean(fieldErrors.email)}
                            className={`${fieldClass} ${fieldErrors.email ? "border-red-500 focus:border-red-500" : ""}`}
                            placeholder="e.g. amanda.wijaya@example.com"
                          />
                          {activeField === "email" && !fieldErrors.email && (
                            <p className={helperTextClass}>{fieldHelperText.email}</p>
                          )}
                          {fieldErrors.email && (
                            <p className="text-xs text-red-600">{fieldErrors.email}</p>
                          )}
                        </label>

                        <label className="space-y-1.5">
                          <span className="block text-sm font-medium text-[#0B1B3B]/75">Address</span>
                          <textarea
                            value={form.address}
                            onChange={(e) => handleChange("address", e.target.value)}
                            rows={3}
                            onFocus={() => setActiveField("address")}
                            onBlur={() => setActiveField((prev) => (prev === "address" ? null : prev))}
                            aria-invalid={Boolean(fieldErrors.address)}
                            className={`${fieldClass} ${fieldErrors.address ? "border-red-500 focus:border-red-500" : ""}`}
                            placeholder="e.g. 12 Merdeka Street, Central Jakarta"
                          />
                          {activeField === "address" && !fieldErrors.address && (
                            <p className={helperTextClass}>{fieldHelperText.address}</p>
                          )}
                          {fieldErrors.address && (
                            <p className="text-xs text-red-600">{fieldErrors.address}</p>
                          )}
                        </label>

                        <label className="space-y-1.5">
                          <span className="block text-sm font-medium text-[#0B1B3B]/75">Nationality</span>
                          {fieldErrors.nationality && (
                            <p className="text-xs text-red-600">{fieldErrors.nationality}</p>
                          )}
                          <div className="flex flex-col items-stretch gap-1">
                            {activeField === "nationality" && !fieldErrors.nationality && (
                              <p className={helperTextSideClass}>{fieldHelperText.nationality}</p>
                            )}
                            <div
                              className={`w-full ${fieldErrors.nationality ? "rounded-xl border border-red-500" : ""}`}
                              onFocus={() => setActiveField("nationality")}
                              onBlur={() => setActiveField((prev) => (prev === "nationality" ? null : prev))}
                              onMouseDown={() => setActiveField("nationality")}
                            >
                              <NegaraCombobox
                                locale="en"
                                value={findCountryByValue(form.nationality)?.kode ?? ""}
                                onChange={handleNegaraChange}
                              />
                            </div>
                          </div>
                        </label>
                      </div>

                      <div className="mt-6 rounded-xl border border-[#0B1B3B]/10 bg-[#FAFAF8] p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          
                        </div>

                        <label className="flex items-start gap-3 text-sm leading-5 text-[#0B1B3B]/75">
                          <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(event) => setTermsAccepted(event.target.checked)}
                            className="mt-1 size-4 shrink-0 accent-[#0B1B3B]"
                          />
                          <span>
                            {consentLanguage === "en" ? (
                              <>
                                 By submitting the data on this form, you consent to the processing of your personal data by Delamibrands exclusively for issuing the Tourist Tax Invoice and reporting to the Directorate General of Taxes (DGT), in accordance with applicable Personal Data Protection laws in Indonesia. By submitting this form, you confirm that you have read and agree to the {" "}
                                <button type="button" onClick={() => setOpenPolicy("terms")} className="font-semibold underline">
                                  Terms and Conditions
                                </button>
                                .
                              </>
                            ) : (
                              <>
                                Dengan menyerahkan data pada formulir ini, Anda menyetujui pemrosesan data pribadi Anda oleh Delamibrands khusus untuk penerbitan Faktur Pajak Turis dan pelaporan kepada Direktorat Jenderal Pajak (DJP), sesuai dengan UU Perlindungan Data Pribadi yang berlaku di Indonesia. Dengan menyerahkan formulir ini, Anda menyatakan telah membaca dan menyetujui{" "}
                                <button type="button" onClick={() => setOpenPolicy("terms")} className="font-semibold underline">
                                  Syarat dan Ketentuan
                                </button>
                                .
                              </>
                            )}
                          </span>
                        </label>
                        <label className="mt-3 flex shrink-0 justify-end text-xs font-medium text-[#0B1B3B]/60">
                          <span className="sr-only">Consent language</span>
                          <select
                            value={consentLanguage}
                            onChange={(event) => setConsentLanguage(event.target.value as "id" | "en")}
                            className="rounded-lg border border-[#0B1B3B]/15 bg-white px-2.5 py-1.5 text-xs text-[#0B1B3B] outline-none focus:border-[#0B1B3B]/40"
                            aria-label="Consent language"
                          >
                            <option value="id">Indonesia</option>
                            <option value="en">English</option>
                          </select>
                        </label>
                      </div>

                      {termsAccepted && (
                        <button
                          type="button"
                          onClick={openCustomerReview}
                          disabled={isSubmitting}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1B3B] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_25px_-10px_rgba(11,27,59,0.55)] transition hover:bg-[#0B1B3B]/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                          Review data
                          <ArrowRight className="size-4" />
                        </button>
                      )}
                    </>
                    )
                  )}

                  {step === "invoice-search" && (
                    <div className="space-y-6">
                      <div className="rounded-xl border border-[#0B1B3B]/10 p-4 text-sm">
                        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#0B1B3B]/40">
                          Active customer
                        </div>
                        <div className="mt-1.5 text-base font-semibold">{customer?.fullName}</div>
                        <div className="min-w-0 break-words text-[#0B1B3B]/55">{customer?.email}</div>
                        <div className="text-[#0B1B3B]/55">
                          {customer?.passportNumber} · {countryCode(customer?.nationality)}
                        </div>
                      </div>

                      {invoiceQueue.length > 0 && (
                        <div className="rounded-xl border border-dashed border-[#0B1B3B]/15 bg-[#FAFAF8] p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#0B1B3B]/40">
                              Invoice list
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setInvoiceQueue([]);
                                  setActiveQueuedInvoiceId(null);
                                  setPreview(null);
                                  setInvoiceNo("");
                                  setSelectedStoreCode(getActiveStoreCode() ?? "");
                                  setResolvedInvoiceKey("");
                                  setShowInvoiceFinder(true);
                                }}
                                className="text-xs font-medium text-[#0B1B3B]/60 transition hover:text-[#0B1B3B]"
                              >
                                Remove invoice
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {invoiceQueue.map((item) => {
                              const isActive = item.id === activeQueuedInvoiceId;

                              return (
                                <div
                                  key={item.id}
                                  className={`overflow-hidden rounded-xl border ${
                                    isActive
                                      ? "border-[#0B1B3B] bg-[#0B1B3B]/5"
                                      : "border-[#0B1B3B]/10 bg-white"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 p-3">
                                    <button
                                      type="button"
                                      onClick={() => openQueuedInvoice(item.id)}
                                      className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left text-sm"
                                    >
                                      <div className="min-w-0">
                                        <div className="truncate font-medium text-[#0B1B3B]">{item.noInvoice}</div>
                                        <div className="truncate text-[#0B1B3B]/55">
                                          {item.storeName || item.storeCode}
                                          <span className="ml-1 text-[#0B1B3B]/40">({item.storeCode})</span>
                                        </div>
                                      </div>
                                      <span
                                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${
                                          isActive
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                            : "border-[#0B1B3B]/10 bg-white text-[#0B1B3B]/70 hover:border-[#0B1B3B]/20"
                                        }`}
                                      >
                                        {isActive ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                      </span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeQueuedInvoice(item.id)}
                                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                      aria-label="Remove invoice"
                                    >
                                      <Trash2 className="size-4" />
                                    </button>
                                  </div>
                                  {item.preview?.alreadyExists && (
                                    <div className="border-t border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                      This invoice has already been used for this store and cannot be submitted again.
                                    </div>
                                  )}

                                  {isActive && item.preview && (
                                    <div className="border-t border-[#0B1B3B]/10 bg-white/60 p-3 text-sm text-[#0B1B3B]/75">
                                      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#0B1B3B]/40">
                                        Details
                                      </div>
                                      <div className="space-y-1.5">
                                        <div className="flex items-center justify-between gap-3">
                                          <span className="text-[#0B1B3B]/55">Invoice</span>
                                          <span className="font-medium">{item.preview.receiptNo}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                          <span className="text-[#0B1B3B]/55">Date</span>
                                          <span>{formatApiDateOnly(item.preview.transDate)}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                          <span className="text-[#0B1B3B]/55">Subtotal</span>
                                          <span>{formatAmount(Number(item.preview.subtotal ?? 0))}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                          <span className="text-[#0B1B3B]/55">Items</span>
                                          <span>{item.preview.itemCount}</span>
                                        </div>
                                      </div>
                                      <div className="mt-3 border-t border-[#0B1B3B]/8 pt-3">
                                        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#0B1B3B]/40">
                                          Item list
                                        </div>
                                        <div className="space-y-2">
                                          {(item.preview.items ?? []).map((purchase, index) => (
                                            <div
                                              key={`${purchase.namaBrg}-${index}`}
                                              className="flex items-center justify-between gap-3 border-b border-[#0B1B3B]/8 pb-2 last:border-0 last:pb-0"
                                            >
                                              <span className="min-w-0 break-words text-[#0B1B3B]/75">{purchase.namaBrg}</span>
                                              <span className="shrink-0 font-medium text-[#0B1B3B]">
                                                {formatAmount(Number(purchase.hargaTotal ?? 0))}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={submitQueuedInvoice}
                              disabled={isSubmitting || hasQueuedDuplicates}
                              className={primaryButtonClass}
                            >
                              {isSubmitting
                                ? "Submitting..."
                                : hasQueuedDuplicates
                                  ? "Remove used invoice"
                                  : "Submit invoice"}
                            </button>
                          </div>
                        </div>
                      )}

                      {(!invoiceQueue.length || showInvoiceFinder) && (
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-[#0B1B3B]/80">Invoice number</label>
                          <input
                            value={invoiceNo}
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              if (nextValue.trim().toLowerCase() !== invoiceNo.trim().toLowerCase()) {
                                setResolvedInvoiceKey("");
                                if (!isSaProcessingMode) {
                                  setSelectedStoreCode("");
                                } else {
                                  const active = getActiveStoreCode();
                                  if (active) setSelectedStoreCode(active);
                                }
                                setPreview(null);
                              }
                              setInvoiceNo(nextValue);
                              setNotice(null, "info");
                            }}
                            placeholder="Enter invoice number"
                            className={fieldClass}
                          />
                        </div>
                      )}

                      {(!isSaProcessingMode || !selectedStoreCode) && preview && preview.availableStoreCodes && preview.availableStoreCodes.length > 1 && (
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-[#0B1B3B]/80">
                            Select site code
                          </label>
                          <select
                            key={`store-select-${preview.receiptNo ?? invoiceNo ?? "empty"}`}
                            value={selectedStoreCode || ""}
                            onChange={async (e) => {
                              const code = e.target.value;
                              if (!code) {
                                setSelectedStoreCode("");
                                setResolvedInvoiceKey("");
                                setNotice("Please select the matching site before continuing.", "warning");
                                return;
                              }

                              setSelectedStoreCode(code);
                              setResolvedInvoiceKey("");

                              try {
                                setIsSubmitting(true);
                                setNotice(null, "info");
                                const noInv = (invoiceNo || preview.receiptNo || "").trim();
                                const data = await apiPreviewCegid(code, noInv);
                                setPreview(data);
                                setSelectedStoreCode(code);
                                setResolvedInvoiceKey(`${noInv.toLowerCase()}|${code.toLowerCase()}`);
                                setForm((prev) => ({
                                  ...prev,
                                  address: prev.address || customer?.address || data.address || "",
                                }));
                                setStep("invoice-confirm");
                              } catch (error) {
                                const previewError = error instanceof Error ? error.message : "Unable to load store-specific preview.";
                                setNotice(previewError, "error");
                              } finally {
                                setIsSubmitting(false);
                              }
                            }}
                            className={fieldClass}
                          >
                            <option value="">Choose a site</option>
                            {(preview.storeOptions && preview.storeOptions.length > 0
                              ? preview.storeOptions
                              : preview.availableStoreCodes.map((code) => ({
                                  storeCode: code,
                                  storeName: "",
                                  itemCount: preview.itemCount,
                                  subtotal: preview.subtotal,
                                })))
                              .map((option) => {
                                const label = `${option.storeName || `Site ${option.storeCode}`} (${option.storeCode}) — ${preview.receiptNo || invoiceNo} — ${formatAmount(Number(option.subtotal ?? 0))}`;
                                return (
                                  <option key={option.storeCode} value={option.storeCode}>
                                    {label}
                                  </option>
                                );
                              })}
                          </select>
                        </div>
                      )}

                      {(!invoiceQueue.length || showInvoiceFinder) && (
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap">
                          <button type="button" onClick={() => setStep("customer")} className={secondaryButtonClass}>
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={handlePreviewInvoice}
                            disabled={isSubmitting}
                            className={primaryButtonClass}
                          >
                            {isSubmitting ? "Searching..." : "Find invoice"}
                            <ArrowRight className="size-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {step === "invoice-confirm" && preview && (
                    <div className="space-y-6">
                      {invoiceQueue.length > 0 && (
                        <div className="rounded-xl border border-dashed border-[#0B1B3B]/15 bg-[#FAFAF8] p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#0B1B3B]/40">
                              Invoice list
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setInvoiceQueue([]);
                                  setActiveQueuedInvoiceId(null);
                                  setPreview(null);
                                  setInvoiceNo("");
                                  setSelectedStoreCode(getActiveStoreCode() ?? "");
                                  setResolvedInvoiceKey("");
                                  setStep("invoice-search");
                                }}
                                className="text-xs font-medium text-[#0B1B3B]/60 transition hover:text-[#0B1B3B]"
                              >
                                Remove invoice
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {invoiceQueue.map((item) => {
                              const isActive = item.id === activeQueuedInvoiceId;

                              return (
                                <div
                                  key={item.id}
                                  className={`overflow-hidden rounded-xl border ${
                                    isActive
                                      ? "border-[#0B1B3B] bg-[#0B1B3B]/5"
                                      : "border-[#0B1B3B]/10 bg-white"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 p-3">
                                    <button
                                      type="button"
                                      onClick={() => openQueuedInvoice(item.id)}
                                      className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left text-sm"
                                    >
                                      <div className="min-w-0">
                                        <div className="truncate font-medium text-[#0B1B3B]">{item.noInvoice}</div>
                                        <div className="truncate text-[#0B1B3B]/55">
                                          {item.storeName || item.storeCode}
                                          <span className="ml-1 text-[#0B1B3B]/40">({item.storeCode})</span>
                                        </div>
                                      </div>
                                      <span
                                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${
                                          isActive
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                            : "border-[#0B1B3B]/10 bg-white text-[#0B1B3B]/70 hover:border-[#0B1B3B]/20"
                                        }`}
                                      >
                                        {isActive ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                      </span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeQueuedInvoice(item.id)}
                                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                      aria-label="Remove invoice"
                                    >
                                      <Trash2 className="size-4" />
                                    </button>
                                  </div>
                                  {item.preview?.alreadyExists && (
                                    <div className="border-t border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                      This invoice has already been used for this store and cannot be submitted again.
                                    </div>
                                  )}

                                  {isActive && item.preview && (
                                    <div className="border-t border-[#0B1B3B]/10 bg-white/60 p-3 text-sm text-[#0B1B3B]/75">
                                      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#0B1B3B]/40">
                                        Details
                                      </div>
                                      <div className="space-y-1.5">
                                        <div className="flex items-center justify-between gap-3">
                                          <span className="text-[#0B1B3B]/55">Invoice</span>
                                          <span className="font-medium">{item.preview.receiptNo}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                          <span className="text-[#0B1B3B]/55">Date</span>
                                          <span>{formatApiDateOnly(item.preview.transDate)}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                          <span className="text-[#0B1B3B]/55">Subtotal</span>
                                          <span>{formatAmount(Number(item.preview.subtotal ?? 0))}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                          <span className="text-[#0B1B3B]/55">Items</span>
                                          <span>{item.preview.itemCount}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:justify-between">
                            <button
                              type="button"
                              onClick={() => setStep("invoice-search")}
                              className={secondaryButtonClass}
                            >
                              Find invoice
                            </button>
                            <button
                              type="button"
                              onClick={submitQueuedInvoice}
                              disabled={isSubmitting || hasQueuedDuplicates || (!isSaProcessingMode && !termsAccepted)}
                              className={primaryButtonClass}
                            >
                              {isSubmitting
                                ? "Submitting..."
                                : hasQueuedDuplicates
                                  ? "Remove used invoice"
                                  : "Submit invoice"}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="rounded-xl border border-[#0B1B3B]/10 p-4">
                        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#0B1B3B]/40">
                          Invoice found
                        </div>
                        <div className="mt-1.5 break-all text-lg font-semibold sm:text-xl">{preview.receiptNo}</div>
                        <div className="mt-0.5 text-sm text-[#0B1B3B]/50">
                          Date: {formatApiDateOnly(preview.transDate)}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-[#0B1B3B]/10 p-4">
                          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#0B1B3B]/40">
                            Buyer
                          </div>
                          <div className="mt-1.5 min-w-0 break-words font-semibold">{customer?.fullName}</div>
                          <div className="min-w-0 break-all text-sm text-[#0B1B3B]/55">{customer?.email}</div>
                          <div className="text-sm text-[#0B1B3B]/55">{customer?.nationality}</div>
                          <div className="text-sm text-[#0B1B3B]/55">{customer?.passportNumber}</div>
                          <div className="mt-3 border-t border-[#0B1B3B]/8 pt-3 text-sm text-[#0B1B3B]/70">
                            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#0B1B3B]/40">
                              Buyer address
                            </div>
                            <div className="mt-1 whitespace-pre-wrap">
                              {form.address || customer?.address || preview?.address || "-"}
                            </div>
                          </div>
                        </div>
                        <div className="rounded-xl border border-[#0B1B3B]/10 p-4">
                          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#0B1B3B]/40">
                            Summary
                          </div>
                          <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="text-[#0B1B3B]/55">Item count</span>
                            <span className="font-medium">{preview.itemCount}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="text-[#0B1B3B]/55">Subtotal</span>
                            <span className="font-medium">{formatAmount(Number(preview.subtotal ?? 0))}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="text-[#0B1B3B]/55">Store</span>
                            <span className="font-medium">{preview.storeCode || "-"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-[#0B1B3B]/10 p-4">
                        <div className="mb-3 text-sm font-medium">Item list</div>
                        <div className="space-y-2 text-sm text-[#0B1B3B]/65">
                          {preview.items.map((item, index) => (
                            <div
                              key={`${item.namaBrg}-${index}`}
                              className="flex flex-col gap-1 border-b border-[#0B1B3B]/8 pb-2 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                            >
                              <span className="min-w-0 break-words">{item.namaBrg}</span>
                              <span className="shrink-0 font-medium text-[#0B1B3B]">
                                {formatAmount(Number(item.hargaTotal ?? 0))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {preview?.alreadyExists && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          This invoice has already been used for store {preview.storeCode || selectedStoreCode || "selected"}. Submission is blocked to prevent duplicates.
                        </div>
                      )}

                      {invoiceQueue.length > 0 && (
                        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                          The selected invoice is already in the list. Remove it before submitting.
                        </div>
                      )}

                      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap">
                        <button
                          type="button"
                          onClick={invoiceQueue.length > 0 ? submitQueuedInvoice : handleSubmitInvoice}
                          disabled={isSubmitting || Boolean(preview?.alreadyExists) || hasQueuedDuplicates || (!isSaProcessingMode && !termsAccepted)}
                          className={primaryButtonClass}
                        >
                          {isSubmitting
                            ? "Saving..."
                            : invoiceQueue.length > 0
                              ? "Submit invoice"
                              : preview?.alreadyExists || hasQueuedDuplicates
                                ? "Submit blocked"
                                : "Submit invoice"}
                          {!preview?.alreadyExists && !isSubmitting && <ArrowRight className="size-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {step === "success" && (
                    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[28px] border border-[#0B1B3B]/10 bg-[#FAFAF8] p-6 text-center sm:min-h-[320px] sm:p-8">
                      <div className="mb-5 flex h-36 w-36 items-center justify-center rounded-full border-[10px] border-[#2B2F35] bg-[#F2F2F0] shadow-[inset_0_0_0_1px_rgba(11,27,59,0.02)]">
                        <CheckCircle2 className="size-20 text-[#2BB673] drop-shadow-[0_0_0_rgba(0,0,0,0)]" />
                      </div>
                      <h3 className="font-serif text-[2rem] leading-none tracking-[-0.06em] text-[#0B1B3B] sm:text-[2.4rem]">
                        {isSelfServiceMode ? "Your details are recorded" : "Tax refund submitted"}
                      </h3>
                      <p className="mt-3 max-w-md text-sm leading-6 text-[#0B1B3B]/60 sm:text-base">
                        {isSelfServiceMode
                          ? "Your customer information has been saved successfully. Our SA team will review and continue the process from the dashboard."
                          : "Your invoice has been recorded successfully and is ready for the next processing stage."}
                      </p>
                      <div className="mt-7 flex w-full justify-center">
                        <button type="button" onClick={resetFlow} className={primaryButtonClass}>
                          {isSelfServiceMode ? "Submit another request" : "BACK"}
                        </button>
                      </div>
                    </div>
                  )}
                  </section>
                </div>
              </div>
            </section>
          </div>
        </main>
      </>
    );
  }
