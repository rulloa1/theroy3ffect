import { Link } from "@tanstack/react-router";

interface SmsConsentProps {
  smsService: boolean;
  smsMarketing: boolean;
  onChange: (field: "smsService" | "smsMarketing", value: boolean) => void;
  className?: string;
}

/**
 * A2P 10DLC consent capture. Both boxes are optional and default to unchecked;
 * the disclosure line below them is always visible.
 */
export function SmsConsent({
  smsService,
  smsMarketing,
  onChange,
  className = "",
}: SmsConsentProps) {
  return (
    <div className={`space-y-4 border-t border-border pt-6 ${className}`}>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="smsService"
          checked={smsService}
          onChange={(e) => onChange("smsService", e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <span className="font-sans text-[15px] leading-[1.6] text-muted-foreground">
          Text me about my project — appointment confirmations, reminders, and updates from The
          Roy Effect. Message frequency varies. Message and data rates may apply. Reply STOP to opt
          out, HELP for help.
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="smsMarketing"
          checked={smsMarketing}
          onChange={(e) => onChange("smsMarketing", e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <span className="font-sans text-[15px] leading-[1.6] text-muted-foreground">
          Text me occasional offers and news from The Roy Effect. Consent is not a condition of
          purchase. Message frequency varies. Message and data rates may apply. Reply STOP to opt
          out, HELP for help.
        </span>
      </label>

      <p className="font-sans text-[15px] leading-[1.6] text-muted-foreground">
        By submitting this form you agree to our{" "}
        <Link to="/privacy" className="underline hover:text-primary">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link to="/terms" className="underline hover:text-primary">
          Terms of Service
        </Link>
        . The Roy Effect will not share your mobile information with third parties or affiliates
        for marketing or promotional purposes.
      </p>
    </div>
  );
}
