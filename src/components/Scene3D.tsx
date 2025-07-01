import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Environment, Stars, Line } from '@react-three/drei';
import * as THREE from 'three';

interface Scene3DProps {
  mousePosition: { x: number; y: number };
  currentSection: number;
}

function NeuralNetwork({ nodeCount = 50, connectionCount = 80 }) {
  const nodesRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.Group>(null);
  
  const { nodes, connections } = useMemo(() => {
    // Generate neural network nodes
    const nodePositions = [];
    for (let i = 0; i < nodeCount; i++) {
      nodePositions.push({
        position: [
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 25
        ],
        id: i,
        activity: Math.random()
      });
    }
    
    // Generate connections between nodes
    const nodeConnections = [];
    for (let i = 0; i < connectionCount; i++) {
      const nodeA = Math.floor(Math.random() * nodeCount);
      const nodeB = Math.floor(Math.random() * nodeCount);
      if (nodeA !== nodeB) {
        nodeConnections.push({
          start: nodePositions[nodeA].position,
          end: nodePositions[nodeB].position,
          strength: Math.random()
        });
      }
    }
    
    return { nodes: nodePositions, connections: nodeConnections };
  }, [nodeCount, connectionCount]);

  useFrame((state) => {
    if (nodesRef.current) {
      // Animate neural activity
      nodesRef.current.children.forEach((node, index) => {
        const time = state.clock.elapsedTime;
        const activity = Math.sin(time * 2 + index * 0.5) * 0.5 + 0.5;
        if (node instanceof THREE.Mesh && node.material instanceof THREE.MeshBasicMaterial) {
          node.material.opacity = 0.3 + activity * 0.4;
          node.scale.setScalar(0.5 + activity * 0.3);
        }
      });
    }
    
    if (linesRef.current) {
      // Animate connection strength
      linesRef.current.children.forEach((line, index) => {
        const time = state.clock.elapsedTime;
        const pulse = Math.sin(time * 3 + index * 0.3) * 0.5 + 0.5;
        if (line instanceof THREE.Line && line.material instanceof THREE.LineBasicMaterial) {
          line.material.opacity = 0.1 + pulse * 0.2;
        }
      });
    }
  });

  return (
    <group>
      {/* Neural Nodes */}
      <group ref={nodesRef}>
        {nodes.map((node, index) => (
          <mesh key={index} position={node.position as [number, number, number]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial
              color="#0066ff"
              transparent
              opacity={0.6}
            />
          </mesh>
        ))}
      </group>
      
      {/* Neural Connections */}
      <group ref={linesRef}>
        {connections.map((connection, index) => {
          const points = [
            new THREE.Vector3(...connection.start),
            new THREE.Vector3(...connection.end)
          ];
          return (
            <line key={index}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    ...connection.start,
                    ...connection.end
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color="#0066ff"
                transparent
                opacity={0.15}
                linewidth={1}
              />
            </line>
          );
        })}
      </group>
    </group>
  );
}

function DataFlow({ count = 20 }) {
  const meshRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Start positions
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      
      // Velocities for flow effect
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    return { positions, velocities };
  }, [count]);

  useFrame((state) => {
    if (meshRef.current) {
      const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < count; i++) {
        // Update positions with flow
        positions[i * 3] += particles.velocities[i * 3];
        positions[i * 3 + 1] += particles.velocities[i * 3 + 1];
        positions[i * 3 + 2] += particles.velocities[i * 3 + 2];
        
        // Wrap around boundaries
        if (Math.abs(positions[i * 3]) > 20) positions[i * 3] *= -0.8;
        if (Math.abs(positions[i * 3 + 1]) > 15) positions[i * 3 + 1] *= -0.8;
        if (Math.abs(positions[i * 3 + 2]) > 15) positions[i * 3 + 2] *= -0.8;
      }
      
      meshRef.current.geometry.attributes.position.needsUpdate = true;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#00ffff"
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function ParticleField({ count = 800 }) {
  const mesh = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const temp = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      temp.set([
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50
      ], i * 3);
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = state.clock.elapsedTime * 0.05;
      mesh.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.008}
        color="#0066ff"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

function FloatingGeometry({ position, mousePosition }: { position: [number, number, number]; mousePosition: { x: number; y: number } }) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (mesh.current) {
      // Gentle floating animation
      mesh.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.5;
      
      // Mouse interaction
      mesh.current.rotation.x += mousePosition.y * 0.001;
      mesh.current.rotation.y += mousePosition.x * 0.001;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={mesh} position={position}>
        <icosahedronGeometry args={[0.5, 0]} />
        <MeshDistortMaterial
          color="#ffffff"
          transparent
          opacity={0.1}
          distort={0.3}
          speed={2}
          roughness={0.4}
        />
      </mesh>
    </Float>
  );
}

function AIBrain() {
  const brainRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (brainRef.current) {
      brainRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      brainRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
    }
  });

  return (
    <group ref={brainRef} position={[0, 0, -15]}>
      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
        <mesh>
          <torusKnotGeometry args={[3, 1, 100, 16]} />
          <MeshDistortMaterial
            color="#0066ff"
            transparent
            opacity={0.03}
            distort={0.2}
            speed={1}
            roughness={0.1}
          />
        </mesh>
      </Float>
    </group>
  );
}

export default function Scene3D({ mousePosition, currentSection }: Scene3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Camera movement based on mouse
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, mousePosition.x * 2, 0.05);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, mousePosition.y * 2, 0.05);
      
      // Section-based animations
      const targetZ = 8 - currentSection * 1.5;
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Environment */}
      <Environment preset="night" />
      <Stars radius={50} depth={50} count={2000} factor={2} saturation={0} fade />
      
      {/* Neural Network Layer */}
      <NeuralNetwork nodeCount={40} connectionCount={60} />
      
      {/* Data Flow Particles */}
      <DataFlow count={30} />
      
      {/* Background Particle Field */}
      <ParticleField />
      
      {/* AI Brain Visualization */}
      <AIBrain />
      
      {/* Floating Geometries */}
      <FloatingGeometry position={[-8, 2, -5]} mousePosition={mousePosition} />
      <FloatingGeometry position={[8, -2, -3]} mousePosition={mousePosition} />
      <FloatingGeometry position={[0, 4, -8]} mousePosition={mousePosition} />
      <FloatingGeometry position={[-5, -3, -6]} mousePosition={mousePosition} />
      <FloatingGeometry position={[6, 1, -4]} mousePosition={mousePosition} />
      
      {/* Central Distortion Sphere */}
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh position={[0, 0, -10]}>
          <sphereGeometry args={[2, 32, 32]} />
          <MeshDistortMaterial
            color="#0066ff"
            transparent
            opacity={0.05}
            distort={0.4}
            speed={3}
            roughness={0.2}
          />
        </mesh>
      </Float>
      
      {/* Ambient Light */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#0066ff" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#00ffff" />
      <pointLight position={[0, 0, 5]} intensity={0.2} color="#ffffff" />
    </group>
  );
}