import { ImageResponse } from "next/og";
import { BrandMark, ogOptions } from "@/src/lib/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  return new ImageResponse(<BrandMark size={size.width} />, await ogOptions(size));
}
