precision mediump float;

#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <fog_fragment>

uniform sampler2D uTexture;
uniform float uTime;
uniform int uTextureDepth;
uniform vec3 ambientLightColor;

varying vec3 vDiffuse;
varying vec2 vUV;

const mat4 ditherMatrix = transpose(mat4(
    -4, +0, -3, +1,
    +2, -2, +3, -1,
    -3, +1, -4, +0,
    +3, -1, +2, -2
));

vec4 dither(in vec4 color) {
    ivec2 patternIDX = ivec2(mod(gl_FragCoord.xy, vec2(4.0, 4.0)));
    
#if DITHERING
    float offset = float(ditherMatrix[patternIDX.x][patternIDX.y]);
#else
    float offset = 0.;
#endif
        
    vec3 color24BPP = vec3(round(color.rgb * 255.0));
    color24BPP = clamp(color24BPP + offset, 0.0, 255.0);
    
    vec3 colorTrunc = trunc(color24BPP / 8.0);
    
    return vec4(colorTrunc.rgb / 31.0, color.a);
    
}

vec4 sRGBToLinear( in vec4 value ) {
    return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}

void main() {
    // vec2 mapSize = vec2(textureSize(uTexture, 0));
    // vec4 texel = texelFetch(uTexture, ivec2(vUV * mapSize), 0);
    vec4 texel = texture2D(uTexture, vUV);
    
#if QUANTIZE_TEXTURES
    texel = round(texel * pow(2.0, float(uTextureDepth))) / pow(2.0, float(uTextureDepth));
#endif
        
    vec4 lightColor = vec4(vDiffuse + max(ambientLightColor, 0.0), 1.0);
    
    vec4 textureColor = texel * lightColor;
    // textureColor = sRGBToLinear(textureColor);
      
    gl_FragColor = dither(textureColor);
    
}