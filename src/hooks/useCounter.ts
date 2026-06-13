import { useRef, useEffect } from "react";
import { gsap } from "gsap";

export function useCounter(target: number, duration = 1) {
    const countRef = useRef<HTMLSpanElement>(null);
    const objRef = useRef({ val: 0 });

    useEffect(() => {
        if (!countRef.current || target === 0) return;

        objRef.current.val = 0;
        gsap.to(objRef.current, {
            val: target,
            duration,
            snap: { val: 1 },
            ease: "power2.out",
            onUpdate: () => {
                if (countRef.current) {
                    countRef.current.textContent = String(Math.round(objRef.current.val));
                }
            },
        });
    }, [target, duration]);

    return countRef;
}