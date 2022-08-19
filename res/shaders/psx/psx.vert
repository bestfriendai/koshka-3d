precision mediump float;

#include <common>
#include <fog_pars_vertex>
#include <lights_pars_begin>
#include <skinning_pars_vertex>

/*
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
*/

uniform float uTime;
uniform float uRepeat;
uniform vec2 uResolution;

varying vec2 vUV;
varying vec3 vDiffuse;
    
vec4 gteRound(in vec4 v) {
    
    vec4 pixelSpace = v;
    pixelSpace.xy = round(v.xy * uResolution.y) / uResolution.y;

    return pixelSpace;
      
}

#if NUM_DIR_LIGHTS > 0
float gouraud(DirectionalLight light, vec3 geomNormal) {

    vec3 eyeSpaceNormal = normalize((modelViewMatrix * vec4(geomNormal, 0.0)).xyz);
    vec3 lightNormal = normalize((viewMatrix * vec4(light.direction, 0.0)).xyz);

    return dot(eyeSpaceNormal, lightNormal);
    
}
#endif

void main() {
    
    #include <beginnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    #include <begin_vertex>
    #include <skinning_vertex>

    vUV = uv * uRepeat;
      
    vec4 mvPosition  = modelMatrix * vec4(transformed, 1.0);
    mvPosition = gteRound(mvPosition);
    mvPosition = viewMatrix * mvPosition;
    mvPosition = gteRound(mvPosition);
    
    const float multiplier = 0.5;
      
    vDiffuse = vec3(0.0);

#if NUM_DIR_LIGHTS > 0
#pragma unroll_loop_start
    for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
        vDiffuse += gouraud(directionalLights[i], normal) * directionalLights[i].color * multiplier;
    }
#pragma unroll_loop_end
#endif

    #include <fog_vertex>

    vec4 screenSpacePos = gteRound(projectionMatrix * mvPosition);
      
#if AFFINE_MAPPING
    screenSpacePos /= abs(screenSpacePos.w);
#endif

    gl_Position = screenSpacePos;
}
    