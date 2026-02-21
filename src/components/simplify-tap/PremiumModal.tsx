import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Crown } from "lucide-react";

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const features = [
  "Remove Simplify Tap branding",
  "Add company logo",
  "Custom themes & styling",
  "Custom QR code",
  "Export contacts",
  "AI paper card scanner",
  "Profile switcher (2 profiles)",
];

export const PremiumModal = ({ open, onOpenChange }: PremiumModalProps) => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  const handleUpgrade = () => {
    onOpenChange(false);
    if (!isSignedIn) {
      navigate("/create");
      return;
    }
    navigate("/pricing");
  };

  const handleCompare = () => {
    onOpenChange(false);
    window.scrollTo(0, 0);
    navigate("/pricing");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-accent" />
            <DialogTitle className="text-xl font-bold text-foreground">
              Why Go Plus?
            </DialogTitle>
          </div>
          <p className="text-muted-foreground">
            Unlock customization and professional tools to stand out.
          </p>
        </DialogHeader>

        <div className="py-4">
          <ul className="space-y-3 mb-6">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-accent" />
                </div>
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-foreground">Simplify Tap Plus</span>
              <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                Most Popular
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Everything you need to stand out professionally.
            </p>
          </div>

          <Button onClick={handleUpgrade} className="w-full mb-2" size="lg">
            Get Plus
          </Button>

          <Button
            variant="ghost"
            onClick={handleCompare}
            className="w-full mb-3 text-sm text-slate-500 font-medium"
          >
            Compare Plans
          </Button>

          <button
            onClick={() => onOpenChange(false)}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Continue with Free →
          </button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Upgrade anytime. No data loss.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
