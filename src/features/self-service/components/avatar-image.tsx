"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";

export function AvatarImage({ version, size = "sm" }: { version: number; size?: "sm" | "lg" }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [version]);
  const large = size === "lg";
  return <span aria-label="Ảnh đại diện của tôi" role="img"
    className={`inline-flex shrink-0 items-center justify-center overflow-hidden bg-emerald-50 text-emerald-800 ${large ? "h-20 w-20 rounded-2xl" : "h-8 w-8 rounded-full"}`}>
    {broken ? <UserRound aria-hidden="true" size={large ? 30 : 17}/> :
      // Authenticated same-origin private image proxy. Do not use a public bucket.
      <img src={`/api/me/avatar?v=${version}`} alt=""
        className="h-full w-full object-cover" onError={() => setBroken(true)} />}
  </span>;
}
