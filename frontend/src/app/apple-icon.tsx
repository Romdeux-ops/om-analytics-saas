import { ImageResponse } from "next/og";
import { BrandMark, ogOptions } from "@/src/lib/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return new ImageResponse(<BrandMark size={size.width} />, await ogOptions(size));
}
