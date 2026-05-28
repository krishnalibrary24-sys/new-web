'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

interface Academic3DProps {
    className?: string;
    interactive?: boolean;
    autoRotate?: boolean;
    props?: string[];
}

const Academic3DProps: React.FC<Academic3DProps> = ({
    className = '',
    interactive = true,
    autoRotate = true,
    props = ['book', 'scroll', 'globe', 'quill', 'lamp', 'trophy']
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number>(0);
    const sceneRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        objects: THREE.Object3D[];
    } | null>(null);

    const [isInitialized, setIsInitialized] = useState(false);

    const academicColors = React.useMemo(() => ({
        book: 0x1a237e,
        scroll: 0x5d4037,
        globe: 0x0277bd,
        quill: 0x8d6e63,
        lamp: 0xffb300,
        trophy: 0xffd600,
        default: 0x3949ab
    }), []);

    const createPropGeometry = useCallback((type: string): THREE.BufferGeometry | THREE.Group => {
        switch (type) {
            case 'book': return new THREE.BoxGeometry(2, 0.3, 1.5);
            case 'scroll': return new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
            case 'globe': return new THREE.SphereGeometry(0.8, 32, 32);
            case 'quill':
                const quillGroup = new THREE.Group();
                const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.01, 1.5, 8));
                shaft.position.y = 0.75;
                quillGroup.add(shaft);
                const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 8));
                tip.position.y = 1.65;
                quillGroup.add(tip);
                return quillGroup;
            case 'lamp':
                const lampGroup = new THREE.Group();
                const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.2, 16));
                base.position.y = 0.1;
                lampGroup.add(base);
                const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8));
                stem.position.y = 1.0;
                lampGroup.add(stem);
                const shade = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.8, 16));
                shade.position.y = 1.9;
                lampGroup.add(shade);
                return lampGroup;
            case 'trophy':
                const trophyGroup = new THREE.Group();
                const tBase = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.2, 16));
                tBase.position.y = 0.1;
                trophyGroup.add(tBase);
                const tStem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8));
                tStem.position.y = 0.6;
                trophyGroup.add(tStem);
                const cup = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16));
                cup.position.y = 1.2;
                trophyGroup.scale.set(0.8, 0.8, 0.8);
                trophyGroup.add(cup);
                return trophyGroup;
            default: return new THREE.BoxGeometry(1, 1, 1);
        }
    }, []);

    useEffect(() => {
        const currentContainer = containerRef.current;
        if (!currentContainer) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        scene.fog = new THREE.Fog(0x0a0a1a, 5, 30);
        const camera = new THREE.PerspectiveCamera(50, currentContainer.clientWidth / currentContainer.clientHeight, 0.1, 1000);
        camera.position.set(0, 2, 10);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(currentContainer.clientWidth, currentContainer.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        currentContainer.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dLight = new THREE.DirectionalLight(0xffffff, 1);
        dLight.position.set(5, 10, 7);
        scene.add(dLight);

        const objects: THREE.Object3D[] = [];
        const radius = 4;
        const angleStep = (2 * Math.PI) / props.length;

        props.forEach((propType, index) => {
            const angle = index * angleStep;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const geom = createPropGeometry(propType);
            const color = academicColors[propType as keyof typeof academicColors] || academicColors.default;
            let object: THREE.Object3D;

            if (geom instanceof THREE.BufferGeometry) {
                object = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.3, emissive: color, emissiveIntensity: 0.1 }));
            } else {
                object = geom;
                object.traverse((child) => {
                    if (child instanceof THREE.Mesh) child.material = new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.4 });
                });
            }
            object.position.set(x, 0, z);
            object.rotation.y = angle;
            scene.add(object);
            objects.push(object);
        });

        const platform = new THREE.Mesh(new THREE.CylinderGeometry(radius + 2, radius + 2, 0.2, 32), new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.2, roughness: 0.8 }));
        platform.position.y = -0.2;
        scene.add(platform);

        let targetRotationX = 0;
        let targetRotationY = 0;

        const animateLoop = () => {
            requestRef.current = requestAnimationFrame(animateLoop);
            if (autoRotate) {
                camera.position.x = Math.sin(Date.now() * 0.0005) * 10;
                camera.position.z = Math.cos(Date.now() * 0.0005) * 10;
            } else if (interactive) {
                camera.position.x = Math.sin(targetRotationX) * 10;
                camera.position.z = Math.cos(targetRotationX) * 10;
                camera.position.y = 2 + targetRotationY * 3;
            }
            camera.lookAt(0, 0, 0);
            objects.forEach((obj, i) => {
                const time = Date.now() * 0.001;
                obj.position.y = Math.sin(time + i) * 0.3;
                obj.rotation.y += 0.005;
            });
            renderer.render(scene, camera);
        };

        sceneRef.current = { scene, camera, renderer, objects };
        animateLoop();
        setIsInitialized(true);

        const handleResize = () => {
            if (!currentContainer) return;
            camera.aspect = currentContainer.clientWidth / currentContainer.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentContainer.clientWidth, currentContainer.clientHeight);
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!interactive || !currentContainer) return;
            const rect = currentContainer.getBoundingClientRect();
            targetRotationX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            targetRotationY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        };

        window.addEventListener('resize', handleResize);
        if (interactive) window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (currentContainer && renderer.domElement) currentContainer.removeChild(renderer.domElement);
            renderer.dispose();
            objects.forEach(obj => {
                obj.traverse(child => {
                    if (child instanceof THREE.Mesh) {
                        child.geometry.dispose();
                        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                        else child.material.dispose();
                    }
                });
            });
        };
    }, [interactive, autoRotate, props, academicColors, createPropGeometry]);

    return (
        <div className={`relative ${className}`}>
            <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden" style={{ minHeight: '500px' }} />
            {!isInitialized && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-2xl">
                    <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                        <p>Loading Academic Collection...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Academic3DProps;
