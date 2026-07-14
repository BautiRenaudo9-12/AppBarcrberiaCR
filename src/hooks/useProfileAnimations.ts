import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import {
    prefersReducedMotion,
    isRouteTransitionRecent,
    shouldPlayProfileEntrance,
    markProfileEntrancePlayed,
} from "@/lib/motion";

export function useProfileAnimations() {
    const pageRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const page = pageRef.current;
        if (!page) return;

        if (prefersReducedMotion()) return;

        // Solo la primera vez que se abre la app: al volver a Perfil no se repite.
        if (!shouldPlayProfileEntrance()) return;
        markProfileEntrancePlayed();

        const ctx = gsap.context(() => {
            const headerItems = page!.querySelectorAll("[data-header-stagger]");
            const avatarCircle = page!.querySelector("[data-avatar-circle]");
            const avatarText = page!.querySelector("[data-avatar-text]");
            const profileName = page!.querySelector("[data-profile-name]");
            const profileRole = page!.querySelector("[data-profile-role]");
            const sections = page!.querySelectorAll("[data-section]");

            const tl = gsap.timeline({ delay: isRouteTransitionRecent() ? 0 : 0.15 });

            tl.fromTo(headerItems, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.35, stagger: 0.06, ease: "power3.out" });

            if (avatarCircle) {
                tl.fromTo(avatarCircle, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "elastic.out(1, 0.6)" }, "-=0.15");
            }

            if (avatarText) {
                tl.fromTo(avatarText, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, "-=0.3");
            }

            if (profileName) {
                tl.fromTo(profileName, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, "-=0.15");
            }

            if (profileRole) {
                tl.fromTo(profileRole, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power3.out" }, "-=0.1");
            }

            sections.forEach((section) => {
                const label = section.querySelector("[data-section-label]");
                const card = section.querySelector("[data-section-card]");
                const items = section.querySelectorAll("[data-section-item]");

                if (label) {
                    tl.fromTo(label, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.25, ease: "power3.out" }, `-=${0.05}`);
                }

                if (card) {
                    tl.fromTo(card, { opacity: 0, y: 16, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" }, `-=${0.1}`);
                }

            if (items.length > 0) {
                tl.fromTo(items, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.25, stagger: 0.04, ease: "power3.out" }, `-=${0.15}`);
            }
        });

        const logoutBtn = page!.querySelector("[data-logout-btn]");
        if (logoutBtn) {
            tl.fromTo(logoutBtn, { opacity: 0, y: 12, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" }, `-=${0.1}`);
        }
    }, page);

        return () => ctx.revert();
    }, []);

    return pageRef;
}