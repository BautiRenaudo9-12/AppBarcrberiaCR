import { useRef, useCallback, useEffect } from "react";
import { gsap } from "gsap";

export function useCounter(target: number, duration = 1) {
    const countRef = useRef<HTMLSpanElement | null>(null);
    const objRef = useRef({ val: 0 });
    const tweenRef = useRef<gsap.core.Tween | null>(null);

    const animate = useCallback(() => {
        if (!countRef.current || target === 0) return;

        if (tweenRef.current) tweenRef.current.kill();

        objRef.current.val = 0;
        tweenRef.current = gsap.to(objRef.current, {
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

    const setRef = useCallback((node: HTMLSpanElement | null) => {
        countRef.current = node;
        if (node) animate();
    }, [animate]);

    useEffect(() => {
        animate();
    }, [animate]);

    return setRef;
}