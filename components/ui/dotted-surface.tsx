'use client';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'>;

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
	const { theme } = useTheme();
	const containerRef = useRef<HTMLDivElement>(null);
	const sceneRef = useRef<{
		scene: THREE.Scene;
		renderer: THREE.WebGLRenderer;
		points: THREE.Points;
		geometry: THREE.BufferGeometry;
		material: THREE.PointsMaterial;
	} | null>(null);

	useEffect(() => {
		const currentContainer = containerRef.current;
		if (!currentContainer) return;

		let animationId: number = 0;
		let count: number = 0;

		const SEPARATION = 150;
		const AMOUNTX = 40;
		const AMOUNTY = 60;

		const scene = new THREE.Scene();
		scene.fog = new THREE.Fog(0xffffff, 2000, 10000);

		const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
		camera.position.set(0, 355, 1220);

		const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(scene.fog.color, 0);

		currentContainer.appendChild(renderer.domElement);

		const positions = new Float32Array(AMOUNTX * AMOUNTY * 3);
		const colors = new Float32Array(AMOUNTX * AMOUNTY * 3);

		let i = 0;
		for (let ix = 0; ix < AMOUNTX; ix++) {
			for (let iy = 0; iy < AMOUNTY; iy++) {
				positions[i * 3] = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
				positions[i * 3 + 1] = 0;
				positions[i * 3 + 2] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;
				const colorVal = theme === 'dark' ? 0.8 : 0;
				colors[i * 3] = colorVal;
				colors[i * 3 + 1] = colorVal;
				colors[i * 3 + 2] = colorVal;
				i++;
			}
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

		const material = new THREE.PointsMaterial({
			size: 8,
			vertexColors: true,
			transparent: true,
			opacity: 0.8,
		});

		const points = new THREE.Points(geometry, material);
		scene.add(points);
		sceneRef.current = { scene, renderer, points, geometry, material };

		const animate = () => {
			animationId = requestAnimationFrame(animate);
			const posAttr = geometry.attributes.position;
			const posArray = posAttr.array as Float32Array;
			let idx = 0;
			for (let ix = 0; ix < AMOUNTX; ix++) {
				for (let iy = 0; iy < AMOUNTY; iy++) {
					posArray[idx * 3 + 1] = Math.sin((ix + count) * 0.3) * 50 + Math.sin((iy + count) * 0.5) * 50;
					idx++;
				}
			}
			posAttr.needsUpdate = true;
			renderer.render(scene, camera);
			count += 0.1;
		};

		const handleResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		};

		window.addEventListener('resize', handleResize);
		animate();

		return () => {
			window.removeEventListener('resize', handleResize);
			cancelAnimationFrame(animationId);
			if (sceneRef.current) {
				const { scene: s, renderer: r, points: p, geometry: g, material: m } = sceneRef.current;
				s.remove(p);
				g.dispose();
				m.dispose();
				r.dispose();
				if (currentContainer && r.domElement) {
					currentContainer.removeChild(r.domElement);
				}
			}
		};
	}, [theme]);

	return (
		<div
			ref={containerRef}
			className={cn('pointer-events-none fixed inset-0 -z-10', className)}
			{...props}
		/>
	);
}
