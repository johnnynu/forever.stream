import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Search, Video, Bell } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="w-full bg-background border-b">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
          <span className="text-xl font-semibold">Forever.stream</span>
        </div>
        
        {/* Center section */}
        <div className="flex-grow max-w-2xl px-4">
          <div className="relative w-full">
            <Input 
              type="text" 
              placeholder="Search" 
              className="w-full pr-10"
            />
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
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;