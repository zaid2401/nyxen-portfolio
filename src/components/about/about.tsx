import { Section, Panel } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Placeholderable } from "@/components/ui/placeholder";
import { identityRows, aboutParagraphs } from "@/data/experience";

/**
 * The About section as a system read-out rather than a paragraph with a photo.
 * The left panel is scannable in two seconds; the right column is there for
 * whoever wants the longer answer.
 */
export function About() {
  return (
    <Section
      id="about"
      index="01"
      title="About"
      kicker="Who is behind this, in the shortest form that is still honest."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-14">
        <Reveal>
          <Panel className="overflow-hidden">
            <div className="border-line bg-panel/60 flex items-center justify-between gap-3 border-b px-4 py-2.5">
              <p className="font-mono text-[0.6875rem] tracking-[0.14em]">
                <span className="text-accent">$</span>{" "}
                <span className="text-muted">whoami</span>
              </p>
              <span
                aria-hidden="true"
                className="bg-accent/70 h-1.5 w-1.5 rounded-full"
              />
            </div>

            <dl className="divide-line divide-y">
              {identityRows.map((row) => (
                <div
                  key={row.key}
                  className="flex items-baseline justify-between gap-4 px-4 py-3"
                >
                  <dt className="label-key shrink-0">{row.key}</dt>
                  <dd className="text-fg text-right font-mono text-xs sm:text-[0.8125rem]">
                    <Placeholderable value={row.value} />
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>
        </Reveal>

        <div className="space-y-5">
          {aboutParagraphs.map((paragraph, index) => (
            <Reveal key={index} delay={0.06 * index}>
              <p className="text-muted text-balance-pretty text-[0.9375rem] leading-relaxed sm:text-base">
                {paragraph}
              </p>
            </Reveal>
          ))}

          <Reveal delay={0.2}>
            <p className="border-accent-line text-fg mt-8 border-l-2 pl-5 text-[0.9375rem] leading-relaxed italic">
              The measure of a good automation is that nobody talks about it
              again.
            </p>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
