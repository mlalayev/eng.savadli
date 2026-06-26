export const easeOut = [0, 0, 0.2, 1] as const;

export const fadeUpHidden = { opacity: 0, y: 12 };
export const fadeUpVisible = { opacity: 1, y: 0 };

export const fadeUpTransition = (delay = 0) => ({
  duration: 0.45,
  ease: easeOut,
  delay,
});

export const scrollViewport = { once: true, margin: "-80px" as const };

export const cardLift = {
  y: -4,
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  transition: { duration: 0.2, ease: easeOut },
};

export const buttonHover = { scale: 1.03 };
export const buttonTap = { scale: 0.98 };

export const floatTransition = (delay = 0) => ({
  duration: 5,
  repeat: Infinity,
  ease: "easeInOut" as const,
  delay,
});
