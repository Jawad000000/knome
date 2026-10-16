import React, { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  isAccent: boolean;
  pulsePhase: number;
  pulseSpeed: number;
  isCrosshair: boolean;
}

export const NeuralCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let nodes: Node[] = [];

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Track pointer with gentle damping
    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      radius: 140,
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    const handlePointerLeave = () => {
      mouse.targetX = -9999;
      mouse.targetY = -9999;
    };

    // Initialize nodes with asymmetrical distribution
    const initNodes = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);

      // Node count scaled gracefully with screen width (capped for performance)
      const count = Math.min(52, Math.max(28, Math.floor(width / 26)));
      nodes = [];

      for (let i = 0; i < count; i++) {
        // Bias nodes toward upper-right quadrant & center for an asymmetrical, editorial aesthetic
        const biasedU = Math.random();
        const biasedV = Math.random();

        // 65% biased toward right and upper half, 35% evenly spread
        const x =
          Math.random() > 0.35
            ? width * (0.35 + biasedU * 0.6)
            : width * biasedU;
        const y =
          Math.random() > 0.35
            ? height * (0.1 + biasedV * 0.75)
            : height * biasedV;

        const isAccent = Math.random() < 0.16; // Restrained cyan accent
        const isCrosshair = !isAccent && Math.random() < 0.14;

        nodes.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.32,
          radius: isAccent ? 2.6 : isCrosshair ? 1.5 : 1.4 + Math.random() * 1.2,
          baseAlpha: isAccent ? 0.9 : 0.45 + Math.random() * 0.35,
          isAccent,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.018 + Math.random() * 0.02,
          isCrosshair,
        });
      }
    };

    const drawCrosshair = (
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      alpha: number,
    ) => {
      context.save();
      context.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
      context.lineWidth = 0.8;
      context.beginPath();
      context.moveTo(x - size, y);
      context.lineTo(x + size, y);
      context.moveTo(x, y - size);
      context.lineTo(x, y + size);
      context.stroke();
      context.restore();
    };

    const render = () => {
      // Smooth mouse easing
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      const connectionDistance = Math.min(135, width * 0.28);
      const accentConnectionDistance = connectionDistance * 1.15;

      // Update positions
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (!prefersReducedMotion) {
          node.x += node.vx;
          node.y += node.vy;
          node.pulsePhase += node.pulseSpeed;

          // Gentle bounce off boundaries with soft margin
          const pad = 20;
          if (node.x < pad) {
            node.x = pad;
            node.vx *= -1;
          } else if (node.x > width - pad) {
            node.x = width - pad;
            node.vx *= -1;
          }
          if (node.y < pad) {
            node.y = pad;
            node.vy *= -1;
          } else if (node.y > height - pad) {
            node.y = height - pad;
            node.vy *= -1;
          }

          // Subtle pointer avoidance/deflection
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const distToMouse = Math.hypot(dx, dy);
          if (distToMouse < mouse.radius && distToMouse > 0) {
            const force = (1 - distToMouse / mouse.radius) * 0.8;
            node.x += (dx / distToMouse) * force * 1.5;
            node.y += (dy / distToMouse) * force * 1.5;
          }
        }
      }

      // Draw subtle geometric facets (triangles) between close triplets
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d1 = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d1 > connectionDistance * 0.75) continue;

          for (let k = j + 1; k < nodes.length; k++) {
            const d2 = Math.hypot(nodes[j].x - nodes[k].x, nodes[j].y - nodes[k].y);
            const d3 = Math.hypot(nodes[k].x - nodes[i].x, nodes[k].y - nodes[i].y);

            if (d2 < connectionDistance * 0.75 && d3 < connectionDistance * 0.75) {
              const hasAccent =
                nodes[i].isAccent || nodes[j].isAccent || nodes[k].isAccent;
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.lineTo(nodes[k].x, nodes[k].y);
              ctx.closePath();

              // Refined geometric fill: whisper-thin tint
              ctx.fillStyle = hasAccent
                ? "rgba(0, 229, 255, 0.022)"
                : "rgba(148, 163, 184, 0.018)";
              ctx.fill();
            }
          }
        }
      }

      // Draw connecting lines
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          const maxDist =
            a.isAccent || b.isAccent
              ? accentConnectionDistance
              : connectionDistance;

          if (dist < maxDist) {
            const ratio = 1 - dist / maxDist;
            const alpha = ratio * ratio * 0.38;

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);

            if (a.isAccent || b.isAccent) {
              ctx.strokeStyle = `rgba(0, 195, 220, ${alpha * 1.2})`;
              ctx.lineWidth = 0.85;
            } else {
              ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
              ctx.lineWidth = 0.65;
            }
            ctx.stroke();
          }
        }
      }

      // Draw nodes and accents
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (node.isCrosshair) {
          drawCrosshair(ctx, node.x, node.y, 4, node.baseAlpha * 0.6);
          continue;
        }

        if (node.isAccent) {
          const pulse = (Math.sin(node.pulsePhase) + 1) * 0.5;

          // Quantum aura rings
          ctx.beginPath();
          ctx.arc(node.x, node.y, 5 + pulse * 6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 229, 255, ${0.18 * (1 - pulse)})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Outer halo
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 229, 255, 0.16)";
          ctx.fill();

          // Solid core
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = "#00D2EA";
          ctx.fill();
        } else {
          // Standard clinical grey node
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100, 116, 139, ${node.baseAlpha})`;
          ctx.fill();
        }
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    initNodes();
    render();

    const resizeObserver = new ResizeObserver(() => {
      initNodes();
      if (prefersReducedMotion) {
        render();
      }
    });

    const parent = canvas.parentElement;
    if (parent) {
      resizeObserver.observe(parent);
      parent.addEventListener("mousemove", handlePointerMove);
      parent.addEventListener("mouseleave", handlePointerLeave);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      resizeObserver.disconnect();
      if (parent) {
        parent.removeEventListener("mousemove", handlePointerMove);
        parent.removeEventListener("mouseleave", handlePointerLeave);
      }
    };
  }, []);

  return (
    <div className="neural-canvas-wrapper" aria-hidden="true">
      <canvas ref={canvasRef} className="neural-canvas" />
    </div>
  );
};
