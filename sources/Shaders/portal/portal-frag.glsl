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

    float twistStrength = .01;
    float spinSpeed = uTime * -4.0; 
    float angle = (distanceToCenter * twistStrength) + spinSpeed;
    
    vec2 twistedUv = getRotationMatrix(angle) * uvFromCenter;
    vec2 finalSpiralUv = twistedUv + center;

    vec4 noise = texture2D(uTexture, finalSpiralUv);

    float maxRadius = 0.45;
    
    float proceduralVortex = distanceToCenter + (noise.r * 0.22);

    if (proceduralVortex > maxRadius) {
        discard;
    }

    vec3 vortexColor = vec3(0.95, 0.15, 0.22); 

    gl_FragColor = vec4(vortexColor, 1.0);
}