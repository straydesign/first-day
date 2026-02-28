"use client";
import Aurora from "./Aurora";
import { DayOneLogo } from "./DayOneLogo";

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
}

export function LoadingScreen({ title = "Loading your goals...", subtitle }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden">
      <div className="absolute inset-0 z-[101] w-full h-full">
        <Aurora colorStops={["#7cff67", "#00c7fc", "#5227FF"]} amplitude={1} blend={0.5} />
      </div>
      <div className="absolute inset-0 z-[105] flex items-center justify-center">
        <DayOneLogo width={300} height={150} showTagline={true} />
      </div>
    </div>
  );
}
