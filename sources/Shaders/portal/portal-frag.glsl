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

    float maxRadius = 0.45;
    float proceduralVortex = distanceToCenter + (noise.r * 0.22);

    if (proceduralVortex > maxRadius) {
        discard;
    }

    float edgeThickness = 0.05; 
    
    float edgeMask = step(maxRadius - edgeThickness, proceduralVortex);

    vec3 yellowColor = vec3(1.0, 1.0, 1.0); 
    vec3 blackColor  = vec3(0.0, 0.0, 1.0); 

    vec3 vortexColor = mix(blackColor, yellowColor, edgeMask);

    gl_FragColor = vec4(vortexColor, 1.0);
}