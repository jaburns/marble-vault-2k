uniform mat4 g;

float seed;
float shake;
float angle;
float omega;
vec2 pos;

// ====================================================================================================================

vec2 writeFloat(float a)
{
    a = (a + 1.) / 2.;
    return vec2(
        floor(a*255.) / 255.,
        fract(255. * a)
    );
}

float readFloat(vec2 a)
{
    return (a.x/255. + a.y/255./255.) * 2. - 1.;
}

// ====================================================================================================================

float merge(float a, float b)
{
    return -length(min(vec2(a, b), 0.)) + max(min(a, b), 0.);
}

float rand(float x)
{
    return fract(sin(dot(vec2(seed,floor(x)),vec2(11.,79.))) * 4e5);
}

float map(vec2 p)
{
    vec2 p1 = vec2(mod(p.x+.5, 1.)-.5, p.y);

    float challenge = abs(seed/1e3);
    float oa =                      rand(p.x+ .5+9.)*(.9+challenge);
    float a = length( p1 + vec2( 0,              oa                 -.5*challenge)) - .7 - .6*rand(p.x+ .5);
    float b = length( p1 + vec2(-1, rand(p.x+1.5+9.)*(.9+challenge) -.5*challenge)) - .7 - .6*rand(p.x+1.5);
    float c = length( p1 + vec2( 1, rand(p.x- .5+9.)*(.9+challenge) -.5*challenge)) - .7 - .6*rand(p.x- .5);
    
    return seed > 0. && p.y + oa > 0.
        ? -1.
        : min(p.x-.7*p.y-3., merge(merge(a,c),b));
}

vec2 getNorm(vec2 p)
{
    vec2 eps = vec2(1e-4, 0);
    return normalize(vec2(
        map(p - eps.xy) - map(p + eps.xy),
        map(p - eps.yx) - map(p + eps.yx)));
}

// ====================================================================================================================

// From https://www.shadertoy.com/view/XljGzV
// vec3 hsl2rgb(vec3 c)
// {
//     return c.z+c.y*(clamp(abs(mod(c.x*6.+vec3(0,4,2),6.)-3.)-1.,0.,1.)-.5)*(1.-abs(2.*c.z-1.));
// }
vec3 colorFromHue(float x)
{
    return .45 + .51*(
        clamp(
            abs(
                mod( fract(x) * 6. + vec3(0,4,2), 6.) - 3.
            ) - 1.,
            0.,
            1.
        ) - .5
    );
}

vec3 draw(vec2 coord)
{
    coord += 50.
        * exp(.2*shake - 6.) // (-.2 * (30. - shake))
        * vec2(rand(shake), rand(9.+shake));

    vec2 dims = vec2(floor(g[0].x/1e5), mod(g[0].x,1e5));
    vec2 m = (coord - dims * .5) / dims.y;

    float ga = fract(seed*.11);
    float d = length(40.*m - vec2(15));

    vec3 sky = mix(
        vec3(1),
        vec3(.44,.69,1),
        min(
            step(1., d), 
            1.-exp(-.2*d)
        )
    );

// ----- Dusk ----
//  float d = length(40.*m - vec2(-15,7));
//  vec3 sky = mix(
//      vec3(1), 
//      mix(
//          vec3(1,.86,.39),
//          mix(
//              vec3(.13,.16,.31),
//              vec3(.9,.42,.44),
//              1.-2.*m.y
//          ),
//          1.-exp(-.2*d)
//      ),
//      step(1.,d)
//  );
//  // Plus move the light source
//  // Plus change the ball light source
// ---------------

    m.x += g[0].w;
    m *= 3.5;
    m.y -= .9;

    if (length(m-pos) < .06) {
        m -= pos;
        d = max((7.*length(m-vec2(.04))) + .9,0.);
        return (dot(m,vec2(sin(angle),cos(angle))) > 0. ? vec3(1) : colorFromHue(ga+.5)) /d/d;
    } 

    for (float i = 0.; i < 3.; i++) {
        // uv = 1.*m - 0.*vec2(g[0].w-99.,-.2)
        // uv = 2.*m - 3.*vec2(g[0].w-99.,-.1)
        // uv = 4.*m - 8.*vec2(g[0].w-99.,  0)
        vec2 uv = pow(2.,i)*m - (pow(i+1.,2.)-1.) * vec2(g[0].w-99.,.1*i-.2);
        vec2 norm = getNorm(uv);

        d = map(uv);

        if (d > 0.) {
            d *= i > 0. ? .5 : 2.;
            d = min(1., d);
            float r = 1. - sqrt(2.*d - d*d); 

            // Curve the lookup coordinates around the edge of the surface.
            uv += (i > 0. ? 1. : .5)*vec2(-r,r);

            // If we're at the finish line, get the checkerboard color.
            if (i == 0. && uv.x > 19.8*3.5 && uv.x < 20.*3.5) {
                uv = floor(10.*uv);
                return vec3(.2+.8*mod(uv.x + uv.y, 2.));
            }

            // Add some curvature to the stripes.
            uv += .8*sin(.9*uv.yx);

            // Get color of the stripes.
            vec3 stripes = colorFromHue(i == 0. ? ga : ga - .3)
                * (1.-.05*abs(floor(mod(8.*(uv.x+2.-uv.y),4.))-2.))        // Stripe color
                * (.5 + r * (.2 + max(0.,dot(normalize(vec2(1)), norm)))); // Lighting

            return mix(stripes, vec3(.44,.69,1), i*.3);
        }
    }

    return sky;
}

// ====================================================================================================================

void main()
{
    int right   = int(mod(g[0].z     , 2.));
    int down    = int(mod(g[0].z / 2., 2.));
    int boost   = int(mod(g[3].z,      4.));
    int counter = int(mod(g[3].w,      8.));
    shake       =   floor(g[3].w / 8.);
    angle       = 6.28 * g[0].y / 255.;
    omega       = 2. * g[3].y / 255. - 1.;

    vec2 coord = gl_FragCoord.xy;
    vec2 vel = vec2(readFloat(g[2].xy), readFloat(g[2].zw));

    pos = vec2(readFloat(g[1].xy), readFloat(g[1].zw));
    pos.x += g[3].x;
    pos *= 3.5;
    seed = floor(g[0].z / 4.);

// Rendering

    gl_FragColor = vec4(
        (
              draw(coord+.5*vec2(-.75, .25))
            + draw(coord+.5*vec2(-.25,-.75))
            + draw(coord+.5*vec2( .25, .75))
            + draw(coord+.5*vec2( .75,-.25))
        ) / 4.,
        1
    );

// State update

    if (coord.y < 1. && coord.x < 4.)
    {
        vel.y -= .01;
        pos += .05 * vel;

        angle += omega;

        float depth = map(pos);
        vec2 norm = getNorm(pos);
        vec2 tang = vec2(norm.y, -norm.x);
        float dotNormVel = dot(norm, vel);

        if (shake > 0.) shake--;

        if (depth >= -.055) {
            if (dotNormVel < 0.) {
                if (counter > 0) {
                    shake = 30. * min(-dotNormVel, 1.);
                }
                pos += norm * (depth + .055);
                vel = dot(vel, tang) * tang;

                omega = .6 * length(vel) * sign(cross(vec3(vel,0),vec3(norm,0)).z);
            }

            counter = 0;
        } else {
            if (counter < 7 && ++counter == 6) {
                boost = 0;
            }
            if (boost < 2 && down == 1) {
                boost = 2;
                vel.y = -1.;
            }
            if (boost + 1 == right) { // if (boost == 0 && right == 1) {
                boost = 1;
                vel.x += .5 - .5*vel.x;
            }
        }

        pos /= 3.5;
        pos.x -= g[0].w;

        gl_FragColor =
            coord.x < 1. ? vec4(0, fract(angle/6.28), 0, 0) : // g[0]   
            coord.x < 2. ? vec4(writeFloat(pos.x), writeFloat(pos.y)) : // g[1]
            coord.x < 3. ? vec4(writeFloat(vel.x), writeFloat(vel.y)) : // g[2]
                vec4(// g[3]
                    0,
                    (omega+1.)/2.,
                    float(boost)/255.,
                    (float(counter)+8.*shake)/255.
                );
    }
}