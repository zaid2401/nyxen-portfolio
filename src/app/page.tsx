import { Hero } from "@/components/hero/hero";
import { About } from "@/components/about/about";
import { Experience } from "@/components/experience/experience";
import { Projects } from "@/components/projects/projects";
import { Skills } from "@/components/skills/skills";
import { Terminal } from "@/components/terminal/terminal";
import { Contact } from "@/components/contact/contact";
import { Footer } from "@/components/footer/footer";

/**
 * Incremental Static Regeneration.
 *
 * The page is prerendered and then rebuilt in the background at most once per
 * `revalidateSeconds`. That is what makes the GitHub integration self-
 * maintaining: push a new public repository, and the next request after the
 * window expires triggers a regeneration that picks it up. No deploy, no code
 * change, no manual project list.
 *
 * Next requires this to be a literal, so it cannot read
 * `siteConfig.revalidateSeconds` directly — keep the two in step if you change
 * the window.
 */
export const revalidate = 3600;

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Experience />
      <Projects />
      <Skills />
      <Terminal />
      <Contact />
      <Footer />
    </>
  );
}
