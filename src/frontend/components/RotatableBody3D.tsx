// src/frontend/components/RotatableBody3D.tsx
// Gerçek 3D WebGL (Three.js) İnsan Beden Modeli & Morfolojik Ölçüm Simülatörü
// - 360° Mouse / Dokunmatik Döndürme, Açı Butonları ve Otomatik Turntable
// - Mezura Ölçülerine Göre 3D Büyüyen/Küçülen Beden (Göbek Bombesi, Bel Genişlemesi, Kol/Bacak Hipertrofisi)
// - 15 Bölge Doktora Tezi Isı Haritası (Kırmızı: Yağlanma, Mavi: Kas Eksikliği, Yeşil: İdeal Denge)
// - 3D Üzerine Tıklama (Raycasting) ile Doğrudan Bölge Seçimi

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlay, FaPause, FaInfoCircle, FaHandPointer, FaRedo,
  FaCheck, FaExclamationTriangle, FaArrowUp, FaArrowDown, FaCube
} from 'react-icons/fa';
import type { Gender, BodyMeasurements, ValidMeasurementKey } from '../services/bodyProfileService';
import { MEASUREMENT_LABELS } from '../services/bodyProfileService';
import type { RegionalDiagnosis } from '../data/bodyScienceData';

interface RotatableBody3DProps {
  gender: Gender;
  measurements: BodyMeasurements;
  heightCm: number;
  weightKg: number;
  selectedKey: ValidMeasurementKey | null;
  onSelectKey: (key: ValidMeasurementKey) => void;
  diagnoses: Record<ValidMeasurementKey, RegionalDiagnosis>;
}

// 3D Bölge Eşleşmeleri
const REGION_KEY_LIST: ValidMeasurementKey[] = [
  'neckCm',
  'shoulderCm',
  'chestCm',
  'upperAbdomenCm',
  'waistCm',
  'lowerAbdomenCm',
  'hipCm',
  'upperArmLeftCm',
  'upperArmRightCm',
  'forearmLeftCm',
  'forearmRightCm',
  'thighLeftCm',
  'thighRightCm',
  'calfLeftCm',
  'calfRightCm',
];

export function RotatableBody3D({
  gender,
  measurements,
  heightCm,
  weightKg,
  selectedKey,
  onSelectKey,
  diagnoses,
}: RotatableBody3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Açı state'i (0° - 360°)
  const [angle, setAngle] = useState<number>(0);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [hoveredKey, setHoveredKey] = useState<ValidMeasurementKey | null>(null);

  // Drag / Pointer rotasyon referansları
  const isDraggingRef = useRef<boolean>(false);
  const dragDistanceRef = useRef<number>(0);
  const lastPointerXRef = useRef<number>(0);
  const angleRef = useRef<number>(0);
  angleRef.current = angle;

  const isAutoRotatingRef = useRef<boolean>(false);
  isAutoRotatingRef.current = isAutoRotating;

  // Three.js nesne referansları
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const bodyGroupRef = useRef<THREE.Group | null>(null);
  const meshMapRef = useRef<Map<ValidMeasurementKey, THREE.Mesh[]>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const animFrameIdRef = useRef<number | null>(null);

  // Morfolojik hesaplamalar
  const morph = useMemo(() => {
    const scale = heightCm > 0 ? heightCm / 175 : 1;
    const isMale = gender === 'male';

    const waist = measurements.waistCm || 0;
    const lowerAbdomen = measurements.lowerAbdomenCm || waist;
    const chest = measurements.chestCm || 0;
    const shoulder = measurements.shoulderCm || 0;
    const upperArm = ((measurements.upperArmLeftCm || 0) + (measurements.upperArmRightCm || 0)) / 2;
    const thigh = ((measurements.thighLeftCm || 0) + (measurements.thighRightCm || 0)) / 2;
    const calf = ((measurements.calfLeftCm || 0) + (measurements.calfRightCm || 0)) / 2;

    // Bel genişliği çarpanı (1.0 = normal)
    const baseWaist = (isMale ? 78 : 68) * scale;
    const waistFactor = waist > 0 ? Math.max(0.75, Math.min(1.7, 1 + (waist - baseWaist) * 0.012)) : 1.0;

    // Alt karın göbek bombesi (Z ekseni ileri fırlama)
    const baseAbdomen = (isMale ? 82 : 74) * scale;
    const bellyProtrusion = lowerAbdomen > 0 ? Math.max(0, Math.min(0.28, (lowerAbdomen - baseAbdomen) * 0.0065)) : 0;

    // Göğüs & Omuz
    const baseChest = (isMale ? 102 : 92) * scale;
    const chestFactor = chest > 0 ? Math.max(0.8, Math.min(1.5, 1 + (chest - baseChest) * 0.009)) : 1.0;

    const baseShoulder = (isMale ? 120 : 102) * scale;
    const shoulderFactor = shoulder > 0 ? Math.max(0.8, Math.min(1.45, 1 + (shoulder - baseShoulder) * 0.008)) : 1.0;

    // Kol & Bacak
    const baseArm = (isMale ? 36 : 29) * scale;
    const armFactor = upperArm > 0 ? Math.max(0.75, Math.min(1.65, 1 + (upperArm - baseArm) * 0.013)) : 1.0;

    const baseThigh = (isMale ? 58 : 54) * scale;
    const thighFactor = thigh > 0 ? Math.max(0.8, Math.min(1.6, 1 + (thigh - baseThigh) * 0.011)) : 1.0;

    const baseCalf = (isMale ? 37 : 34) * scale;
    const calfFactor = calf > 0 ? Math.max(0.8, Math.min(1.5, 1 + (calf - baseCalf) * 0.012)) : 1.0;

    const hasExcessWaist =
      diagnoses.waistCm?.status === 'excess_fat' || diagnoses.lowerAbdomenCm?.status === 'excess_fat';

    return {
      waistFactor,
      bellyProtrusion,
      chestFactor,
      shoulderFactor,
      armFactor,
      thighFactor,
      calfFactor,
      hasExcessWaist,
    };
  }, [gender, heightCm, measurements, diagnoses]);

  // Teşhis rengi çözümleyici
  const getRegionColor = useCallback(
    (key: ValidMeasurementKey) => {
      const diag = diagnoses[key];
      if (!diag || diag.status === 'not_entered') {
        return gender === 'male' ? '#0ea5e9' : '#f43f5e'; // Normal atletik beden rengi
      }
      return diag.hexColor;
    },
    [diagnoses, gender]
  );

  // ── Three.js Sahnesini Başlat ────────────────────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = 480;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.1, 4.3);
    camera.lookAt(0, 0.05, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.className = 'w-full h-[480px] block pointer-events-none';
    rendererRef.current = renderer;

    // Canvas'ı dinamik olarak mount et
    container.appendChild(renderer.domElement);

    // 4. Lighting (Stüdyo Anatomik Işıklandırma)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    // Ön Ana Işık
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(2, 3, 4);
    scene.add(keyLight);

    // Yan Dolgu Işığı
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    fillLight.position.set(-3, 1, 2);
    scene.add(fillLight);

    // Arka Rim Işığı (Vurgulayıcı Neon Kenar Parıltısı)
    const rimLight = new THREE.DirectionalLight(gender === 'male' ? 0xf59e0b : 0xf43f5e, 1.2);
    rimLight.position.set(0, 2, -3);
    scene.add(rimLight);

    // 5. 3D Holografik Zemin Halkaları (Pedestal)
    const gridGroup = new THREE.Group();
    const ringGeo1 = new THREE.RingGeometry(0.85, 0.88, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    ringMesh1.rotation.x = Math.PI / 2;
    ringMesh1.position.y = -1.55;
    gridGroup.add(ringMesh1);

    const ringGeo2 = new THREE.RingGeometry(1.15, 1.17, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.x = Math.PI / 2;
    ringMesh2.position.y = -1.55;
    gridGroup.add(ringMesh2);

    scene.add(gridGroup);

    // 6. 3D Beden Grubu
    const bodyGroup = new THREE.Group();
    scene.add(bodyGroup);
    bodyGroupRef.current = bodyGroup;

    // Resize Observer
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth || 400;
      const h = 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Render Döngüsü
    let lastTime = performance.now();
    let lastStateUpdate = 0;
    const renderLoop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Otomatik Turntable Dönüşü
      if (isAutoRotatingRef.current) {
        angleRef.current = (angleRef.current + dt * 45) % 360;
        if (now - lastStateUpdate > 100) {
          lastStateUpdate = now;
          setAngle(Math.round(angleRef.current));
        }
      }

      // Grubu hedef açıya yumuşakça eşle
      if (bodyGroupRef.current) {
        const rad = (angleRef.current * Math.PI) / 180;
        bodyGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          bodyGroupRef.current.rotation.y,
          rad,
          0.15
        );
      }

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // ── 3D Beden Geometrisini & Materyallerini Oluştur / Güncelle ──
  useEffect(() => {
    const bodyGroup = bodyGroupRef.current;
    if (!bodyGroup) return;

    // Önceki nesneleri temizle
    while (bodyGroup.children.length > 0) {
      const obj = bodyGroup.children[0] as THREE.Mesh;
      if (obj.geometry) obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else if (obj.material) {
        obj.material.dispose();
      }
      bodyGroup.remove(obj);
    }

    const meshMap = new Map<ValidMeasurementKey, THREE.Mesh[]>();
    meshMapRef.current = meshMap;

    const isMale = gender === 'male';

    // ── Materyal Fabrikası (Satin Athletic Titanium Mannequin & Glowing Heatmap) ──
    const createMaterial = (key: ValidMeasurementKey) => {
      const colorHex = getRegionColor(key);
      const isSelected = selectedKey === key;
      const isHovered = hoveredKey === key;
      const diagStatus = diagnoses[key]?.status;
      const isFatExcess = diagStatus === 'excess_fat';
      const isOptimal = diagStatus === 'optimal';
      const isUnderdeveloped = diagStatus === 'underdeveloped';

      const emissiveColor = isSelected
        ? '#fbbf24' // Altın sarısı seçili vurgusu
        : isHovered
          ? '#f59e0b' // Canlı amber hover
          : isFatExcess
            ? '#f43f5e' // Kırmızı/Pembe termal yağ uyarısı
            : isUnderdeveloped
              ? '#0284c7' // Mavi kas gelişim uyarısı
              : isOptimal
                ? '#10b981' // Zümrüt yeşili ideal denge
                : colorHex;

      const emissiveIntensity = isSelected
        ? 0.85
        : isHovered
          ? 0.55
          : isFatExcess || isUnderdeveloped || isOptimal
            ? 0.35
            : 0.12;

      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorHex),
        roughness: 0.28,
        metalness: 0.18,
        emissive: new THREE.Color(emissiveColor),
        emissiveIntensity,
      });
    };

    const registerMesh = (mesh: THREE.Mesh, key: ValidMeasurementKey) => {
      mesh.userData = { key };
      if (!meshMap.has(key)) meshMap.set(key, []);
      meshMap.get(key)!.push(mesh);
      bodyGroup.add(mesh);
    };

    // ── 1. Kafa & Yüz Konturu (Anatomik Kafatası ve Çene Yapısı) ──
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.44, 0);

    // Üst Kafatası (Cranium)
    const craniumGeo = new THREE.SphereGeometry(0.18, 32, 32);
    craniumGeo.scale(0.86, 1.10, 0.96);
    const headMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(isMale ? '#38bdf8' : '#fb7185'),
      roughness: 0.32,
      metalness: 0.15,
      emissive: new THREE.Color(isMale ? '#0284c7' : '#e11d48'),
      emissiveIntensity: 0.15,
    });
    const craniumMesh = new THREE.Mesh(craniumGeo, headMat);
    headGroup.add(craniumMesh);

    // Çene ve Yüz Konturu (Jawline / Chin)
    const jawGeo = new THREE.ConeGeometry(0.13, 0.15, 32);
    jawGeo.scale(0.85, 1.0, 0.80);
    const jawMesh = new THREE.Mesh(jawGeo, headMat);
    jawMesh.rotation.x = Math.PI - 0.12; // Çene açısı
    jawMesh.position.set(0, -0.09, 0.035);
    headGroup.add(jawMesh);

    bodyGroup.add(headGroup);

    // ── 2. Boyun & Trapez Kasları (Neck & Trapezius - neckCm) ──
    // Boyun Sütunu
    const neckGeo = new THREE.CylinderGeometry(0.082, 0.098, 0.16, 32);
    const neckMesh = new THREE.Mesh(neckGeo, createMaterial('neckCm'));
    neckMesh.position.set(0, 1.25, 0.015);
    neckMesh.rotation.x = 0.05; // Doğal hafif öne eğim
    registerMesh(neckMesh, 'neckCm');

    // Trapez Kas Eğimi (Boyundan omuza akıcı kas geçişi)
    const trapGeo = new THREE.CylinderGeometry(0.09, 0.22, 0.12, 32);
    trapGeo.scale(1.15, 1.0, 0.72);
    const trapMesh = new THREE.Mesh(trapGeo, createMaterial('neckCm'));
    trapMesh.position.set(0, 1.16, -0.02);
    registerMesh(trapMesh, 'neckCm');

    // ── 3. Omuzlar & Deltoid Kasları (Shoulders - shoulderCm) ──
    const shoulderWidth = (isMale ? 0.44 : 0.36) * morph.shoulderFactor;
    const deltoidRadius = 0.108 * morph.shoulderFactor;

    // Sol Deltoid (Omuz başı damlası)
    const deltoidGeoL = new THREE.CapsuleGeometry(deltoidRadius, 0.11, 16, 24);
    const deltoidMeshL = new THREE.Mesh(deltoidGeoL, createMaterial('shoulderCm'));
    deltoidMeshL.position.set(-shoulderWidth, 1.06, 0);
    deltoidMeshL.rotation.z = 0.22;
    registerMesh(deltoidMeshL, 'shoulderCm');

    // Sağ Deltoid
    const deltoidGeoR = new THREE.CapsuleGeometry(deltoidRadius, 0.11, 16, 24);
    const deltoidMeshR = new THREE.Mesh(deltoidGeoR, createMaterial('shoulderCm'));
    deltoidMeshR.position.set(shoulderWidth, 1.06, 0);
    deltoidMeshR.rotation.z = -0.22;
    registerMesh(deltoidMeshR, 'shoulderCm');

    // ── 4. Göğüs & Üst Toraks (Chest / Pectorals - chestCm) ──
    const chestWidth = (isMale ? 0.38 : 0.33) * morph.chestFactor;
    const chestDepth = (isMale ? 0.22 : 0.23) * morph.chestFactor;

    // Toraks Gövde Tabanı
    const thoraxGeo = new THREE.CylinderGeometry(chestWidth * 1.04, chestWidth * 0.94, 0.28, 32);
    thoraxGeo.scale(1.0, 1.0, chestDepth / (chestWidth * 1.04));
    const thoraxMesh = new THREE.Mesh(thoraxGeo, createMaterial('chestCm'));
    thoraxMesh.position.set(0, 0.99, 0);
    registerMesh(thoraxMesh, 'chestCm');

    if (isMale) {
      // Erkek İkiz Göğüs Kasları (Dual Pectoral Plates with Sternal Cleft)
      const pecWidth = chestWidth * 0.44;
      const pecGeoL = new THREE.BoxGeometry(pecWidth, 0.18, 0.08);
      const pecMeshL = new THREE.Mesh(pecGeoL, createMaterial('chestCm'));
      pecMeshL.position.set(-pecWidth * 0.54, 1.01, chestDepth * 0.44);
      pecMeshL.rotation.y = 0.14;
      pecMeshL.rotation.z = -0.04;
      registerMesh(pecMeshL, 'chestCm');

      const pecGeoR = new THREE.BoxGeometry(pecWidth, 0.18, 0.08);
      const pecMeshR = new THREE.Mesh(pecGeoR, createMaterial('chestCm'));
      pecMeshR.position.set(pecWidth * 0.54, 1.01, chestDepth * 0.44);
      pecMeshR.rotation.y = -0.14;
      pecMeshR.rotation.z = 0.04;
      registerMesh(pecMeshR, 'chestCm');
    } else {
      // Kadın Doğal Göğüs Anatomisi (Sculpted Contoured Bust)
      const bustRadius = 0.122 * morph.chestFactor;
      const bustGeoL = new THREE.SphereGeometry(bustRadius, 32, 32);
      bustGeoL.scale(0.95, 1.05, 1.25);
      const bustMeshL = new THREE.Mesh(bustGeoL, createMaterial('chestCm'));
      bustMeshL.position.set(-chestWidth * 0.32, 0.99, chestDepth * 0.38);
      registerMesh(bustMeshL, 'chestCm');

      const bustGeoR = new THREE.SphereGeometry(bustRadius, 32, 32);
      bustGeoR.scale(0.95, 1.05, 1.25);
      const bustMeshR = new THREE.Mesh(bustGeoR, createMaterial('chestCm'));
      bustMeshR.position.set(chestWidth * 0.32, 0.99, chestDepth * 0.38);
      registerMesh(bustMeshR, 'chestCm');
    }

    // ── 5. Üst Karın & Kaburga Kemeri (Upper Abdomen - upperAbdomenCm) ──
    const upperAbsWidth = (isMale ? 0.33 : 0.28) * morph.waistFactor;
    const upperAbsGeo = new THREE.CylinderGeometry(upperAbsWidth * 1.04, upperAbsWidth * 0.96, 0.20, 32);
    upperAbsGeo.scale(1.0, 1.0, 0.82);
    const upperAbsMesh = new THREE.Mesh(upperAbsGeo, createMaterial('upperAbdomenCm'));
    upperAbsMesh.position.set(0, 0.77, 0.005);
    registerMesh(upperAbsMesh, 'upperAbdomenCm');

    // ── 6. Bel & Yan Kaslar (Waist / Obliques - waistCm) ──
    const waistWidth = (isMale ? 0.30 : 0.25) * morph.waistFactor;
    const waistGeo = new THREE.CylinderGeometry(upperAbsWidth * 0.96, waistWidth * 1.02, 0.18, 32);
    waistGeo.scale(1.0, 1.0, 0.80);
    const waistMesh = new THREE.Mesh(waistGeo, createMaterial('waistCm'));
    waistMesh.position.set(0, 0.59, 0);
    registerMesh(waistMesh, 'waistCm');

    // ── 7. Alt Karın & Göbek Bombesi (Lower Abdomen - lowerAbdomenCm) ──
    const lowerAbsGeo = new THREE.SphereGeometry(waistWidth * 1.02, 32, 32);
    lowerAbsGeo.scale(
      1.0,
      0.68,
      0.88 + morph.bellyProtrusion * 3.6
    );
    const lowerAbsMesh = new THREE.Mesh(lowerAbsGeo, createMaterial('lowerAbdomenCm'));
    lowerAbsMesh.position.set(0, 0.43, 0.02 + morph.bellyProtrusion);
    registerMesh(lowerAbsMesh, 'lowerAbdomenCm');

    // ── 8. Kalça & Pelvis (Hips & Glutes - hipCm) ──
    const hipWidth = isMale ? 0.35 : 0.42;
    // Ön/Ana Pelvis Kuşağı
    const hipGeo = new THREE.CylinderGeometry(waistWidth * 1.02, hipWidth, 0.24, 32);
    hipGeo.scale(1.0, 1.0, 0.96);
    const hipMesh = new THREE.Mesh(hipGeo, createMaterial('hipCm'));
    hipMesh.position.set(0, 0.25, 0);
    registerMesh(hipMesh, 'hipCm');

    // Arka Kalça Kasları (Gluteus Maximus Çift Kavis)
    const gluteRadius = hipWidth * 0.44;
    const gluteGeoL = new THREE.SphereGeometry(gluteRadius, 24, 24);
    gluteGeoL.scale(0.96, 1.15, 1.18);
    const gluteMeshL = new THREE.Mesh(gluteGeoL, createMaterial('hipCm'));
    gluteMeshL.position.set(-hipWidth * 0.25, 0.22, -0.10);
    registerMesh(gluteMeshL, 'hipCm');

    const gluteGeoR = new THREE.SphereGeometry(gluteRadius, 24, 24);
    gluteGeoR.scale(0.96, 1.15, 1.18);
    const gluteMeshR = new THREE.Mesh(gluteGeoR, createMaterial('hipCm'));
    gluteMeshR.position.set(hipWidth * 0.25, 0.22, -0.10);
    registerMesh(gluteMeshR, 'hipCm');

    // ── 9. Üst Kollar (Biceps / Triceps - upperArmLeftCm / upperArmRightCm) ──
    const armRadius = (isMale ? 0.082 : 0.068) * morph.armFactor;
    const armLength = 0.22 * morph.armFactor;

    // Sol Üst Kol (Pürüzsüz Kapsül Geometrisi)
    const upperArmGeoL = new THREE.CapsuleGeometry(armRadius, armLength, 16, 24);
    upperArmGeoL.scale(1.0, 1.0, 1.12); // Pazu şişkinliği
    const upperArmMeshL = new THREE.Mesh(upperArmGeoL, createMaterial('upperArmLeftCm'));
    upperArmMeshL.position.set(-(shoulderWidth + armRadius * 0.72), 0.86, 0);
    upperArmMeshL.rotation.z = 0.12; // Rahat A-pose duruşu
    registerMesh(upperArmMeshL, 'upperArmLeftCm');

    // Sağ Üst Kol
    const upperArmGeoR = new THREE.CapsuleGeometry(armRadius, armLength, 16, 24);
    upperArmGeoR.scale(1.0, 1.0, 1.12);
    const upperArmMeshR = new THREE.Mesh(upperArmGeoR, createMaterial('upperArmRightCm'));
    upperArmMeshR.position.set(shoulderWidth + armRadius * 0.72, 0.86, 0);
    upperArmMeshR.rotation.z = -0.12;
    registerMesh(upperArmMeshR, 'upperArmRightCm');

    // Dirsek Eklemleri (Pürüzsüz Geçiş)
    const elbowRadius = armRadius * 0.76;
    const elbowGeo = new THREE.SphereGeometry(elbowRadius, 16, 16);
    const elbowMat = new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.35 });
    const elbowMeshL = new THREE.Mesh(elbowGeo, elbowMat);
    elbowMeshL.position.set(-(shoulderWidth + armRadius * 0.98), 0.70, 0);
    bodyGroup.add(elbowMeshL);

    const elbowMeshR = new THREE.Mesh(elbowGeo, elbowMat);
    elbowMeshR.position.set(shoulderWidth + armRadius * 0.98, 0.70, 0);
    bodyGroup.add(elbowMeshR);

    // ── 10. Ön Kollar (Forearms - forearmLeftCm / forearmRightCm) ──
    const forearmRadius = armRadius * 0.84;
    const forearmHeight = 0.28;

    // Sol Ön Kol
    const forearmGeoL = new THREE.CylinderGeometry(forearmRadius * 1.05, forearmRadius * 0.70, forearmHeight, 24);
    const forearmMeshL = new THREE.Mesh(forearmGeoL, createMaterial('forearmLeftCm'));
    forearmMeshL.position.set(-(shoulderWidth + armRadius * 1.25), 0.54, 0.01);
    forearmMeshL.rotation.z = 0.09;
    registerMesh(forearmMeshL, 'forearmLeftCm');

    // Sağ Ön Kol
    const forearmGeoR = new THREE.CylinderGeometry(forearmRadius * 1.05, forearmRadius * 0.70, forearmHeight, 24);
    const forearmMeshR = new THREE.Mesh(forearmGeoR, createMaterial('forearmRightCm'));
    forearmMeshR.position.set(shoulderWidth + armRadius * 1.25, 0.54, 0.01);
    forearmMeshR.rotation.z = -0.09;
    registerMesh(forearmMeshR, 'forearmRightCm');

    // Ergonomik Atletik Eller (Hands)
    const handGeoL = new THREE.BoxGeometry(0.045, 0.08, 0.024);
    const handMeshL = new THREE.Mesh(handGeoL, headMat);
    handMeshL.position.set(-(shoulderWidth + armRadius * 1.48), 0.36, 0.01);
    handMeshL.rotation.z = 0.08;
    bodyGroup.add(handMeshL);

    const handGeoR = new THREE.BoxGeometry(0.045, 0.08, 0.024);
    const handMeshR = new THREE.Mesh(handGeoR, headMat);
    handMeshR.position.set(shoulderWidth + armRadius * 1.48, 0.36, 0.01);
    handMeshR.rotation.z = -0.08;
    bodyGroup.add(handMeshR);

    // ── 11. Uyluklar & Kuadriseps (Thighs - thighLeftCm / thighRightCm) ──
    const thighRadius = (isMale ? 0.12 : 0.13) * morph.thighFactor;
    const thighHeight = 0.30;
    const thighOffsetX = hipWidth * 0.46;

    // Sol Uyluk Kapsülü
    const thighGeoL = new THREE.CapsuleGeometry(thighRadius, thighHeight, 16, 24);
    thighGeoL.scale(1.02, 1.0, 1.10); // Ön kuadriseps & arka hamstring kütlesi
    const thighMeshL = new THREE.Mesh(thighGeoL, createMaterial('thighLeftCm'));
    thighMeshL.position.set(-thighOffsetX, -0.14, 0.01);
    thighMeshL.rotation.z = -0.03;
    registerMesh(thighMeshL, 'thighLeftCm');

    // Sağ Uyluk Kapsülü
    const thighGeoR = new THREE.CapsuleGeometry(thighRadius, thighHeight, 16, 24);
    thighGeoR.scale(1.02, 1.0, 1.10);
    const thighMeshR = new THREE.Mesh(thighGeoR, createMaterial('thighRightCm'));
    thighMeshR.position.set(thighOffsetX, -0.14, 0.01);
    thighMeshR.rotation.z = 0.03;
    registerMesh(thighMeshR, 'thighRightCm');

    // Diz Kapağı (Patella)
    const patellaRadius = thighRadius * 0.68;
    const patellaGeo = new THREE.SphereGeometry(patellaRadius, 20, 20);
    const patellaMeshL = new THREE.Mesh(patellaGeo, elbowMat);
    patellaMeshL.position.set(-thighOffsetX, -0.40, 0.025);
    bodyGroup.add(patellaMeshL);

    const patellaMeshR = new THREE.Mesh(patellaGeo, elbowMat);
    patellaMeshR.position.set(thighOffsetX, -0.40, 0.025);
    bodyGroup.add(patellaMeshR);

    // ── 12. Baldırlar (Calves - calfLeftCm / calfRightCm) ──
    const calfRadius = (isMale ? 0.092 : 0.085) * morph.calfFactor;

    // Sol Baldır (Gastrocnemius damla formu & Aşil aşaması)
    const calfGeoL = new THREE.CapsuleGeometry(calfRadius, 0.22, 16, 24);
    calfGeoL.scale(0.96, 1.0, 1.16); // Arkaya doğru belirgin baldır kütlesi
    const calfMeshL = new THREE.Mesh(calfGeoL, createMaterial('calfLeftCm'));
    calfMeshL.position.set(-thighOffsetX, -0.63, -0.015);
    registerMesh(calfMeshL, 'calfLeftCm');

    // Sağ Baldır
    const calfGeoR = new THREE.CapsuleGeometry(calfRadius, 0.22, 16, 24);
    calfGeoR.scale(0.96, 1.0, 1.16);
    const calfMeshR = new THREE.Mesh(calfGeoR, createMaterial('calfRightCm'));
    calfMeshR.position.set(thighOffsetX, -0.63, -0.015);
    registerMesh(calfMeshR, 'calfRightCm');

    // Alt Bacak / Aşil Tendonu İnceltmesi
    const achillesGeo = new THREE.CylinderGeometry(calfRadius * 0.82, calfRadius * 0.58, 0.16, 24);
    const achillesMeshL = new THREE.Mesh(achillesGeo, createMaterial('calfLeftCm'));
    achillesMeshL.position.set(-thighOffsetX, -0.80, 0);
    registerMesh(achillesMeshL, 'calfLeftCm');

    const achillesMeshR = new THREE.Mesh(achillesGeo, createMaterial('calfRightCm'));
    achillesMeshR.position.set(thighOffsetX, -0.80, 0);
    registerMesh(achillesMeshR, 'calfRightCm');

    // ── 13. Ayaklar (Anatomik Spor Taban & Aşı Tabakası) ──
    const footGeoL = new THREE.BoxGeometry(0.10, 0.075, 0.23);
    const footMat = new THREE.MeshStandardMaterial({
      color: 0x3f3f46,
      roughness: 0.38,
      metalness: 0.25,
    });
    const footMeshL = new THREE.Mesh(footGeoL, footMat);
    footMeshL.position.set(-thighOffsetX, -0.92, 0.055);
    footMeshL.rotation.y = 0.08; // Doğal dışa dönük ayak açısı
    bodyGroup.add(footMeshL);

    const footMeshR = new THREE.Mesh(footGeoL, footMat);
    footMeshR.position.set(thighOffsetX, -0.92, 0.055);
    footMeshR.rotation.y = -0.08;
    bodyGroup.add(footMeshR);
  }, [gender, morph, selectedKey, hoveredKey, getRegionColor, diagnoses]);

  // ── 3D Sahne Üzerinde Fare ile Döndürme & Tıklama ───────────
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
    lastPointerXRef.current = e.clientX;
    setIsAutoRotating(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - lastPointerXRef.current;
      dragDistanceRef.current += Math.abs(deltaX);
      lastPointerXRef.current = e.clientX;
      setAngle(prev => (prev - deltaX * 0.75 + 360) % 360);
      return;
    }

    // Hover Raycasting
    const canvas = rendererRef.current?.domElement;
    if (!canvas || !cameraRef.current || !sceneRef.current) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(bodyGroupRef.current?.children || [], true);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const key = hit.userData?.key as ValidMeasurementKey | undefined;
      setHoveredKey(key || null);
    } else {
      setHoveredKey(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const totalDrag = dragDistanceRef.current;
    isDraggingRef.current = false;
    dragDistanceRef.current = 0;

    // Sürükleme yapıldıysa tıklama sayma
    if (totalDrag > 8) return;

    // Tıklama tespiti
    const canvas = rendererRef.current?.domElement;
    if (!canvas || !cameraRef.current || !sceneRef.current) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(bodyGroupRef.current?.children || [], true);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const key = hit.userData?.key as ValidMeasurementKey | undefined;
      if (key) {
        onSelectKey(key);
      }
    }
  };

  const normalizedAngle = ((angle % 360) + 360) % 360;

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* 3D Kontrol Çubuğu */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 p-2.5 mb-3 bg-stone-100 dark:bg-zinc-800/90 rounded-2xl border border-stone-200/60 dark:border-zinc-700/60 text-xs">
        {/* Açı Butonları */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { label: 'Ön (0°)', ang: 0 },
            { label: 'Sağ Yan (90°)', ang: 90 },
            { label: 'Arka (180°)', ang: 180 },
            { label: 'Sol Yan (270°)', ang: 270 },
          ].map(btn => (
            <button
              key={btn.ang}
              onClick={() => {
                setIsAutoRotating(false);
                setAngle(btn.ang);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                Math.abs(normalizedAngle - btn.ang) < 20
                  ? 'bg-amber-400 text-stone-950 shadow-sm font-black'
                  : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* 3D Turntable & Açı Göstergesi */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoRotating(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              isAutoRotating
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-amber-400/20 text-amber-900 dark:text-amber-300 hover:bg-amber-400/30'
            }`}
          >
            {isAutoRotating ? <FaPause className="text-[10px]" /> : <FaPlay className="text-[10px]" />}
            <span>{isAutoRotating ? 'Durdur' : '3D Döndür'}</span>
          </button>
          <span className="text-[11px] font-mono font-bold text-stone-500 dark:text-zinc-400 w-10 text-right">
            {Math.round(normalizedAngle)}°
          </span>
        </div>
      </div>

      {/* Açı Kaydırıcısı (Slider) */}
      <div className="w-full px-2 mb-3 flex items-center gap-2">
        <span className="text-[10px] font-bold text-stone-400">0°</span>
        <input
          type="range"
          min={0}
          max={359}
          value={Math.round(normalizedAngle)}
          onChange={e => {
            setIsAutoRotating(false);
            setAngle(Number(e.target.value));
          }}
          className="w-full accent-amber-400 cursor-pointer h-1.5 bg-stone-200 dark:bg-zinc-700 rounded-lg"
        />
        <span className="text-[10px] font-bold text-stone-400">360°</span>
      </div>

      {/* Isı Haritası Lejantı */}
      <div className="flex items-center justify-center gap-3 mb-2 text-[11px] font-bold">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50 animate-pulse" />
          <span className="text-stone-600 dark:text-zinc-300">Fazla Yağlanma</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-xs shadow-sky-400/50" />
          <span className="text-stone-600 dark:text-zinc-300">Kas Azlığı (Hipertrofi)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
          <span className="text-stone-600 dark:text-zinc-300">İdeal Denge</span>
        </div>
      </div>

      {/* 3D WebGL Canvas Sahnesi */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full relative flex items-center justify-center rounded-3xl overflow-hidden bg-gradient-to-b from-stone-900/5 via-stone-900/10 to-stone-900/20 dark:from-zinc-950/40 dark:via-zinc-900/40 dark:to-zinc-950/60 border border-stone-200/50 dark:border-zinc-800 cursor-grab active:cursor-grabbing touch-none"
        style={{ minHeight: '480px' }}
      >
        {/* Canlı 3D İpucu Rozeti */}
        <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 pointer-events-none shadow-md">
          <FaCube className="text-amber-400 text-xs" />
          <span>Sürükleyerek 360° İnceleyin • Bölgeye Tıklayın</span>
        </div>

        {/* Göbek Bombesi Uyarısı (Yan Profillerde 90° / 270°) */}
        {morph.bellyProtrusion > 0.05 && Math.abs(normalizedAngle - 90) < 40 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-14 right-3 bg-rose-950/90 border border-rose-500/50 text-rose-200 p-3 rounded-2xl max-w-[170px] shadow-xl text-xs backdrop-blur-md pointer-events-none"
          >
            <div className="flex items-center gap-1.5 font-black text-rose-400 mb-1">
              <FaExclamationTriangle className="text-xs shrink-0" />
              <span>Yan Profil Bombesi</span>
            </div>
            <p className="text-[10px] leading-relaxed text-rose-200/80">
              Alt karın / bel ölçüsü bazal orandan yüksek. 3D gövde öne doğru genişliyor.
            </p>
          </motion.div>
        )}

        {/* Tıklanan / Üzerine Gelinen Bölge Bilgisi (HUD) */}
        {(hoveredKey || selectedKey) && (
          <div className="absolute bottom-3 left-3 right-3 bg-stone-950/90 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-white flex items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-2.5 truncate">
              <span className="text-lg">
                {MEASUREMENT_LABELS[hoveredKey || selectedKey!]?.emoji}
              </span>
              <div className="truncate">
                <div className="text-xs font-black truncate">
                  {MEASUREMENT_LABELS[hoveredKey || selectedKey!]?.label}
                </div>
                <div className="text-[11px] font-bold text-stone-400 flex items-center gap-1.5">
                  <span>Mevcut: {measurements[hoveredKey || selectedKey!] || 0} cm</span>
                  {diagnoses?.[hoveredKey || selectedKey!]?.statusLabel && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[9px] font-black"
                      style={{
                        backgroundColor: (diagnoses[hoveredKey || selectedKey!]?.hexColor || '#71717a') + '33',
                        color: diagnoses[hoveredKey || selectedKey!]?.hexColor || '#71717a',
                      }}
                    >
                      {diagnoses[hoveredKey || selectedKey!].statusLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectKey(hoveredKey || selectedKey!)}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-stone-950 font-black text-xs hover:bg-amber-300 transition-all shrink-0 cursor-pointer shadow-sm"
            >
              Ölçüyü Düzenle
            </button>
          </div>
        )}
      </div>

      {/* 15 Bölge Hızlı Seçim Rozetleri (Grid) */}
      <div className="w-full mt-4">
        <div className="text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <FaHandPointer className="text-amber-500" />
          <span>Vücut Noktaları (Tıkla ve 3D Odaklan)</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {REGION_KEY_LIST.map(key => {
            const meta = MEASUREMENT_LABELS[key];
            const val = measurements[key];
            const diag = diagnoses[key];
            const isSelected = selectedKey === key;
            const hasVal = typeof val === 'number' && val > 0;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectKey(key)}
                className={`flex flex-col items-center text-center p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-400/15 ring-2 ring-amber-400 shadow-sm'
                    : 'border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-stone-300 dark:hover:border-zinc-700'
                }`}
              >
                <span className="text-sm mb-0.5">{meta.emoji}</span>
                <span className="font-bold text-[10.5px] truncate w-full text-stone-800 dark:text-zinc-200">
                  {meta.label}
                </span>
                <span
                  className="text-[10px] font-black mt-0.5"
                  style={{ color: diag?.hexColor || '#71717a' }}
                >
                  {hasVal ? `${val} cm` : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
