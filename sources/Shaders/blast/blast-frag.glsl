uniform vec3 uColorBright; // White Core
uniform vec3 uColorMid;    // Neon Fire Red/Orange
uniform vec3 uColorDark;   // Black Smog

uniform float uStrength;  
uniform sampler2D uTexture;
uniform float uTime;

varying vec2 vUv;

void main() {
    float noise = texture2D(uTexture, vUv).r;
    
    // Create an aggressive, stepped noise value for sharp cel-shading profiles
    float life = noise * uStrength;

    // Strict, narrow masks to form harsh "cel" bands rather than smooth gradients
    float smokeMask = smoothstep(0.15, 0.25, life);
    float fireMask  = smoothstep(0.45, 0.52, life);
    float coreMask  = smoothstep(0.75, 0.82, life);
    
    // Build up color layers (Default base is transparent background/black)
    vec3 finalColor = uColorDark; // Base Layer: Black Smog
    
    // Mix in the sharp neon colors
    finalColor = mix(finalColor, uColorMid, fireMask);
    finalColor = mix(finalColor, uColorBright, coreMask);

    // Give the fire and core layers a fierce glow boost
    if (fireMask > 0.1) {
        finalColor *= 1.5;
    }

    // High contrast alpha thresholding for crisp, ink-like smoke borders
    float alpha = smoothstep(0.12, 0.2, life) * uStrength;

    gl_FragColor = vec4(finalColor, alpha);
}