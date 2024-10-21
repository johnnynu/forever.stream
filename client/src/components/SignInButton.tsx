import { Button } from "@/components/ui/button";
import { signInWithGoogle, signOut } from "../firebase/firebase";
import { FaGoogle } from "react-icons/fa";
import { User } from "firebase/auth";

interface SignInProps {
  user: User | null;
}

const SignInButton = ({ user }: SignInProps) => {
  return (
    <>
      {user ? (
        // if user is signed in
        <Button onClick={signOut} variant="outline">
          Sign Out
        </Button>
      ) : (
        <Button onClick={signInWithGoogle} variant="outline">
          <FaGoogle className="mr-2" />
          Sign in with Google
        </Button>
      )}
    </>
  );
};

export default SignInButton;
