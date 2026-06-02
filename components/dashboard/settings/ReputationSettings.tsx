import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { GoogleReviewUrlForm } from "@/components/dashboard/settings/GoogleReviewUrlForm";
import { PrintButton } from "@/components/dashboard/settings/PrintButton";
import { TelegramConnect } from "@/components/dashboard/settings/TelegramConnect";

type ReputationSettingsProps = {
  isPro: boolean;
  googleReviewUrl: string | null;
  reviewQrSvg: string | null;
  telegramConnected: boolean;
  telegramUsername: string | null;
  connectUrl: string;
};

export async function ReputationSettings({
  isPro,
  googleReviewUrl,
  reviewQrSvg,
  telegramConnected,
  telegramUsername,
  connectUrl,
}: ReputationSettingsProps) {
  const tSettings = await getTranslations("dashboard.settings");

  return (
    <section className="mt-8 rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-7">
      <p className="m-0 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--accent)]">
        Google отзиви
      </p>

      {isPro ? (
        <>
          {/* Google review URL */}
          <div className="mt-4">
            <h2 className="m-0 font-[var(--f-display)] text-[28px] font-normal leading-tight text-[var(--ink)]">
              {tSettings("reputation.title")}
            </h2>
            <p className="mt-3 mb-0 text-[14px] leading-[1.6] text-[var(--ink-2)]">
              {tSettings("reputation.description")}
            </p>
            <GoogleReviewUrlForm initialUrl={googleReviewUrl} />
          </div>

          {/* Owner QR asset — shown only when a URL is saved */}
          {reviewQrSvg ? (
            <div className="mt-8 border-t border-[var(--rule)] pt-8">
              <h2 className="m-0 font-[var(--f-display)] text-[24px] font-normal leading-tight text-[var(--ink)]">
                {tSettings("reputation.qrTitle")}
              </h2>
              <p className="mt-3 mb-5 max-w-[540px] text-[14px] leading-[1.6] text-[var(--ink-2)]">
                {tSettings("reputation.qrHint")}
              </p>
              <div
                className="inline-block rounded-xl border border-[var(--rule)] bg-white p-4"
                dangerouslySetInnerHTML={{ __html: reviewQrSvg }}
              />
              <div className="mt-4">
                <PrintButton label={tSettings("reputation.qrPrint")} />
              </div>
            </div>
          ) : null}

          {/* Telegram */}
          <div className="mt-8 border-t border-[var(--rule)] pt-8">
            <h2 className="m-0 font-[var(--f-display)] text-[28px] font-normal leading-tight text-[var(--ink)]">
              {tSettings("telegram.title")}
            </h2>
            <p className="mt-3 mb-0 text-[14px] leading-[1.6] text-[var(--ink-2)]">
              {tSettings("telegram.description")}
            </p>
            <TelegramConnect
              connected={telegramConnected}
              username={telegramUsername}
              connectUrl={connectUrl}
            />
          </div>
        </>
      ) : (
        /* Non-Pro locked upsell */
        <div className="mt-4">
          <h2 className="m-0 font-[var(--f-display)] text-[28px] font-normal leading-tight text-[var(--ink)]">
            {tSettings("reputation.lockedTitle")}
          </h2>
          <p className="mt-3 mb-6 max-w-[560px] text-[14px] leading-[1.6] text-[var(--ink-2)]">
            {tSettings("reputation.lockedBody")}
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-block rounded-lg bg-[var(--accent)] px-5 py-2.5 text-[14px] font-medium text-white no-underline transition hover:brightness-95"
            style={{ boxShadow: "0 8px 20px -8px rgba(194,77,44,0.5)" }}
          >
            {tSettings("reputation.lockedCta")}
          </Link>
        </div>
      )}
    </section>
  );
}
