/** Bluebook-style dashed separator (gray → light blue → soft yellow). */
export function SatDashedRule() {
  return (
    <div
      className="h-[2px] w-full shrink-0"
      aria-hidden
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, #d1d1d1 0px, #d1d1d1 5px, #b8d4f0 5px, #b8d4f0 10px, #fff3a0 10px, #fff3a0 15px, transparent 15px, transparent 17px)",
        backgroundSize: "17px 2px",
      }}
    />
  );
}
