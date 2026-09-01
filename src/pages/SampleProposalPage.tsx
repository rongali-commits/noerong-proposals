import { Check, MessageSquare, ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Eyebrow } from '@/components/ui/SectionHeading';
import { Divider } from '@/components/ui/Divider';
import { Link } from 'react-router-dom';

const sampleItems = [
  { desc: 'Brand strategy & positioning workshop', qty: '1', rate: '$1,200', total: '$1,200' },
  { desc: 'Logo design & visual identity system', qty: '1', rate: '$3,500', total: '$3,500' },
  { desc: 'Website design, 5 page templates', qty: '5', rate: '$850', total: '$4,250' },
  { desc: 'Front-end development (hourly)', qty: '40', rate: '$95', total: '$3,800' },
  { desc: 'Content migration & launch support', qty: '1', rate: '$1,250', total: '$1,250' },
];

export function SampleProposalPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory-100">
      <header className="border-b border-ink-200/50 bg-ivory-100/95 backdrop-blur-sm sticky top-0 z-40">
        <Container>
          <div className="h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5" aria-label="Noerong Proposals home">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink-900 text-ivory-50">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3.5V12.5L8 8L13 3.5V12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="font-serif text-lg font-medium tracking-tight text-ink-900">Noerong <span className="text-ink-400 font-normal">Proposals</span></span>
            </Link>
            <div className="flex items-center gap-3">
              <Badge variant="success">
                <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
                Accepted
              </Badge>
              <Link
                to="/"
                className="text-sm text-ink-500 hover:text-ink-900 transition-colors hidden sm:inline"
              >
                Back to home
              </Link>
            </div>
          </div>
        </Container>
      </header>

      <main className="flex-1 py-12 md:py-16">
        <Container>
          <div className="max-w-3xl mx-auto">
            {/* Proposal header */}
            <div className="mb-10">
              <Eyebrow className="mb-3 block">Proposal No. NP-0042</Eyebrow>
              <h1 className="text-3xl md:text-4xl text-ink-900 font-serif text-balance">
                Brand identity &amp; website design
              </h1>
              <p className="mt-2 text-base text-ink-400">
                Prepared for Meridian Coffee Co. by Field Studio
              </p>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              <div className="p-5 rounded-lg border border-ink-200/60 bg-ivory-50">
                <p className="text-2xs font-medium uppercase tracking-[0.18em] text-ink-400 mb-2">From</p>
                <p className="text-sm font-medium text-ink-900">Field Studio</p>
                <p className="text-sm text-ink-500">hello@fieldstudio.co</p>
                <p className="text-sm text-ink-500">Portland, OR</p>
              </div>
              <div className="p-5 rounded-lg border border-ink-200/60 bg-ivory-50">
                <p className="text-2xs font-medium uppercase tracking-[0.18em] text-ink-400 mb-2">For</p>
                <p className="text-sm font-medium text-ink-900">Meridian Coffee Co.</p>
                <p className="text-sm text-ink-500">ops@meridiancoffee.com</p>
                <p className="text-sm text-ink-500">Seattle, WA</p>
              </div>
            </div>

            {/* Items */}
            <Card>
              <CardBody className="p-6 md:p-8">
                <h2 className="text-lg text-ink-900 font-serif mb-6">Scope of work</h2>
                <div className="space-y-1">
                  <div className="hidden sm:grid grid-cols-12 gap-4 pb-3 border-b border-ink-200/50 text-2xs font-medium uppercase tracking-wider text-ink-400">
                    <span className="col-span-6">Description</span>
                    <span className="col-span-2 text-right">Qty</span>
                    <span className="col-span-2 text-right">Rate</span>
                    <span className="col-span-2 text-right">Amount</span>
                  </div>
                  {sampleItems.map((item, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-4 py-4 border-b border-ink-200/40 last:border-0"
                    >
                      <span className="col-span-12 sm:col-span-6 text-sm text-ink-700">
                        {item.desc}
                      </span>
                      <span className="col-span-4 sm:col-span-2 text-sm text-ink-400 sm:text-right">
                        <span className="sm:hidden text-2xs uppercase tracking-wider text-ink-400 mr-2">Qty</span>
                        {item.qty}
                      </span>
                      <span className="col-span-4 sm:col-span-2 text-sm text-ink-400 sm:text-right">
                        <span className="sm:hidden text-2xs uppercase tracking-wider text-ink-400 mr-2">Rate</span>
                        {item.rate}
                      </span>
                      <span className="col-span-4 sm:col-span-2 text-sm text-ink-700 font-medium sm:text-right tabular-nums">
                        {item.total}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-6 flex justify-end">
                  <div className="w-full sm:w-64 space-y-2">
                    <div className="flex justify-between text-sm text-ink-400">
                      <span>Subtotal</span>
                      <span className="tabular-nums">$14,000</span>
                    </div>
                    <div className="flex justify-between text-sm text-ink-400">
                      <span>Discount (10%)</span>
                      <span className="tabular-nums">−$1,400</span>
                    </div>
                    <div className="flex justify-between text-sm text-ink-400">
                      <span>Tax (8.5%)</span>
                      <span className="tabular-nums">$1,071</span>
                    </div>
                    <div className="flex justify-between text-base text-ink-900 font-medium pt-2 border-t border-ink-200/50">
                      <span>Total</span>
                      <span className="tabular-nums">$13,671</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Notes & terms */}
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-2xs font-medium uppercase tracking-[0.18em] text-ink-400 mb-3">Notes</h3>
                <p className="text-sm text-ink-500 leading-relaxed">
                  All design assets will be delivered in Figma. Development includes
                  responsive implementation and a two-week revision window after launch.
                </p>
              </div>
              <div>
                <h3 className="text-2xs font-medium uppercase tracking-[0.18em] text-ink-400 mb-3">Terms</h3>
                <p className="text-sm text-ink-500 leading-relaxed">
                  50% deposit due on acceptance. Balance due within 30 days of project
                  completion. This proposal is valid for 30 days.
                </p>
              </div>
            </div>

            <Divider className="my-10" />

            {/* Acceptance confirmation */}
            <div className="p-6 md:p-8 rounded-lg border border-lime-200 bg-lime-50/60">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-success-500 text-ivory-50">
                  <Check size={20} />
                </span>
                <div>
                  <h3 className="text-base text-ink-900 font-medium">
                    Proposal accepted
                  </h3>
                  <p className="mt-1 text-sm text-ink-500 leading-relaxed">
                    Meridian Coffee Co. accepted this proposal on August 18, 2026.
                    A deposit invoice will be sent separately.
                  </p>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="mt-10">
              <h3 className="text-lg text-ink-900 font-serif mb-4 flex items-center gap-2">
                <MessageSquare size={18} className="text-ink-400" />
                Client comments
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-ink-200/60 bg-ivory-50">
                  <p className="text-sm text-ink-700 leading-relaxed">
                    This looks great. We're excited to get started. One question:
                    can we add a sixth page for the wholesale ordering portal?
                  </p>
                  <p className="mt-2 text-xs text-ink-400">Sarah Chen, Meridian Coffee Co., Aug 16</p>
                </div>
                <div className="p-4 rounded-lg border border-ink-200/60 bg-ivory-50">
                  <p className="text-sm text-ink-700 leading-relaxed">
                    Happy to add that as a separate line item. I'll send a revised
                    version before you accept.
                  </p>
                  <p className="mt-2 text-xs text-ink-400">Field Studio, Aug 16</p>
                </div>
                <div className="p-4 rounded-lg border border-ink-200/60 bg-ivory-50">
                  <p className="text-sm text-ink-700 leading-relaxed">
                    Perfect, the revised scope works for us. Approving now.
                  </p>
                  <p className="mt-2 text-xs text-ink-400">Sarah Chen, Meridian Coffee Co., Aug 18</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <footer className="border-t border-ink-200/50 py-8">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-ink-400">
              This is a sample proposal for demonstration only.
            </p>
            <ButtonLink to="/" variant="outline" size="sm">
              Back to Noerong
              <ArrowRight size={15} />
            </ButtonLink>
          </div>
        </Container>
      </footer>
    </div>
  );
}
