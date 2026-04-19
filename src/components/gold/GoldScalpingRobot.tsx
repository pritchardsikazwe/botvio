import { BotvioScalpRobot } from "@/components/chart/BotvioScalpRobot";

interface GoldScalpingRobotProps {
  displaySymbol?: string;
}

/** Back-compat wrapper around the generalized BotvioScalpRobot. */
export function GoldScalpingRobot({ displaySymbol = "XAU/USD" }: GoldScalpingRobotProps) {
  return <BotvioScalpRobot displaySymbol={displaySymbol} assetLabel="Gold" />;
}
