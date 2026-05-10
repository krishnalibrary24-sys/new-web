'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

interface ParallaxMouseBackgroundProps {
    className?: string;
    intensity?: number;
    layers?: number;
}

const ParallaxMouseBackground: React.FC<ParallaxMouseBackgroundProps> = ({
    className = '',
    intensity = 0.5,
    layers = 5
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number>(0);
    const sceneRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        meshes: THREE.Mesh[];
        mouse: THREE.Vector2;
        targetMouse: THREE.Vector2;
    } | null>(null);

    const [isInitialized, setIsInitialized] = useState(false);

    const layerColors = React.useMemo(() => [
        new THREE.Color(0x1a237e),
        new THREE.Color(0x283593),
        new THREE.Color(0x303f9f),
        new THREE.Color(0x3949ab),
        new THREE.Color(0x5c6bc0),
    ], []);

    const createAcademicShape = useCallback((layerIndex: number) => {
        const type = layerIndex % 4;
        switch (type) {
            case 0: 
                const b = new THREE.BoxGeometry(2, 0.3, 1.5);
                b.translate(0, 0.15, 0);
                return b;
            case 1: return new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
            case 2: 
                const q = new THREE.ConeGeometry(0.05, 0.8, 8);
                q.translate(0, 0.4, 0);
                return q;
            case 3: return new THREE.SphereGeometry(0.5, 16, 16);
            default: return new THREE.BoxGeometry(1, 1, 1);
        }
    }, []);

    useEffect(() => {
        const currentContainer = containerRef.current;
        if (!currentContainer) return;

        const width = currentContainer.clientWidth;
        const height = currentContainer.clientHeight;

        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x0a0a1a, 10, 50);
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.z = 15;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        currentContainer.appendChild(renderer.domElement);

        const meshes: THREE.Mesh[] = [];
        for (let i = 0; i < layers; i++) {
            const material = new THREE.MeshStandardMaterial({
                color: layerColors[i % layerColors.length],
                metalness: 0.3,
                roughness: 0.7,
                transparent: true,
                opacity: 0.8 - (i * 0.1),
                emissive: layerColors[i % layerColors.length],
                emissiveIntensity: 0.1
            });
            const mesh = new THREE.Mesh(createAcademicShape(i), material);
            const gridSize = Math.ceil(Math.sqrt(layers));
            mesh.position.set((i % gridSize - gridSize / 2) * 4, (Math.floor(i / gridSize) - gridSize / 2) * 3, -(i + 1) * 3);
            mesh.rotation.set(Math.random() * 0.3, Math.random() * 0.3, Math.random() * 0.3);
            mesh.scale.setScalar(0.8 + (i * 0.1));
            scene.add(mesh);
            meshes.push(mesh);
        }

        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const dLight = new THREE.DirectionalLight(0xffffff, 1);
        dLight.position.set(5, 5, 5);
        scene.add(dLight);

        const mouse = new THREE.Vector2(0, 0);
        const targetMouse = new THREE.Vector2(0, 0);

        const animateLoop = () => {
            requestRef.current = requestAnimationFrame(animateLoop);
            mouse.lerp(targetMouse, 0.05);
            camera.position.x = mouse.x * intensity * 2;
            camera.position.y = -mouse.y * intensity * 2;
            camera.lookAt(0, 0, 0);
            meshes.forEach((m, i) => {
                const df = (i + 1) / layers;
                m.position.x += (mouse.x * df * 0.5 - m.position.x * 0.01) * 0.1;
                m.position.y += (-mouse.y * df * 0.5 - m.position.y * 0.01) * 0.1;
                m.rotation.x += 0.001 * df;
                m.rotation.y += 0.002 * df;
                m.scale.setScalar(0.8 + (i * 0.1) + Math.sin(Date.now() * 0.001 + i) * 0.05 * df);
            });
            renderer.render(scene, camera);
        };

        sceneRef.current = { scene, camera, renderer, meshes, mouse, targetMouse };
        animateLoop();
        setIsInitialized(true);

        const handleResize = () => {
            camera.aspect = currentContainer.clientWidth / currentContainer.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentContainer.clientWidth, currentContainer.clientHeight);
        };

        const handleMouseMove = (e: MouseEvent) => {
            targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(requestRef.current);
            if (currentContainer && renderer.domElement) currentContainer.removeChild(renderer.domElement);
            renderer.dispose();
            meshes.forEach(m => {
                m.geometry.dispose();
                if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
                else m.material.dispose();
            });
        };
    }, [intensity, layers, layerColors, createAcademicShape]);

    return (
        <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`} style={{ pointerEvents: 'none', zIndex: -1 }}>
            {!isInitialized && <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/30" />}
        </div>
    );
};

export default ParallaxMouseBackground;
