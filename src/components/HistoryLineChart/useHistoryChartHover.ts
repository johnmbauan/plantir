import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { PlotPoint } from "./types";
import { clientXToChartX, nearestIndex } from "./utils";

export function useHistoryChartHover(plotPoints: PlotPoint[]) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const hover = hoverIndex != null ? plotPoints[hoverIndex] : null;

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    setHoverIndex(nearestIndex(plotPoints, clientXToChartX(event.clientX, svgRef.current)));
  }

  function handlePointerLeave() {
    setHoverIndex(null);
  }

  return { svgRef, hover, handlePointerMove, handlePointerLeave };
}
