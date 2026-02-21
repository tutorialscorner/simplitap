import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, LayoutDashboard, CreditCard, Menu, X, ChevronRight, ShoppingCart, ShoppingBag } from "lucide-react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useCart } from "@/context/CartContext";
import logo from "@/assets/simplify-tap-logo.png";



export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { cartCount, setIsCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const [isPlusUser, setIsPlusUser] = useState(false);

  // Check if user is on Plus plan (Premium but NOT Team)
  useEffect(() => {
    if (!isSignedIn) {
      setIsPlusUser(false);
      return;
    }

    const checkPlanStatus = () => {
      try {
        const savedData = localStorage.getItem("user_card_data");
        if (savedData) {
          const data = JSON.parse(savedData);
          const isTeam = !!data.team_id;
          const isPremium = !!data.isPremium;

          // Hide Plus link ONLY if user is Plus (Premium + No Team)
          // If Team or Basic, show it.
          if (isPremium && !isTeam) {
            setIsPlusUser(true);
          } else {
            setIsPlusUser(false);
          }
        }
      } catch (e) {
        // Ignore error
      }
    };

    checkPlanStatus();

    // Listen for updates from other components
    window.addEventListener('storage', checkPlanStatus);
    window.addEventListener('local-storage-update', checkPlanStatus);

    return () => {
      window.removeEventListener('storage', checkPlanStatus);
      window.removeEventListener('local-storage-update', checkPlanStatus);
    };
  }, [location.pathname, user, isSignedIn]); // Re-check on nav change

  const navLinks = [
    { name: "NFC Products", href: "/nfc" },
    { name: "Pricing", href: "/pricing" },
    { name: "Contact", href: "/contact" },
    // Only show Team Dashboard if user has a team_id (checked via isTeam derived from checking isPremium+isTeam logic above, but let's refine)
  ];

  // Logic to determine if "Team Dashboard" should be shown
  // The existing checkPlanStatus sets isPlusUser. We need a state for isTeamUser.
  const [isTeamUser, setIsTeamUser] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setIsTeamUser(false);
      return;
    }
    const checkTeam = () => {
      try {
        const savedData = localStorage.getItem("user_card_data");
        if (savedData) {
          const data = JSON.parse(savedData);
          setIsTeamUser(!!data.team_id);
        }
      } catch (e) { }
    };
    checkTeam();
    window.addEventListener('local-storage-update', checkTeam);
    return () => window.removeEventListener('local-storage-update', checkTeam);
  }, [isSignedIn]);

  if (isTeamUser) {
    navLinks.push({ name: "Team Dashboard", href: "/teams" });
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300 animate-navbar-slide-down">
      <div className="container mx-auto px-4 h-16 md:h-24 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 -ml-2 text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <Link to="/" className="flex items-center">
            <img src={logo} alt="Simplify Tap" className="h-10 w-auto object-contain md:h-16" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={`text-sm font-medium transition-colors hover:text-foreground ${location.pathname === link.href ? "text-foreground" : "text-muted-foreground"
                }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop & Mobile Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative hidden md:flex" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart className="w-5 h-5 text-foreground" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Button>
          {isLoaded && isSignedIn && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={user.imageUrl} alt={user.firstName || ""} />
                    <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link to="/orders">
                  <DropdownMenuItem>
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    <span>My Orders</span>
                  </DropdownMenuItem>
                </Link>
                <Link to="/dashboard">
                  <DropdownMenuItem>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                </Link>
                <Link to="/profile">
                  <DropdownMenuItem>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Edit Digital Card</span>
                  </DropdownMenuItem>
                </Link>
                <Link to="/username-claim">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Choose Username</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/signin" className="hidden md:block">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/create">
                <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90 text-white">
                  Create free card
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border shadow-2xl animate-in slide-in-from-top-5 fade-in duration-200">
          <div className="flex flex-col p-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`flex items-center justify-between p-4 rounded-xl transition-colors ${location.pathname === link.href
                  ? "bg-muted font-semibold text-foreground"
                  : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
              >
                <span className="text-base">{link.name}</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </Link>
            ))}

            {!isSignedIn && (
              <div className="pt-4 mt-2 border-t border-border">
                <Link to="/signin">
                  <Button variant="ghost" className="w-full justify-start h-12 text-base">Sign In</Button>
                </Link>
              </div>
            )}
            {/* Mobile Cart Link */}
            <div className="px-4 py-2 border-t border-border mt-2 cursor-pointer" onClick={() => { setIsCartOpen(true); setIsMobileMenuOpen(false); }}>
              <div className="flex items-center justify-between text-base font-medium text-foreground">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart
                </span>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                  {cartCount} items
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
