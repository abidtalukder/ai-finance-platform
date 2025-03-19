import React from 'react'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import {Button} from "@/components/ui/button"

const Header = () => {
  return (
    <div>
      <SignedOut>
        <Button>
          <SignInButton />
        </Button>
      </SignedOut>
      <SignedIn>
        <Button>
          <UserButton />
        </Button>
      </SignedIn>
    </div>
  )
}

export default Header