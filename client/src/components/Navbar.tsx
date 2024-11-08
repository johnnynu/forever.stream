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
    <div className="w-full fixed top-0 z-50 bg-background border-b">
      <div className="flex h-16 items-center justify-between w-full px-4">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
          <span className="text-xl font-semibold hidden sm:inline">
            ForeverStream
          </span>
        </div>

        {/* Center section - Search */}
        <div className="flex max-w-[720px] w-full mx-4">
          <div className="flex w-full">
            <Input
              type="text"
              placeholder="Search"
              className="rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              variant="secondary"
              size="icon"
              className="rounded-l-none border border-l-0 h-9"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {user && <Upload />}
          <SignInButton user={user} />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
