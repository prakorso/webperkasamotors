import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class lists, resolving conflicts in favor of the later class. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
