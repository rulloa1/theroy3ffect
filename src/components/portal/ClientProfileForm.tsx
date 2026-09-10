import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  CONTACT_METHODS,
  getMyProfile,
  saveMyProfile,
  type ClientProfile,
} from "@/utils/portal.functions";

const inputClass =
  "w-full border border-white/15 bg-black/40 px-3 py-2.5 font-mono text-xs text-white placeholder:text-white/25 focus:border-[#FF3333] focus:outline-none";
const labelClass = "mb-2 block font-mono text-[10px] tracking-widest text-white/40";

type FormState = {
  full_name: string;
  company: string;
  phone: string;
  website: string;
  city: string;
  time_zone: string;
  preferred_contact: (typeof CONTACT_METHODS)[number];
  notes: string;
};

const emptyForm: FormState = {
  full_name: "",
  company: "",
  phone: "",
  website: "",
  city: "",
  time_zone: "",
  preferred_contact: "email",
  notes: "",
};

function fromProfile(profile: ClientProfile): FormState {
  return {
    full_name: profile.full_name ?? "",
    company: profile.company ?? "",
    phone: profile.phone ?? "",
    website: profile.website ?? "",
    city: profile.city ?? "",
    time_zone: profile.time_zone ?? "",
    preferred_contact:
      (CONTACT_METHODS as readonly string[]).indexOf(profile.preferred_contact) >= 0
        ? (profile.preferred_contact as FormState["preferred_contact"])
        : "email",
    notes: profile.notes ?? "",
  };
}

export function ClientProfileForm({ email }: { email: string }) {
  const fetchProfile = useServerFn(getMyProfile);
  const save = useServerFn(saveMyProfile);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["client-profile"],
    queryFn: () => fetchProfile(),
  });

  useEffect(() => {
    if (data?.profile) setForm(fromProfile(data.profile));
  }, [data]);

  const onboarded = Boolean(data?.profile.onboarding_completed_at);

  const mutation = useMutation({
    mutationFn: () => save({ data: { ...form, complete_onboarding: true } }),
    onSuccess: async () => {
      toast.success(onboarded ? "Details updated." : "Thanks — your details are saved.");
      await queryClient.invalidateQueries({ queryKey: ["client-profile"] });
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Couldn't save your details."),
  });

  if (isLoading) {
    return <p className="font-mono text-xs text-white/40">Loading your details…</p>;
  }

  if (isError) {
    return (
      <div className="border border-[#FF3333]/40 bg-[#FF3333]/5 p-6">
        <p className="font-mono text-xs tracking-widest text-[#FF3333]">
          COULDN&apos;T LOAD YOUR DETAILS
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 border border-white/20 px-4 py-2 font-mono text-[11px] tracking-widest text-white/80 hover:border-white/50 hover:text-white"
        >
          TRY AGAIN
        </button>
      </div>
    );
  }

  const set = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }) as FormState);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!form.full_name.trim()) {
          toast.error("Your name is required.");
          return;
        }
        mutation.mutate();
      }}
      className="border border-white/10 bg-white/[0.02] p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl uppercase text-white">
            {onboarded ? "Your details" : "Welcome — tell us about you"}
          </h2>
          <p className="mt-1 font-mono text-[11px] text-white/40">
            {email ? `Account email: ${email}` : "Keep your contact details current."}
          </p>
        </div>
        {onboarded ? (
          <span className="border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] tracking-widest text-emerald-400">
            ONBOARDED
          </span>
        ) : (
          <span className="border border-[#FF3333]/50 bg-[#FF3333]/10 px-3 py-1 font-mono text-[10px] tracking-widest text-[#FF3333]">
            ONBOARDING
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="profile-name">
            FULL NAME *
          </label>
          <input
            id="profile-name"
            className={inputClass}
            value={form.full_name}
            onChange={(e) => set("full_name")(e.target.value)}
            maxLength={120}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="profile-company">
            COMPANY
          </label>
          <input
            id="profile-company"
            className={inputClass}
            value={form.company}
            onChange={(e) => set("company")(e.target.value)}
            maxLength={160}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="profile-phone">
            PHONE
          </label>
          <input
            id="profile-phone"
            type="tel"
            className={inputClass}
            value={form.phone}
            onChange={(e) => set("phone")(e.target.value)}
            maxLength={40}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="profile-website">
            WEBSITE
          </label>
          <input
            id="profile-website"
            className={inputClass}
            placeholder="https://"
            value={form.website}
            onChange={(e) => set("website")(e.target.value)}
            maxLength={255}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="profile-city">
            CITY
          </label>
          <input
            id="profile-city"
            className={inputClass}
            value={form.city}
            onChange={(e) => set("city")(e.target.value)}
            maxLength={120}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="profile-timezone">
            TIME ZONE
          </label>
          <input
            id="profile-timezone"
            className={inputClass}
            placeholder="America/Chicago"
            value={form.time_zone}
            onChange={(e) => set("time_zone")(e.target.value)}
            maxLength={60}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="profile-contact">
            PREFERRED CONTACT
          </label>
          <select
            id="profile-contact"
            className={inputClass}
            value={form.preferred_contact}
            onChange={(e) => set("preferred_contact")(e.target.value)}
          >
            {CONTACT_METHODS.map((method) => (
              <option key={method} value={method} className="bg-black">
                {method.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="profile-notes">
            ANYTHING I SHOULD KNOW?
          </label>
          <textarea
            id="profile-notes"
            className={`${inputClass} min-h-[110px]`}
            value={form.notes}
            onChange={(e) => set("notes")(e.target.value)}
            maxLength={2000}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="mt-6 inline-flex items-center gap-2 bg-[#FF3333] px-5 py-2.5 font-mono text-xs tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {mutation.isPending && <Loader2 className="size-3 animate-spin" />}
        {onboarded ? "SAVE CHANGES" : "FINISH ONBOARDING"}
      </button>
    </form>
  );
}
