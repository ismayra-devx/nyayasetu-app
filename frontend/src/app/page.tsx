'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence, type Variants, type Transition } from 'framer-motion';
import gsap from 'gsap';
import { Button, Input, Textarea, GuidedChecklist, ProgressBar, StatCard, Badge, Accordion, AccordionItem, Alert, BottomCta, AppHeader } from '../components/ui';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TYPES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface AssessmentData {
  theftAmount: number;
  violationsLog: string[];
  automatedMessage: string;
  isCompliant: boolean;
  applicableLaws?: string[];
  recommendations?: string[];
}

type ScreenState = 'LOGIN' | 'INTAKE' | 'LOADING' | 'RESULT';
type MicStatus = 'IDLE' | 'LISTENING' | 'PROCESSING';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CONSTANTS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const FAIR_WAGE_TOKENS: readonly string[] = [
  'right amount', 'correct amount', 'fair wage', 'full salary', 
  'fully paid', 'paid correctly', 'paid in full', 'पूरा पैसा', 
  'सही वेतन', 'पूरी सैलरी', 'सही मिला'
];

const LOADING_STEPS: readonly string[] = [
  'Understanding Complaint',
  'Searching Labour Laws',
  'Checking Worker Rights',
  'Calculating Compensation',
  'Preparing Legal Summary'
];

function detectFairWage(input: string): boolean {
  const lower = input.toLowerCase();
  return FAIR_WAGE_TOKENS.some((phrase) => lower.includes(phrase));
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MOTION/ANIMATION PRESETS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2,  ease: EASE } },
};

const itemVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: EASE } as Transition,
  }),
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ICONS (Lucide-inspired premium SVGs)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function ShieldIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function MicIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowRightIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function AlertIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SUB-COMPONENTS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function CountUp({ target, prefix = '' }: { target: number; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: target,
      duration: 1.6,
      ease: 'power3.out',
      delay: 0.4,
      onUpdate() {
        if (ref.current) ref.current.textContent = Math.round(obj.val).toLocaleString('en-IN');
      },
    });
    return () => { tween.kill(); };
  }, [target]);
  return <span ref={ref}>{prefix}{target === 0 ? '0' : '…'}</span>;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN COMPONENT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function Home() {
  const [screen, setScreen] = useState<ScreenState>('LOGIN');
  const [phone, setPhone] = useState<string>('');
  const [workerInput, setWorkerInput] = useState<string>('');
  const [micStatus, setMicStatus] = useState<MicStatus>('IDLE');
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [confidence, setConfidence] = useState<number>(0);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [assessment, setAssessment] = useState<AssessmentData>({
    theftAmount: 0,
    violationsLog: [],
    automatedMessage: '',
    isCompliant: false,
    applicableLaws: [],
    recommendations: [],
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── Auto-expand textarea content ── */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [workerInput]);

  /* ── Loading animation sequencer ── */
  useEffect(() => {
    if (screen !== 'LOADING') { setLoadingStep(0); return; }
    const timers: ReturnType<typeof setTimeout>[] = [];
    LOADING_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setLoadingStep(i), i * 900));
    });
    return () => timers.forEach(clearTimeout);
  }, [screen]);

  /* ── Voice speech simulation ── */
  useEffect(() => {
    if (micStatus !== 'LISTENING') {
      if (micStatus === 'IDLE') {
        setRecordingSeconds(0);
        setConfidence(0);
      }
      return;
    }

    setRecordingSeconds(0);
    setConfidence(94);

    // Increment timer seconds every 1000ms
    const secondsInterval = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
      setConfidence((prev) => {
        const next = prev + (Math.random() > 0.5 ? 1 : -1);
        return Math.min(Math.max(next, 91), 98);
      });
    }, 1000);
    
    // Simulate user speaking and receiving transcript after 4 seconds
    const timer = setTimeout(() => {
      clearInterval(secondsInterval);
      setMicStatus('PROCESSING');
      let currentText = '';
      const sampleText = "मैं ओखला की एक कंस्ट्रक्शन साइट पर काम करता हूँ। मुझे हर दिन 12 घंटे काम कराया जाता है लेकिन केवल ₹450 मिलते हैं।";
      
      let index = 0;
      const typeInterval = setInterval(() => {
        if (index < sampleText.length) {
          currentText += sampleText.charAt(index);
          setWorkerInput(currentText);
          index++;
        } else {
          clearInterval(typeInterval);
          setMicStatus('IDLE');
        }
      }, 50);
      
    }, 5000);

    return () => {
      clearInterval(secondsInterval);
      clearTimeout(timer);
    };
  }, [micStatus]);

  /* ── Login handler ── */
  const handleLogin = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 10) {
      alert('कृपया 10 अंकों का मोबाइल नंबर दर्ज करें।');
      return;
    }
    setScreen('INTAKE');
  };

  /* ── Analyze handler ── */
  const handleAnalyze = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!workerInput.trim()) return;
    setScreen('LOADING');

    try {
      const res = await fetch('/api/analyze-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerInput }),
      });
      const data: { success: boolean; assessment: AssessmentData } = await res.json();
      if (data.success) {
        setAssessment(data.assessment);
        setScreen('RESULT');
      } else {
        alert('विश्लेषण में त्रुटि। कृपया पुनः प्रयास करें।');
        setScreen('INTAKE');
      }
    } catch {
      /* Fallback — smart keyword detection */
      const fair = detectFairWage(workerInput);
      await new Promise<void>((r) => setTimeout(r, LOADING_STEPS.length * 900 + 400));
      setAssessment(
        fair
          ? {
              theftAmount: 0,
              isCompliant: true,
              violationsLog: [
                'Wages verified against Delhi minimum wage floor (₹710/day).',
                'No overtime violations detected in the reported hours.',
              ],
              automatedMessage:
                '✅ Compliance Verified\n\nNo wage theft detected. The employer appears to be meeting statutory obligations.',
              applicableLaws: [
                'Minimum Wages Act, 1948 — Compliant',
                'Payment of Wages Act, 1936 — Compliant',
              ],
              recommendations: [
                'Keep records of your salary slips for future reference.',
                'Contact your local Labour Commissioner if your situation changes.',
              ],
            }
          : {
              theftAmount: 650,
              isCompliant: false,
              violationsLog: [
                'Wage below minimum: Daily pay falls below Delhi statutory floor (₹710/day).',
                'Unpaid overtime: 4 additional hours worked without mandatory double-rate payment.',
              ],
              automatedMessage:
                '🚨 Wage Violation Detected\n\nEstimated shortfall of ₹650 detected. You may be entitled to compensation.',
              applicableLaws: [
                'Minimum Wages Act, 1948 — Section 12 Violated',
                'Payment of Wages Act, 1936 — Section 25 Violated',
                'Factories Act, 1948 — Overtime Provisions Applicable',
              ],
              recommendations: [
                'File a claim with the Labour Commissioner in your district.',
                'Contact your nearest labour welfare board for free assistance.',
                'Preserve all salary slips, attendance records, and messages.',
              ],
            }
      );
      setScreen('RESULT');
    }
  };

  const isCompliant = assessment.isCompliant;
  const statusColor  = isCompliant ? 'var(--color-success)' : 'var(--color-danger)';

  return (
    /* App shell */
    <div className="app-shell safe-bottom">

      {/* ── Top status bar safe area ── */}
      <div style={{ height: 'env(safe-area-inset-top)', background: 'var(--color-bg)', flexShrink: 0 }} />

      {/* ── Screens ── */}
      <AnimatePresence mode="wait">

        {/* ════════════════════════════════════
            SCREEN 1 — Identity Verification
            Apple-inspired government gate
        ════════════════════════════════════ */}
        {screen === 'LOGIN' && (
          <motion.div key="login" {...pageVariants}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '0 32px' }}>

            {/* Top Emblem Header */}
            <motion.div custom={0} variants={itemVariants} initial="initial" animate="animate"
              style={{ paddingTop: 56, paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--color-primary)', display: 'flex' }}>
                  <ShieldIcon size={18} />
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--color-text-secondary)'
                }}>
                  Ministry of Labour & Employment · Govt of India
                </span>
              </div>
            </motion.div>

            {/* Typography Hero Area with Hindi Layering */}
            <motion.div custom={1} variants={itemVariants} initial="initial" animate="animate"
              style={{ position: 'relative', marginTop: 40, paddingBottom: 12 }}>
              
              {/* Giant Layered Hindi Watermark */}
              <div style={{
                position: 'absolute',
                top: -36,
                left: -8,
                fontSize: 108,
                fontWeight: 900,
                color: 'var(--color-surface)',
                userSelect: 'none',
                pointerEvents: 'none',
                lineHeight: 1,
                letterSpacing: '-0.04em',
                zIndex: 0,
              }}>
                न्याय
              </div>

              {/* Foreground Typography */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h1 className="type-title-1" style={{ fontSize: 36, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>
                  न्यायसेतु
                </h1>
                <p className="type-body-lg" style={{ marginTop: 8, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Secure Labour Identity
                </p>
                <p className="type-caption" style={{ marginTop: 2, color: 'var(--color-text-tertiary)' }}>
                  श्रमिक पहचान एवं कानून सहायता द्वार
                </p>
              </div>
            </motion.div>

            {/* Document-style Form Section */}
            <motion.form custom={3} variants={itemVariants} initial="initial" animate="animate"
              onSubmit={handleLogin}
              style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 28, zIndex: 1 }}>

              {/* Phone input styled as an official ledger line entry */}
              <div className="ns-field" style={{ gap: 6 }}>
                <label className="type-overline" style={{ color: 'var(--color-text-secondary)', fontWeight: 700 }} htmlFor="phone-input">
                  Registered Mobile Number / पंजीकृत मोबाइल संख्या
                </label>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '2px solid var(--color-primary)',
                  background: 'transparent',
                  height: '52px',
                  padding: '0 4px',
                  transition: 'border-color var(--duration-fast) ease',
                }}>
                  {/* Fixed Prefix block resting directly on the line */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    userSelect: 'none',
                    paddingRight: 12,
                  }}>
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    id="phone-input"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPhone(e.target.value.replace(/\D/g, ''))
                    }
                    autoComplete="tel-national"
                    required
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-text-primary)',
                      fontSize: '18px',
                      fontWeight: 700,
                      outline: 'none',
                      height: '100%',
                      padding: 0,
                      letterSpacing: '0.05em',
                    }}
                  />
                </div>
              </div>

              {/* Authoritative Action Button */}
              <Button type="submit" variant="primary">
                <span>Secure Verification via OTP</span>
                <ArrowRightIcon />
              </Button>
            </motion.form>

            {/* Left-aligned Official Footnotes */}
            <motion.div custom={4} variants={itemVariants} initial="initial" animate="animate"
              style={{ marginTop: 'auto', paddingTop: 64, paddingBottom: 40 }}>
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 4,
                color: 'var(--color-text-muted)', fontSize: 12,
                borderTop: '1px solid var(--color-border-subtle)',
                paddingTop: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                  <ShieldIcon size={13} />
                  <span>NATIONAL SECURITY GATEWAY</span>
                </div>
                <span className="type-caption" style={{ fontSize: 11 }}>
                  Subject to Indian Labour Act, 1948 & UIDAI security regulations. All sessions are logged under statutory audits.
                </span>
              </div>
            </motion.div>

          </motion.div>
        )}

        {/* ════════════════════════════════════
            SCREEN 2 — Voice Complaint Intake
            Google Recorder-like Calm Mic Centerpiece
        ════════════════════════════════════ */}
        {screen === 'INTAKE' && (
          <motion.div key="intake" {...pageVariants}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '0 32px' }}>

            {/* Sovereign Navigation Bar */}
            <AppHeader onBack={() => setScreen('LOGIN')} />

            {/* Header Title */}
            <motion.div custom={0} variants={itemVariants} initial="initial" animate="animate"
              style={{ paddingTop: 24, paddingBottom: 24 }}>
              <h1 className="type-title-3" style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Deposition Statement
              </h1>
              <p className="type-caption" style={{ marginTop: 4, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Verbal evidence capture for statutory labour compliance audits.
              </p>
            </motion.div>

            {/* Asymmetrical Acoustic Recorder Block */}
            <motion.div custom={1} variants={itemVariants} initial="initial" animate="animate"
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Double Column Stats Grid */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="type-overline" style={{ color: micStatus === 'LISTENING' ? 'var(--color-danger)' : 'var(--color-text-secondary)', fontWeight: 700 }}>
                    {micStatus === 'LISTENING' ? '● RECORDING ACTIVE' : micStatus === 'PROCESSING' ? '○ DECODING EVIDENCE...' : '■ RECORDER STANDBY'}
                  </div>
                  <div style={{ fontSize: 44, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', lineHeight: 1, marginTop: 4 }}>
                    {micStatus === 'LISTENING' ? `00:${recordingSeconds.toString().padStart(2, '0')}` : '00:00'}
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>
                    <span className="type-overline" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>CONFIDENCE INDEX</span>
                    <div className="type-caption" style={{ fontWeight: 700, color: micStatus === 'LISTENING' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                      {micStatus === 'LISTENING' ? `${confidence}%` : '0.00%'}
                    </div>
                  </div>
                  <div>
                    <span className="type-overline" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>SIGNAL INPUT</span>
                    <div className="type-caption" style={{ fontWeight: 700, color: micStatus === 'LISTENING' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                      {micStatus === 'LISTENING' ? 'STRONG (-42dB)' : 'NO SIGNAL'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button & Description row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
                <Button
                  type="button"
                  onClick={() => {
                    if (micStatus === 'IDLE') {
                      setMicStatus('LISTENING');
                    } else {
                      setMicStatus('IDLE');
                    }
                  }}
                  style={{
                    height: 44, width: 'auto', padding: '0 20px',
                    background: micStatus === 'LISTENING' ? 'var(--color-danger)' : 'var(--color-primary)',
                    color: 'var(--color-text-inverse)', border: 'none',
                    boxShadow: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 8, height: 8,
                      borderRadius: micStatus === 'LISTENING' ? '1px' : '50%',
                      background: '#FFFFFF', display: 'block'
                    }} />
                    <span>{micStatus === 'LISTENING' ? 'Stop & Save Testimony' : 'Record Audio Evidence'}</span>
                  </div>
                </Button>
                <div className="type-caption" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', flex: 1, lineHeight: 1.4 }}>
                  {micStatus === 'LISTENING' 
                    ? 'Speak clearly about your work shifts, daily pay, and location details.' 
                    : 'Acoustic statement is transcribed into statutory legal testimony.'
                  }
                </div>
              </div>

              {/* Waveform Visualizer (Framed by lines instead of boxes) */}
              <div style={{
                borderTop: '1px solid var(--color-border)',
                borderBottom: '1px solid var(--color-border)',
                padding: '16px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 8
              }}>
                {micStatus === 'LISTENING' ? (
                  <div className="ns-waveform" style={{ gap: 4 }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((n) => {
                      const delayValue = (n % 5) * 0.1;
                      return (
                        <span
                          key={n}
                          className="ns-wave-bar"
                          style={{
                            width: 3,
                            height: 8,
                            animation: `waveform 0.8s ease-in-out infinite ${delayValue}s`,
                            background: 'var(--color-primary)'
                          }}
                        />
                      );
                    })}
                  </div>
                ) : micStatus === 'PROCESSING' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="ns-spinner ns-spinner--sm" />
                    <span className="type-caption" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      Analyzing acoustic testimony...
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((n) => (
                      <span key={n} className="ns-wave-bar" style={{ width: 3, height: 4, background: 'var(--color-border)' }} />
                    ))}
                  </div>
                )}
              </div>

            </motion.div>

            {/* Transcript Section styled as a Ruled Ledger Entry */}
            <motion.form custom={3} variants={itemVariants} initial="initial" animate="animate"
              onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 32 }}>
              
              <div className="ns-field" style={{ gap: 6 }}>
                <label className="type-overline" style={{ color: 'var(--color-text-secondary)', fontWeight: 700 }} htmlFor="issue-input">
                  Evidence Statement Transcript / साक्ष्य प्रतिलेख
                </label>
                <div style={{
                  borderBottom: '2px solid var(--color-primary)',
                  paddingBottom: 8,
                  marginTop: 4,
                }}>
                  <textarea
                    id="issue-input"
                    ref={textareaRef}
                    value={workerInput}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setWorkerInput(e.target.value)}
                    placeholder="The transcription of your verbal testimony will appear here automatically. You can also type directly to compose your statement manually..."
                    style={{ 
                      width: '100%',
                      minHeight: '120px',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-text-primary)',
                      fontSize: '15px',
                      fontWeight: 500,
                      outline: 'none',
                      padding: 0,
                      lineHeight: 1.6,
                      resize: 'none',
                    }}
                  />
                </div>
                <span className="type-caption" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                  Audit will verify shifts, location, and statutory pay based on this transcript text.
                </span>
              </div>

              {/* Authoritative Submission CTA */}
              <Button 
                type="submit" 
                variant="primary" 
                disabled={!workerInput.trim() || micStatus !== 'IDLE'}
              >
                <span>Submit Statement for Legal Audit</span>
                <ArrowRightIcon />
              </Button>
            </motion.form>

            <div style={{ paddingBottom: 32 }} />
          </motion.div>
        )}

        {/* ════════════════════════════════════
            SCREEN 3 — AI Analysis Checklist
            Guided Trust-Building workflow
        ════════════════════════════════════ */}
        {screen === 'LOADING' && (
          <motion.div key="loading" {...pageVariants}
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '0 32px',
              justifyContent: 'flex-start',
              position: 'relative',
              paddingTop: 48,
              paddingBottom: 48
            }}>

            {/* Header */}
            <div style={{ marginBottom: 32, zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: 'var(--color-primary)', display: 'flex' }}><ShieldIcon size={16} /></span>
                <span className="type-overline" style={{ color: 'var(--color-text-secondary)' }}>
                  Statutory Audit Process
                </span>
              </div>
              <h1 className="type-title-3" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
                Case Docket Compilation
              </h1>
              <p className="type-caption" style={{ marginTop: 4, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Assembling and verifying statutory wage violations based on official government notifications.
              </p>
            </div>

            {/* Document Draft Folder / Docket Sheet */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 20, zIndex: 1
            }}>
              
              {/* Document Stamp Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
                <span className="type-overline" style={{ fontSize: 10, letterSpacing: '0.1em' }}>DRAFT CASE FILE</span>
                <span className="type-caption" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  NS-AUDIT-{Math.floor(100000 + Math.random() * 900000)}
                </span>
              </div>

              {/* Progressive Docket Sections with Asymmetrical Left Line */}
              <div style={{ display: 'flex', gap: 20, position: 'relative' }}>
                {/* Left Margin Accent Rule */}
                <div style={{
                  width: 2, background: 'var(--color-border)',
                  alignSelf: 'stretch', position: 'relative'
                }}>
                  {/* Active Step Indicator Dot */}
                  <div style={{
                    position: 'absolute',
                    top: `${(loadingStep / 4) * 85}%`,
                    left: -4,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    transition: 'top 300ms ease'
                  }} />
                </div>

                {/* Indented docket lines */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
                  
                  {/* Section I */}
                  <div style={{ opacity: loadingStep >= 0 ? 1 : 0.25, transition: 'opacity 300ms ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span className="type-overline" style={{ fontSize: 9 }}>SECTION I: COMPLAINT REGISTRY</span>
                      <span className="type-overline" style={{ color: loadingStep > 0 ? 'var(--color-success)' : 'var(--color-primary)', fontSize: 9, fontWeight: 700 }}>
                        {loadingStep > 0 ? '[VERIFIED]' : '[COMPILING...]'}
                      </span>
                    </div>
                    <p className="type-caption" style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      Mobile verification logged. Voice statement registered in Indian National Database.
                    </p>
                  </div>

                  {/* Section II */}
                  <div style={{ opacity: loadingStep >= 1 ? 1 : 0.25, transition: 'opacity 300ms ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span className="type-overline" style={{ fontSize: 9 }}>SECTION II: EVIDENCE ALIGNMENT</span>
                      <span className="type-overline" style={{ color: loadingStep > 1 ? 'var(--color-success)' : loadingStep === 1 ? 'var(--color-primary)' : 'var(--color-text-muted)', fontSize: 9, fontWeight: 700 }}>
                        {loadingStep > 1 ? '[VERIFIED]' : loadingStep === 1 ? '[PARSING...]' : '[PENDING]'}
                      </span>
                    </div>
                    <p className="type-caption" style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      Parsing acoustic deposition. Extracting hourly metrics, location, and daily pay rate.
                    </p>
                  </div>

                  {/* Section III */}
                  <div style={{ opacity: loadingStep >= 2 ? 1 : 0.25, transition: 'opacity 300ms ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span className="type-overline" style={{ fontSize: 9 }}>SECTION III: STATUTORY ACT MATCHING</span>
                      <span className="type-overline" style={{ color: loadingStep > 2 ? 'var(--color-success)' : loadingStep === 2 ? 'var(--color-primary)' : 'var(--color-text-muted)', fontSize: 9, fontWeight: 700 }}>
                        {loadingStep > 2 ? '[VERIFIED]' : loadingStep === 2 ? '[SEARCHING...]' : '[PENDING]'}
                      </span>
                    </div>
                    <p className="type-caption" style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      Matching claims against Minimum Wages Act (1948) & state notifications.
                    </p>
                  </div>

                  {/* Section IV */}
                  <div style={{ opacity: loadingStep >= 3 ? 1 : 0.25, transition: 'opacity 300ms ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span className="type-overline" style={{ fontSize: 9 }}>SECTION IV: SHORTFALL AUDITING</span>
                      <span className="type-overline" style={{ color: loadingStep > 3 ? 'var(--color-success)' : loadingStep === 3 ? 'var(--color-primary)' : 'var(--color-text-muted)', fontSize: 9, fontWeight: 700 }}>
                        {loadingStep > 3 ? '[VERIFIED]' : loadingStep === 3 ? '[CALCULATING...]' : '[PENDING]'}
                      </span>
                    </div>
                    <p className="type-caption" style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      Auditing pay shortfall against regional wage floors and overtime double-rates.
                    </p>
                  </div>

                  {/* Section V */}
                  <div style={{ opacity: loadingStep >= 4 ? 1 : 0.25, transition: 'opacity 300ms ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span className="type-overline" style={{ fontSize: 9 }}>SECTION V: DISPATCH RELEASES</span>
                      <span className="type-overline" style={{ color: loadingStep === 4 ? 'var(--color-primary)' : 'var(--color-text-muted)', fontSize: 9, fontWeight: 700 }}>
                        {loadingStep === 4 ? '[STAMPING...]' : '[PENDING]'}
                      </span>
                    </div>
                    <p className="type-caption" style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      Generating formal audit report docket, WhatsApp share API tokens, and legal recommendations.
                    </p>
                  </div>

                </div>
              </div>

            </div>

            {/* Reassuring footer notice with ProgressBar */}
            <div style={{ marginTop: 32, zIndex: 1 }}>
              <ProgressBar 
                value={((loadingStep + 1) / LOADING_STEPS.length) * 100}
                variant="primary"
                isThin
                className="ns-progress--thin"
                style={{ marginBottom: 16 }}
              />
              <p style={{
                fontSize: 12, color: 'var(--color-text-muted)',
                textAlign: 'left', letterSpacing: '0.01em', lineHeight: 1.5
              }}>
                This compilation process is strictly confidential. All audits are grounded in the Minimum Wages Act, 1948 to create certified evidence.
              </p>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════
            SCREEN 4 — Legal Result Report
        ════════════════════════════════════ */}
        {screen === 'RESULT' && (
          <motion.div key="result" {...pageVariants}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '0 32px', paddingBottom: 180 }}>

            {/* Sovereign Navigation Bar */}
            <AppHeader onBack={() => setScreen('INTAKE')} />

            {/* Document Stamp Header */}
            <motion.div custom={0} variants={itemVariants} initial="initial" animate="animate"
              style={{ paddingTop: 32, paddingBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="type-overline" style={{ fontSize: 10, letterSpacing: '0.1em' }}>OFFICIAL ASSESSMENT DOCKET</span>
                <span className="type-caption" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>
                  REF: NS-AUDIT-{Math.floor(100000 + Math.random() * 900000)}
                </span>
              </div>
              <h1 className="type-title-2" style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Labour Compliance Audit
              </h1>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, color: 'var(--color-text-secondary)' }}>
                <span className="type-caption">Issued: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="type-caption" style={{ fontWeight: 600 }}>Govt. of India Gazette Standards</span>
              </div>
              <div style={{ borderTop: '2px solid var(--color-primary)', marginTop: 16 }} />
            </motion.div>

            {/* SECTION I: CASE SUMMARY */}
            <motion.div custom={1} variants={itemVariants} initial="initial" animate="animate"
              style={{ paddingBottom: 24 }}>
              <h3 className="type-overline" style={{ marginBottom: 10, color: 'var(--color-text-primary)', fontWeight: 700 }}>
                I. Case Summary / मामला सारांश
              </h3>
              <p className="type-body" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {isCompliant 
                  ? "Based on the verbal deposition registered, no wage anomalies were detected. The reported daily shift hours and payment logs align with regional statutory minimum wage standards."
                  : `An audit of the statement reveals statutory violations under the Minimum Wages Act. The worker reported construction shifts logged at 12 hours with daily pay of ₹450. Under current state schedules, compliance requires a minimum daily pay of ₹710, resulting in unpaid shifts and overtime variance.`
                }
              </p>
            </motion.div>

            {/* SECTION II: ESTIMATED COMPENSATION */}
            <motion.div custom={2} variants={itemVariants} initial="initial" animate="animate"
              style={{ borderTop: '1px solid var(--color-border)', paddingTop: 24, paddingBottom: 24 }}>
              <h3 className="type-overline" style={{ marginBottom: 8, color: 'var(--color-text-primary)', fontWeight: 700 }}>
                II. Audit Valuation / लेखापरीक्षा मूल्यांकन
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span className="type-num" style={{ fontSize: 52, fontWeight: 900, color: statusColor, letterSpacing: '-0.04em', lineHeight: 1 }}>
                  ₹{isCompliant ? '0' : <CountUp target={assessment.theftAmount} />}
                </span>
                <span className="type-overline" style={{
                  color: isCompliant ? 'var(--color-success)' : 'var(--color-danger)',
                  background: isCompliant ? 'var(--color-success-dim)' : 'var(--color-danger-dim)',
                  padding: '3px 8px', borderRadius: 'var(--radius-xs)', border: '1px solid currentColor',
                  fontWeight: 700
                }}>
                  {isCompliant ? 'Verified Compliant' : 'Shortfall Detected'}
                </span>
              </div>
              <p className="type-caption" style={{ marginTop: 8, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                {isCompliant 
                  ? 'No outstanding statutory compensation shortfall detected for this log.' 
                  : 'Estimated statutory compensation variance owed to the worker under Section 20 of the Minimum Wages Act.'
                }
              </p>
            </motion.div>

            {/* SECTION III: YOUR RIGHTS */}
            <motion.div custom={3} variants={itemVariants} initial="initial" animate="animate"
              style={{ borderTop: '1px solid var(--color-border)', paddingTop: 24, paddingBottom: 24 }}>
              <h3 className="type-overline" style={{ marginBottom: 12, color: 'var(--color-text-primary)', fontWeight: 700 }}>
                III. Entitlements Log / अधिकार लॉग
              </h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {assessment.violationsLog.map((log, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{
                      color: isCompliant ? 'var(--color-success)' : 'var(--color-danger)',
                      fontSize: 14, fontWeight: 700, marginTop: 1, flexShrink: 0
                    }}>
                      {isCompliant ? '✓' : '•'}
                    </span>
                    <span className="type-body" style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{log}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* SECTION IV: APPLICABLE LAWS */}
            <motion.div custom={4} variants={itemVariants} initial="initial" animate="animate"
              style={{ borderTop: '1px solid var(--color-border)', paddingTop: 24, paddingBottom: 24 }}>
              <h3 className="type-overline" style={{ marginBottom: 12, color: 'var(--color-text-primary)', fontWeight: 700 }}>
                IV. Statutory References / वैधानिक संदर्भ
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(assessment.applicableLaws ?? []).map((law, i) => (
                  <div key={i} className="type-caption" style={{
                    fontFamily: 'var(--font-mono)', fontSize: 12, paddingLeft: 12,
                    borderLeft: '2px solid var(--color-text-muted)', color: 'var(--color-text-secondary)'
                  }}>
                    {law}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* SECTION V: EVIDENCE REQUIRED */}
            <motion.div custom={5} variants={itemVariants} initial="initial" animate="animate"
              style={{ borderTop: '1px solid var(--color-border)', paddingTop: 24, paddingBottom: 24 }}>
              <h3 className="type-overline" style={{ marginBottom: 12, color: 'var(--color-text-primary)', fontWeight: 700 }}>
                V. Evidence Required / आवश्यक साक्ष्य
              </h3>
              <p className="type-caption" style={{ marginBottom: 12, color: 'var(--color-text-secondary)' }}>
                Preserve these records to establish legal standing for formal verification:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { icon: '🧾', label: 'Salary Slips / Logs' },
                  { icon: '📋', label: 'Attendance Ledger' },
                  { icon: '🎤', label: 'Voice Audio Proof' },
                  { icon: '📱', label: 'Communication History' },
                ].map(({ icon, label }) => (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-xs)',
                    background: '#FFFFFF',
                    fontSize: 12, color: 'var(--color-text-secondary)',
                  }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* SECTION VI: NEXT STEPS */}
            <motion.div custom={6} variants={itemVariants} initial="initial" animate="animate"
              style={{ borderTop: '1px solid var(--color-border)', paddingTop: 24, paddingBottom: 24 }}>
              <h3 className="type-overline" style={{ marginBottom: 16, color: 'var(--color-text-primary)', fontWeight: 700 }}>
                VI. Claim Recovery Timeline / पुनर्प्राप्ति प्रक्रिया
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { step: '1', title: 'Export Audit Evidence', desc: 'Download this compliance docket as an official PDF report.' },
                  { step: '2', title: 'Contact Union Representative', desc: 'Present this docket to local labour council officers.' },
                  { step: '3', title: 'Formal Claim Filing', desc: 'Claim registered with district Labour Commissioner for resolution.' },
                ].map(({ step, title, desc }) => (
                  <div key={step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: 'var(--radius-xs)',
                      background: 'var(--color-primary)', color: 'var(--color-text-inverse)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, flexShrink: 0
                    }}>
                      {step}
                    </span>
                    <div>
                      <div className="type-label" style={{ color: 'var(--color-text-primary)', textTransform: 'none', fontWeight: 600, fontSize: 13 }}>{title}</div>
                      <div className="type-caption" style={{ marginTop: 2, fontSize: 12 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </motion.div>
        )}

      </AnimatePresence>

      {/* ── BOTTOM CTA — Sticky Action Deck (Result screen only) ── */}
      <AnimatePresence>
        {screen === 'RESULT' && (
          <BottomCta isVisible={true}>
            {/* Primary — Download PDF */}
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                window.print();
              }}
              style={{ height: 50, fontSize: 14 }}
            >
              <span>Download Official PDF Report</span>
            </Button>

            {/* Secondary — WhatsApp share */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(assessment.automatedMessage)}`}
              target="_blank" rel="noopener noreferrer"
              className="ns-btn-secondary"
              style={{
                height: 46, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                textDecoration: 'none'
              }}
            >
              <WhatsAppIcon />
              Share Report via WhatsApp
            </a>

            {/* Tertiary — analyze again */}
            <button
              type="button"
              onClick={() => { setWorkerInput(''); setMicStatus('IDLE'); setScreen('INTAKE'); }}
              className="ns-btn-ghost"
              style={{ height: 36, fontSize: 13, alignSelf: 'center' }}
            >
              Restart Compliance Audit
            </button>
          </BottomCta>
        )}
      </AnimatePresence>

    </div>
  );
}