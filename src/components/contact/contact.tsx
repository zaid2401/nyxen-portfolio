import { ArrowUpRight, Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { ActionLink } from "@/components/ui/action";
import { PlaceholderBadge } from "@/components/ui/placeholder";
import { CopyEmail } from "@/components/contact/copy-email";
import { siteConfig, githubUrl, isPlaceholder } from "@/config/site";

/**
 * Contact.
 *
 * Email, deliberately — no form. A contact form needs an email provider and a
 * verified domain behind it to be anything more than decoration, and a form
 * that quietly drops messages is worse than no form. A mailto with a
 * pre-filled subject and a one-click copy gets the message sent just as fast,
 * with nothing to break.
 */
export function Contact() {
  const hasEmail = !isPlaceholder(siteConfig.email);
  const hasLinkedIn = !isPlaceholder(siteConfig.linkedin);
  const hasGitHub = !isPlaceholder(siteConfig.githubUsername);

  const mailto = hasEmail
    ? `mailto:${siteConfig.email}?subject=${encodeURIComponent(
        `Hello from ${siteConfig.domain}`,
      )}`
    : null;

  return (
    <Section
      id="contact"
      index="06"
      title="Contact"
      kicker="Open to software development and data engineering roles, and happy to talk about either."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-14">
        <Reveal>
          <div className="space-y-px">
            <div className="border-line bg-raised/40 border p-5">
              <p className="label-key">Email</p>
              {hasEmail ? (
                <div className="mt-2.5 flex items-center gap-2">
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="text-fg hover:text-accent link-underline min-w-0 truncate font-mono text-sm transition-colors"
                  >
                    {siteConfig.email}
                  </a>
                  <CopyEmail email={siteConfig.email} />
                </div>
              ) : (
                <p className="text-warn/90 mt-2.5 font-mono text-sm">
                  {siteConfig.email}
                  <PlaceholderBadge />
                </p>
              )}
            </div>

            <div className="border-line bg-raised/40 border p-5">
              <p className="label-key">Elsewhere</p>
              <ul className="mt-3 space-y-2">
                {hasGitHub && (
                  <li>
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted hover:text-accent group flex items-center gap-2.5 font-mono text-sm transition-colors"
                    >
                      <GithubIcon aria-hidden="true" className="h-3.5 w-3.5" />
                      github.com/{siteConfig.githubUsername}
                      <ArrowUpRight
                        aria-hidden="true"
                        className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                )}
                {hasLinkedIn ? (
                  <li>
                    <a
                      href={siteConfig.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted hover:text-accent group flex items-center gap-2.5 font-mono text-sm transition-colors"
                    >
                      <LinkedinIcon
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                      />
                      LinkedIn
                      <ArrowUpRight
                        aria-hidden="true"
                        className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ) : (
                  <li className="text-muted flex items-center gap-2.5 font-mono text-sm">
                    <LinkedinIcon
                      aria-hidden="true"
                      className="text-dim h-3.5 w-3.5"
                    />
                    LinkedIn
                    <PlaceholderBadge />
                  </li>
                )}
              </ul>
            </div>

            {siteConfig.resumeUrl && (
              <div className="border-line bg-raised/40 border p-5">
                <p className="label-key">Résumé</p>
                <a
                  href={siteConfig.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-accent mt-2.5 inline-flex items-center gap-2 font-mono text-sm transition-colors"
                >
                  Download PDF
                  <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="border-line bg-raised/40 corner-ticks relative flex h-full flex-col justify-center border p-6 sm:p-8">
            <p className="label-key">Get in touch</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
              Email is the fastest route.
            </h3>
            <p className="text-muted mt-4 max-w-md text-[0.9375rem] leading-relaxed">
              Whether it&rsquo;s a role, a process worth automating or a
              question about anything on this page — write to me and I&rsquo;ll
              reply.
            </p>

            {mailto && (
              <div className="mt-7 flex flex-wrap gap-2">
                <ActionLink href={mailto} variant="primary" external={false}>
                  <Mail aria-hidden="true" className="h-3.5 w-3.5" />
                  Write to me
                </ActionLink>
              </div>
            )}

            <p className="text-dim border-line mt-8 border-t pt-5 font-mono text-[0.625rem] leading-relaxed tracking-[0.1em] uppercase">
              Typical reply within a couple of days
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
