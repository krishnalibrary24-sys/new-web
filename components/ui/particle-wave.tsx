'use client';
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface ParticleWaveProps {
  className?: string;
}

const ParticleWave: React.FC<ParticleWaveProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: THREE.Points;
    particleMaterial: THREE.ShaderMaterial;
    mouse: THREE.Vector2;
  } | null>(null);

  const getCurrentTheme = () => {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const particleVertex = `
      attribute float scale;
      uniform float uTime;
      void main() {
        vec3 p = position;
        float s = scale;
        p.y += (sin(p.x + uTime) * 0.5) + (cos(p.y + uTime) * 0.1) * 2.0;
        p.x += (sin(p.y + uTime) * 0.5);
        s += (sin(p.x + uTime) * 0.5) + (cos(p.y + uTime) * 0.1) * 2.0;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = s * 15.0 * (1.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const particleFragment = `
      uniform vec3 uColor;
      uniform vec2 uMouse;
      void main() {
        float dist = distance(gl_FragCoord.xy, uMouse);
        float radius = 350.0;
        float alpha = 1.0 - smoothstep(0.0, radius, dist);
        if (alpha <= 0.02) discard;
        gl_FragColor = vec4(uColor, alpha * 0.7);
      }
    `;

    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(75, winWidth / winHeight, 0.01, 1000);
    camera.position.set(0, 6, 5);
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(winWidth, winHeight);

    const gap = 0.3;
    const amountX = 200;
    const amountY = 200;
    const particleNum = amountX * amountY;
    const particlePositions = new Float32Array(particleNum * 3);
    const particleScales = new Float32Array(particleNum);
    
    let k = 0;
    let s = 0;
    for (let ix = 0; ix < amountX; ix++) {
      for (let iy = 0; iy < amountY; iy++) {
        particlePositions[k] = ix * gap - ((amountX * gap) / 2);
        particlePositions[k + 1] = 0;
        particlePositions[k + 2] = iy * gap - ((amountX * gap) / 2);
        particleScales[s] = 1;
        k += 3;
        s++;
      }
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('scale', new THREE.BufferAttribute(particleScales, 1));

    const initialTheme = getCurrentTheme();
    const particleMaterial = new THREE.ShaderMaterial({
      transparent: true,
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: initialTheme === 'dark' ? new THREE.Vector3(0.6, 0.7, 1.0) : new THREE.Vector3(0.0, 0.0, 0.0) },
        uMouse: { value: new THREE.Vector2(-10000, -10000) }
      }
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const mouse = new THREE.Vector2(-10000, -10000);

    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      particleMaterial.uniforms.uTime.value += 0.05;
      const theme = getCurrentTheme();
      particleMaterial.uniforms.uColor.value = theme === 'dark' ? new THREE.Vector3(0.6, 0.7, 1.0) : new THREE.Vector3(0.0, 0.0, 0.0);
      const bgColor = theme === 'dark' ? new THREE.Color(0x060e20) : new THREE.Color(0xffffff);
      renderer.setClearColor(bgColor);
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    };

    sceneRef.current = { scene, camera, renderer, particles, particleMaterial, mouse };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const pixelRatio = window.devicePixelRatio;
      particleMaterial.uniforms.uMouse.value.x = e.clientX * pixelRatio;
      particleMaterial.uniforms.uMouse.value.y = (window.innerHeight - e.clientY) * pixelRatio;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestRef.current);
      if (sceneRef.current) {
        scene.remove(particles);
        particleGeometry.dispose();
        particleMaterial.dispose();
        renderer.dispose();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`block ${className}`}
      style={{ width: '100vw', height: '100vh', margin: 0, overflow: 'hidden' }}
    />
  );
};

export { ParticleWave };
