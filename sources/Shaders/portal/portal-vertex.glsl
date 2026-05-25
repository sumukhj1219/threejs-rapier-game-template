uniform float uTime;
uniform sampler2D uTexture;

varying vec2 vUv;
varying vec2 vAnimatedUv; // Pass this to the fragment shader

mat2 getRotationMatrix(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

void main() {
    vUv = uv;

    float flowSpeed = uTime * 0.02;
    vec2 movingUv = uv + vec2(flowSpeed, flowSpeed);
    
    vAnimatedUv = movingUv * uTime * 0.02; 
    
    vec4 noise = texture2D(uTexture, vAnimatedUv);

    vec3 transformedPosition = position;

    float globalRotation = uTime * 0.2; 
    transformedPosition.xy = getRotationMatrix(globalRotation) * transformedPosition.xy;

    float twistAngle = noise.r * 10.0;
    transformedPosition.xy = getRotationMatrix(twistAngle) * transformedPosition.xy;

    vec4 modelPosition = modelMatrix * vec4(transformedPosition, 1.0);
    gl_Position = projectionMatrix * viewMatrix * modelPosition;
}