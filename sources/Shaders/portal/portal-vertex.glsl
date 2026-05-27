uniform float uTime;
uniform sampler2D uTexture;

varying vec2 vUv;
varying vec2 vAnimatedUv;

mat2 getRotationMatrix(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

void main() {
    vUv = uv;

    vec2 centeredUv = uv - 0.5;
    float textureSpinSpeed = uTime * 0.4; 
    centeredUv = getRotationMatrix(textureSpinSpeed) * centeredUv;
    vAnimatedUv = centeredUv + 0.5;

    vec3 transformedPosition = position;

    vec4 noise = texture2D(uTexture, vAnimatedUv);

    float baseRotation = uTime * 0.6; 
    
    float distanceToCenter = length(position.xy);
    float vortexTwist = (1.0 - distanceToCenter) * 10.0; 
    
    float noiseWobble = noise.r * 1.5;

    float finalAngle = baseRotation + vortexTwist + noiseWobble;
    
    transformedPosition.xy = getRotationMatrix(finalAngle) * transformedPosition.xy;

    vec4 modelPosition = modelMatrix * vec4(transformedPosition, 1.0);
    gl_Position = projectionMatrix * viewMatrix * modelPosition;
}