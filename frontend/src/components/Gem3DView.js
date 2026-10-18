import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const HTML = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <style>
      html, body { margin: 0; padding: 0; height: 100%; background: #0b1020; overflow: hidden; }
      canvas { display: block; }
    </style>
  </head>
  <body>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script>
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 0, 4.2);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);

      const geometry = new THREE.OctahedronGeometry(1.35, 0);
      const material = new THREE.MeshStandardMaterial({
        color: 0x5aa9ff,
        metalness: 0.15,
        roughness: 0.18,
        flatShading: true,
      });
      const gem = new THREE.Mesh(geometry, material);
      scene.add(gem);

      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })
      );
      gem.add(wire);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
      keyLight.position.set(2.5, 3, 2.5);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.8);
      rimLight.position.set(-2.5, -1, -2);
      scene.add(rimLight);

      const ambient = new THREE.AmbientLight(0x334155, 0.9);
      scene.add(ambient);

      function animate() {
        requestAnimationFrame(animate);
        gem.rotation.x += 0.004;
        gem.rotation.y += 0.008;
        renderer.render(scene, camera);
      }
      animate();

      window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
    </script>
  </body>
</html>
`;

export default function Gem3DView({ style }) {
  if (Platform.OS === 'web') {
    return (
      <iframe
        title="gem-3d"
        srcDoc={HTML}
        style={{ border: '0', width: '100%', height: '100%', ...style }}
      />
    );
  }
  return <WebView source={{ html: HTML }} style={[styles.webview, style]} />;
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
