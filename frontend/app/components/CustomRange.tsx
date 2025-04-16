import React, { useCallback, useEffect, useState, useRef, forwardRef } from "react";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  defaultRange?: [number, number];
  onChange: (range: { min: number; max: number }) => void;
}

const PriceRangeSlider = forwardRef<{ resetRange: () => void }, PriceRangeSliderProps>(
  ({ min, max, defaultRange = [min, max], onChange }, ref) => {
    const [minVal, setMinVal] = useState<number>(defaultRange[0]);
    const [maxVal, setMaxVal] = useState<number>(defaultRange[1]);
    const rangeRef = useRef<HTMLDivElement | null>(null);
    const isDraggingMin = useRef(false);
    const isDraggingMax = useRef(false);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    // Convert value to percentage
    const getPercent = useCallback(
      (value: number): number => ((value - min) / (max - min)) * 100,
      [min, max]
    );

    // Update range bar position
    useEffect(() => {
      if (rangeRef.current) {
        const minPercent = getPercent(minVal);
        const maxPercent = getPercent(maxVal);

        rangeRef.current.style.left = `${minPercent}%`;
        rangeRef.current.style.width = `${maxPercent - minPercent}%`;
      }
    }, [minVal, maxVal, getPercent]);

    // Debounced onChange trigger
    const triggerOnChange = useCallback(() => {
      if (!isDraggingMin.current && !isDraggingMax.current) {
        onChange({ min: minVal, max: maxVal });
      }
    }, [minVal, maxVal, onChange]);

    // Trigger onChange after a short delay
    useEffect(() => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

      debounceTimeout.current = setTimeout(() => {
        triggerOnChange();
      }, 500);

      return () => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      };
    }, [minVal, maxVal, triggerOnChange]);

    // Reset the range to the default values
    const resetRange = useCallback(() => {
      setMinVal(defaultRange[0]);
      setMaxVal(defaultRange[1]);
      onChange({ min: defaultRange[0], max: defaultRange[1] });
    }, [defaultRange, onChange]);

    // Expose the resetRange method to the parent via ref
    useEffect(() => {
      if (ref) {
        (ref as React.MutableRefObject<{ resetRange: () => void }>).current = { resetRange };
      }
    }, [resetRange, ref]);

    // Handle Pointer Move (works for both mouse and touch)
    const handlePointerMove = useCallback(
      (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const sliderWidth = rangeRef.current?.parentElement?.offsetWidth || 1;
        const rect = rangeRef.current?.parentElement?.getBoundingClientRect();
        if (!rect) return;

        const offsetX = clientX - rect.left;
        const newValue = min + (offsetX / sliderWidth) * (max - min);

        if (isDraggingMin.current) {
          setMinVal((prevMinVal) => Math.min(Math.max(min, Math.round(newValue)), maxVal - 1));
        } else if (isDraggingMax.current) {
          setMaxVal((prevMaxVal) => Math.max(Math.min(max, Math.round(newValue)), minVal + 1));
        }
      },
      [min, max, minVal, maxVal]
    );

    // Stop Dragging on Pointer Up
    const handlePointerUp = useCallback(() => {
      isDraggingMin.current = false;
      isDraggingMax.current = false;
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchend", handlePointerUp);

      triggerOnChange();
    }, [handlePointerMove, triggerOnChange]);

    // Start Dragging Min
    const startDraggingMin = useCallback(() => {
      isDraggingMin.current = true;
      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("touchmove", handlePointerMove, { passive: false });
      window.addEventListener("mouseup", handlePointerUp);
      window.addEventListener("touchend", handlePointerUp);
    }, [handlePointerMove, handlePointerUp]);

    // Start Dragging Max
    const startDraggingMax = useCallback(() => {
      isDraggingMax.current = true;
      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("touchmove", handlePointerMove, { passive: false });
      window.addEventListener("mouseup", handlePointerUp);
      window.addEventListener("touchend", handlePointerUp);
    }, [handlePointerMove, handlePointerUp]);

    // Handle Input Changes
    const handleInputChange = useCallback(
      (type: "min" | "max", value: number) => {
        if (type === "min") {
          setMinVal((prevMinVal) => Math.min(value, maxVal - 1));
        } else if (type === "max") {
          setMaxVal((prevMaxVal) => Math.max(value, minVal + 1));
        }

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
          triggerOnChange();
        }, 500);
      },
      [minVal, maxVal, triggerOnChange]
    );

    return (
      <div className="w-full p-4 rounded-lg">
        {/* Slider Container */}
        <div className="relative h-2 bg-gray-300 rounded-full">
          {/* Active Range Bar */}
          <div
            ref={rangeRef}
            className="absolute h-2 bg-primary rounded-full"
            style={{
              left: `${getPercent(minVal)}%`,
              width: `${getPercent(maxVal) - getPercent(minVal)}%`,
            }}
          ></div>

          {/* Min Handle (Left) */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 translate-x-1/2 w-5 h-5 bg-primary rounded-full shadow-md cursor-pointer touch-none"
            style={{ left: `${getPercent(minVal) - 8}%` }}
            onMouseDown={startDraggingMin}
            onTouchStart={startDraggingMin}
          ></div>

          {/* Max Handle (Right) */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 translate-x-1/2 w-5 h-5 bg-primary rounded-full shadow-md cursor-pointer touch-none"
            style={{ left: `${getPercent(maxVal) - 8}%` }}
            onMouseDown={startDraggingMax}
            onTouchStart={startDraggingMax}
          ></div>
        </div>

        {/* Min & Max Inputs */}
        <div className="flex justify-between mt-4">
          <input
            type="number"
            value={minVal}
            onChange={(e) => handleInputChange("min", Number(e.target.value))}
            className="input input-bordered input-sm w-24 text-center me-2"
            min={min}
            max={maxVal - 1}
          />
          <input
            type="number"
            value={maxVal}
            onChange={(e) => handleInputChange("max", Number(e.target.value))}
            className="input input-bordered input-sm w-24 text-center ms-2"
            min={minVal + 1}
            max={max}
          />
        </div>
      </div>
    );
  }
);

export default PriceRangeSlider;