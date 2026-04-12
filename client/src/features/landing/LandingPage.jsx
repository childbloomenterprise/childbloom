import LandingNav from './LandingNav';
import HeroSection from './sections/HeroSection';
import TrustBar from './sections/TrustBar';
import FeaturesSection from './sections/FeaturesSection';
import HowItWorksSection from './sections/HowItWorksSection';
import SocialProofSection from './sections/SocialProofSection';
import PricingSection from './sections/PricingSection';
import FinalCTASection from './sections/FinalCTASection';
import LandingFooter from './LandingFooter';

export default function LandingPage() {
  return (
    <div className="font-sans" style={{ backgroundColor: '#F7F4EF' }}>
      <LandingNav />
      <HeroSection />
      <TrustBar />
      <FeaturesSection />
      <HowItWorksSection />
      <SocialProofSection />
      <PricingSection />
      <FinalCTASection />
      <LandingFooter />
    </div>
  );
}
