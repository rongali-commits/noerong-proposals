import { Link } from 'react-router-dom';
import {
  FileText,
  Send,
  Eye,
  Check,
  ArrowRight,
  Layers,
  DollarSign,
  Clock,
  ShieldCheck,
  Palette,
  Link2,
  BarChart3,
} from 'lucide-react';
import { ContainerWide } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SectionHeading, Eyebrow } from '@/components/ui/SectionHeading';
import { Divider } from '@/components/ui/Divider';
import { Stagger } from '@/components/ui/Stagger';

const workflowSteps = [
  {
    icon: FileText,
    label: 'Draft',
    title: 'Compose the scope',
    description:
      'Write services, set quantities and rates, apply discounts and tax. The total recalculates as you type.',
  },
  {
    icon: Send,
    label: 'Send',
    title: 'Share one link',
    description:
      'Send a branded proposal URL to your client. No attachments, no lost files, no version drift.',
  },
  {
    icon: Eye,
    label: 'Track',
    title: 'See when they look',
    description:
      'The proposal records a view the moment your client opens it, so you know when to follow up.',
  },
  {
    icon: Check,
    label: 'Approve',
    title: 'Get a clear answer',
    description:
      'Your client accepts or declines on the page. The result is recorded and locked, with no ambiguity.',
  },
];

const outcomes = [
  {
    icon: DollarSign,
    title: 'Price work accurately',
    description:
      'Line items, discounts, and tax are computed live. Every proposal arrives with a total you stand behind.',
  },
  {
    icon: Clock,
    title: 'Spend less time chasing',
    description:
      'You see when a client opens the proposal. Follow up at the right moment instead of guessing.',
  },
  {
    icon: ShieldCheck,
    title: 'Keep a clear record',
    description:
      'Every event (created, sent, viewed, commented, accepted) is logged to an immutable timeline.',
  },
  {
    icon: Palette,
    title: 'Present your brand',
    description:
      'Your business name, color, and terms appear on every proposal. The client sees your studio, not our platform.',
  },
];

const features = [
  {
    icon: Layers,
    title: 'Proposal builder',
    description:
      'A structured editor for services, descriptions, quantities, rates, discounts, and tax, with live totals.',
  },
  {
    icon: Link2,
    title: 'Public proposal link',
    description:
      'Each proposal gets a unique, shareable URL. Your client sees a branded page with comments and accept / decline actions.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard metrics',
    description:
      'Revenue value, acceptance rate, and status counts give you a quick read on your pipeline at a glance.',
  },
  {
    icon: FileText,
    title: 'Client management',
    description:
      'Keep contact details, company info, and notes organized. Search and archive clients as your roster grows.',
  },
  {
    icon: Eye,
    title: 'Activity timeline',
    description:
      'A chronological log of every event on each proposal, so you always know what happened and when.',
  },
  {
    icon: Palette,
    title: 'Branding settings',
    description:
      'Set your business name, brand color, default currency, tax rate, terms, and proposal number prefix.',
  },
];

const audiences = [
  {
    title: 'Freelancers',
    description: 'Send polished proposals that match the quality of your work, without spending hours formatting.',
  },
  {
    title: 'Consultants',
    description: 'Structure scope and pricing clearly so clients understand exactly what they are approving.',
  },
  {
    title: 'Creative studios',
    description: 'Present proposals under your own brand identity, with a professional client approval experience.',
  },
  {
    title: 'Development agencies',
    description: 'Break work into line items, apply tax and discounts, and track every proposal through to decision.',
  },
];

export function HomePage() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="pt-16 md:pt-24 pb-20 md:pb-28">
        <ContainerWide>
          <div className="max-w-3xl">
            <Stagger delay={0}>
              <Badge variant="accent">Proposal workflow for independent teams</Badge>
            </Stagger>
            <Stagger delay={80}>
              <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl text-ink-900 text-balance">
                Turn clear scope into confident approval.
              </h1>
            </Stagger>
            <Stagger delay={160}>
              <p className="mt-6 text-lg md:text-xl text-ink-500 leading-relaxed max-w-2xl text-pretty">
                Create polished proposals, price work accurately, share one
                professional link, and know when clients are ready to move.
              </p>
            </Stagger>
            <Stagger delay={240}>
              <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <ButtonLink to="/signup" size="lg">
                  Build a proposal
                  <ArrowRight size={18} />
                </ButtonLink>
                <ButtonLink to="/sample-proposal" variant="outline" size="lg">
                  View sample proposal
                </ButtonLink>
              </div>
            </Stagger>
          </div>

          {/* Hero visual: editorial proposal preview */}
          <Stagger delay={320} className="mt-16 md:mt-20">
            <div className="relative">
              <div className="absolute -top-3 -left-3 w-24 h-24 bg-lime-200/40 rounded-lg hidden md:block" aria-hidden="true" />
              <Card className="relative max-w-4xl mx-auto shadow-sm">
                <CardBody className="p-8 md:p-12">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <p className="text-2xs font-medium uppercase tracking-[0.18em] text-ink-400">
                        Proposal No. NP-0042
                      </p>
                      <h3 className="mt-2 text-2xl md:text-3xl text-ink-900 font-serif">
                        Brand identity &amp; website design
                      </h3>
                      <p className="mt-1 text-sm text-ink-400">
                        Prepared for Meridian Coffee Co.
                      </p>
                    </div>
                    <Badge variant="neutral">Draft</Badge>
                  </div>

                  <div className="space-y-3">
                    {[
                      { desc: 'Brand strategy workshop', qty: '1', rate: '$1,200', total: '$1,200' },
                      { desc: 'Logo & visual identity system', qty: '1', rate: '$3,500', total: '$3,500' },
                      { desc: 'Website design, 5 pages', qty: '5', rate: '$700', total: '$3,500' },
                      { desc: 'Responsive development', qty: '40', rate: '$95', total: '$3,800' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-3 border-b border-ink-200/40 last:border-0"
                      >
                        <div className="flex-1">
                          <p className="text-sm text-ink-700">{item.desc}</p>
                        </div>
                        <div className="flex items-center gap-6 md:gap-10 text-sm">
                          <span className="text-ink-400 w-8 text-right">{item.qty}</span>
                          <span className="text-ink-500 w-16 text-right">{item.rate}</span>
                          <span className="text-ink-700 font-medium w-20 text-right tabular-nums">
                            {item.total}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <div className="w-48 space-y-2">
                      <div className="flex justify-between text-sm text-ink-400">
                        <span>Subtotal</span>
                        <span className="tabular-nums">$12,000</span>
                      </div>
                      <div className="flex justify-between text-sm text-ink-400">
                        <span>Tax (8.5%)</span>
                        <span className="tabular-nums">$1,020</span>
                      </div>
                      <div className="flex justify-between text-base text-ink-900 font-medium pt-2 border-t border-ink-200/50">
                        <span>Total</span>
                        <span className="tabular-nums">$13,020</span>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </Stagger>
        </ContainerWide>
      </section>

      <Divider />

      {/* Workflow */}
      <section id="workflow" className="py-20 md:py-28">
        <ContainerWide>
          <SectionHeading
            eyebrow="How it works"
            title="Four steps from draft to decision"
            description="A focused workflow that takes you from writing the scope to recording your client's answer, without spreadsheets, attachments, or guesswork."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((step, i) => (
              <Stagger key={step.label} delay={i * 80} as="article">
                <Card className="h-full">
                  <CardBody>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-ink-900 text-ivory-50">
                        <step.icon size={18} />
                      </span>
                      <span className="text-2xs font-medium uppercase tracking-[0.18em] text-ink-400">
                        Step {i + 1}
                      </span>
                    </div>
                    <h3 className="text-lg text-ink-900 font-serif">{step.title}</h3>
                    <p className="mt-2 text-sm text-ink-500 leading-relaxed">
                      {step.description}
                    </p>
                  </CardBody>
                </Card>
              </Stagger>
            ))}
          </div>
        </ContainerWide>
      </section>

      <Divider />

      {/* Outcomes */}
      <section id="outcomes" className="py-20 md:py-28 bg-ivory-200/40">
        <ContainerWide>
          <SectionHeading
            eyebrow="Why it matters"
            title="The outcomes that move work forward"
            description="Every feature exists to solve a real friction point in the proposal process, not to fill space on a feature list."
            align="center"
            className="mb-14"
          />
          <div className="grid gap-6 md:grid-cols-2">
            {outcomes.map((outcome, i) => (
              <Stagger key={outcome.title} delay={i * 80} as="article">
                <Card className="h-full">
                  <CardBody className="flex gap-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-lime-100 text-lime-700">
                      <outcome.icon size={20} />
                    </span>
                    <div>
                      <h3 className="text-lg text-ink-900 font-serif">{outcome.title}</h3>
                      <p className="mt-2 text-sm text-ink-500 leading-relaxed">
                        {outcome.description}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </Stagger>
            ))}
          </div>
        </ContainerWide>
      </section>

      <Divider />

      {/* Feature preview */}
      <section id="features" className="py-20 md:py-28">
        <ContainerWide>
          <SectionHeading
            eyebrow="What's inside"
            title="Everything you need to send and track proposals"
            description="A complete toolkit for pricing, presenting, and closing, built for the way independent teams actually work."
          />
          <div className="mt-14 grid gap-px bg-ink-200/40 rounded-lg overflow-hidden border border-ink-200/60 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <Stagger key={feature.title} delay={i * 60} as="article">
                <div className="bg-ivory-50 p-7 h-full">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md border border-ink-200 text-ink-600">
                    <feature.icon size={18} />
                  </span>
                  <h3 className="mt-5 text-base text-ink-900 font-medium">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-ink-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Stagger>
            ))}
          </div>
        </ContainerWide>
      </section>

      <Divider />

      {/* Audience fit */}
      <section id="audience" className="py-20 md:py-28 bg-ivory-200/40">
        <ContainerWide>
          <SectionHeading
            eyebrow="Who it's for"
            title="Built for the way you work"
            description="Noerong Proposals is designed for independent professionals who need a proposal process that matches the quality of their work."
            align="center"
            className="mb-14"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map((aud, i) => (
              <Stagger key={aud.title} delay={i * 80} as="article">
                <div className="p-6 border-l-2 border-lime-300">
                  <h3 className="text-base text-ink-900 font-serif">{aud.title}</h3>
                  <p className="mt-2 text-sm text-ink-500 leading-relaxed">
                    {aud.description}
                  </p>
                </div>
              </Stagger>
            ))}
          </div>
        </ContainerWide>
      </section>

      <Divider />

      {/* About & Contact */}
      <section id="about" className="py-20 md:py-28 scroll-mt-16">
        <span id="contact" className="block scroll-mt-16" />
        <ContainerWide>
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <SectionHeading
                eyebrow="About"
                title="A proposal tool built by people who send them"
                description="Noerong Proposals was created for the gap between a shared Google Doc and an enterprise sales platform, the space where most independent teams actually work."
              />
            </div>
            <div className="lg:col-span-7">
              <div className="space-y-6">
                <p className="text-base text-ink-500 leading-relaxed text-pretty">
                  We built Noerong because the proposal process for independent work is
                  broken. Freelancers and small studios paste rates into a document,
                  attach it to an email, and then wait. There is no way to know if the
                  client opened it, no record of what was agreed, and no consistent
                  presentation of the work being sold.
                </p>
                <p className="text-base text-ink-500 leading-relaxed text-pretty">
                  Noerong fixes that with a focused workflow: write the scope, price it
                  accurately, send one branded link, and get a clear answer back. Every
                  event is recorded. Every proposal looks like it came from your studio,
                  not from a template tool.
                </p>
                <p className="text-base text-ink-500 leading-relaxed text-pretty">
                  Get in touch at{' '}
                  <a
                    href="mailto:hello@noerong.com"
                    className="text-ink-900 underline underline-offset-4 hover:text-ink-700"
                  >
                    hello@noerong.com
                  </a>
                  {' '}if you have questions or want to learn more.
                </p>
              </div>
            </div>
          </div>
        </ContainerWide>
      </section>

      <Divider />

      {/* Final CTA */}
      <section className="py-24 md:py-32">
        <ContainerWide>
          <div className="max-w-3xl mx-auto text-center">
            <Eyebrow className="mb-4 block">Get started</Eyebrow>
            <h2 className="text-3xl md:text-5xl text-ink-900 text-balance">
              Your next proposal can be your best one.
            </h2>
            <p className="mt-5 text-lg text-ink-500 leading-relaxed text-pretty">
              Create an account, set up your brand, and send a proposal your
              client will actually want to open.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <ButtonLink to="/signup" size="lg">
                Build a proposal
                <ArrowRight size={18} />
              </ButtonLink>
              <ButtonLink to="/sample-proposal" variant="outline" size="lg">
                View sample proposal
              </ButtonLink>
            </div>
            <p className="mt-6 text-sm text-ink-400">
              Already have an account?{' '}
              <Link to="/login" className="text-ink-700 underline underline-offset-4 hover:text-ink-900">
                Sign in
              </Link>
            </p>
          </div>
        </ContainerWide>
      </section>
    </div>
  );
}
