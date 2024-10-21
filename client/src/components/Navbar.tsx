import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Search } from "lucide-react";
import SignInButton from "./SignInButton";
import { onAuthStateChangedHelper } from "../firebase/firebase";
import { User } from "firebase/auth";
import Upload from "./Upload";

const Navbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedHelper((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <nav className="w-full bg-background border-b">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-2 lg:w-1/4">
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
          <span className="text-xl font-semibold hidden sm:inline">
            Forever.stream
          </span>
        </div>

        {/* Center section */}
        <div className="flex justify-center lg:w-1/2">
          <div className="relative w-full max-w-md">
            <Input type="text" placeholder="Search" className="w-full pr-10" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2 lg:w-1/4 justify-end">
          {user && <Upload />}
          <SignInButton user={user} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
