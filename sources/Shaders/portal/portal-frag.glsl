uniform float uTime;
uniform sampler2D uTexture;

varying vec2 vUv;

mat2 getRotationMatrix(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

void main() {
    vec2 center = vec2(0.5, 0.5);
    vec2 uvFromCenter = vUv - center;
    float distanceToCenter = length(uvFromCenter);

    float twistStrength = 2.0; 
    float spinSpeed = uTime * -1.0; 
    float angle = (distanceToCenter * twistStrength) + spinSpeed;
    
    vec2 twistedUv = getRotationMatrix(angle) * uvFromCenter;
    vec2 finalSpiralUv = twistedUv + center;

    vec4 noise = texture2D(uTexture, finalSpiralUv);

    float maxRadius = 0.38;
    float proceduralVortex = distanceToCenter + (noise.r * 0.18);

    float innerMask = smoothstep(maxRadius - 0.04, maxRadius - 0.08, proceduralVortex);
    
    float coreBeamMask = smoothstep(maxRadius, maxRadius - 0.04, proceduralVortex);
    
    float glowGlowFalloff = 0.12; 
    float outerGlowMask = smoothstep(maxRadius + glowGlowFalloff, maxRadius - 0.02, proceduralVortex);

    float pulse = 1.0 + (sin(uTime * 8.0) * 0.15);

    vec3 innerColor = vec3(0.1, 0.1, 0.15); 
    
    vec3 coreWhiteBeam = vec3(0.8, 0.7, 0.85); 
    
    vec3 glowAuraColor = vec3(0.7, 0.65, 0.75); 

    vec3 finalRGB = mix(glowAuraColor * outerGlowMask * 2.5 * pulse, coreWhiteBeam * 4.0, coreBeamMask);
    finalRGB = mix(finalRGB, innerColor, innerMask);

    float finalAlpha = outerGlowMask;

    gl_FragColor = vec4(finalRGB, finalAlpha);
}