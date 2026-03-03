"use client";

import { signOut } from "next-auth/react";

interface SignOutButtonProps {
  callbackUrl: string;
  label: string;
}

export function SignOutButton({ callbackUrl, label }: SignOutButtonProps) {
  return (
    <button className="btn btn-secondary" type="button" onClick={() => void signOut({ callbackUrl })}>
      {label}
    </button>
  );
}
