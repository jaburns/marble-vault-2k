// ====================================================================================================================
//   JS/GLSL shared state buffer
// ====================================================================================================================
//   array[ 0] : g[0].x : W  : 100000 * canvas width + canvas height
//   array[ 1] : g[0].y : W  : previous camera offset x
//   array[ 2] : g[0].z : W  : key input flags
//   array[ 3] : g[0].w : W  : camera offset x
//   array[ 4] : g[1].x : RW : upper pos.x (relative to camera)
//   array[ 5] : g[1].y : RW : lower pos.x (relative to camera)
//   array[ 6] : g[1].z : RW : upper pos.y (relative to camera)
//   array[ 7] : g[1].w : RW : lower pos.y (relative to camera)
//   array[ 8] : g[2].x : RW : upper vel.x
//   array[ 9] : g[2].y : RW : lower vel.x
//   array[10] : g[2].z : RW : upper vel.y
//   array[11] : g[2].w : RW : lower vel.y
//   array[12] : g[3].x : RW : ball angle
//   array[13] : g[3].y : RW : ball angular velocity
//   array[14] : g[3].z : W  : track number
//   array[15] : g[3].w : RW : jump grace counter
//
uniform mat4 g;

float track; // Track number
float angle; // Rotation of the marble in radians
float omega; // Angular velocity in radians per tick
vec2 pos;    // Position of the marble in world space

// ====================================================================================================================
// == State serialization
// ====================================================================================================================

// Given some float in the range [-1,1), encode it as a two-byte fixed-point number
vec2 writeFloat(float a)
{
    a = (a + 1.) / 2.;
    return vec2(
        floor(a*255.) / 255.,
        fract(255. * a)
    );
}

// Parse a two-byte fixed-point number in to a float in the range [-1,1)
float readFloat(vec2 a)
{
    return (a.x/255. + a.y/255./255.) * 2. - 1.;
}

// ====================================================================================================================
// == Track generation
// ====================================================================================================================

// Merge two signed distances together while smoothing sharp edges in their negative space
float roundMerge(float a, float b)
{
    return -length(min(vec2(a, b), 0.)) + max(min(a, b), 0.);
}

// For every integer x, this gives some pseudorandom value in the range [0,1)
float rand(float x)
{
    return fract(sin(track+13.*floor(x+13.)) * 13.);

//  x = track + 11.*floor(x+11.);
//  x *= 113.527;
//  float triangle
//  return mod(x,2.) > 1. ? fract(x) : 1.-fract(x);

    // x = track + 99.*floor(x);
    // x = fract(x * .1031);
    // x *= x + 33.33;
    // x *= x + x;
    // return fract(x);

    //return fract(sin(dot(vec2(track,floor(x)),vec2(11.,79.))) * 4e5);
}

// Signed distance function for the divot closest to p.x + b. Parameter p is in world space
float divot(vec2 p, float b)
{
    // Pick a random radius for the divot
    float r = .7 + .6*rand(p.x + b);

    // Move in to the local space of the divot, offset vertically by some random amount
    p = vec2(
        abs( mod(p.x+.5,1.) - x ),
        p.y + rand(p.x+b+9.)*track/5. - track/12.
    );

    // Uneven capsule distance function https://www.shadertoy.com/view/4lcBWn
    return dot(p, vec2(.3,.95)) < 0.
        ? length(p) - r
        : dot(p, vec2(.95,-.3)) - r;
}

// Total signed distance function for the world. Parameter p is in world space
float map(vec2 p)
{
    return min(
        // Cliff at the start of the level
        p.x - .7*p.y - 3., 

        // The three closest divots to p
        roundMerge(
            roundMerge(
                divot(p,  .5),
                divot(p, -.5)
            ),
            divot(p, 1.5)
        )
    );
}

// Returns the world normal vector at some world space point p
vec2 getNorm(vec2 p)
{
    vec2 eps = vec2(1e-4, 0);
    return normalize(vec2(
        map(p - eps.xy) - map(p + eps.xy),
        map(p - eps.yx) - map(p + eps.yx)));
}

// ====================================================================================================================
// == Rendering
// ====================================================================================================================

// HSL to RGB function from https://www.shadertoy.com/view/XljGzV with hardcoded saturation and lightness.
vec3 colorFromHue(float h)
{
    return .45 + .51*(
        clamp(
            abs(
                mod( fract(h) * 6. + vec3(0,4,2), 6.) - 3.
            ) - 1.,
            0.,
            1.
        ) - .5
    );
}

// Returns the screen color at the provided pixel coordinates
vec3 draw(vec2 coord)
{
    const vec3 i_PURPLE = vec3(.13,.16,.31);
    const vec3 i_PINK = vec3(.9,.42,.44);
    const vec3 i_YELLOW = vec3(1,.86,.39);
    const vec3 i_BLUE = vec3(.44,.69,1);

    bool dusk = mod(track, 2.) < 1.;

    vec2 dims = vec2(floor(g[0].x/1e5), mod(g[0].x,1e5));
    vec2 m = (coord - dims * .5) / dims.y; // Normalized screen coordinates

    float groundHue = fract(.2+track*.1);
    float d = length(40.*m - (dusk ? vec2(15,7) : vec2(15))); // Scaled distance to the sun
    
    vec3 sky = mix(
        vec3(1),
        mix(
            dusk ? i_YELLOW : vec3(1),
            dusk ? mix(
                i_PURPLE,
                i_PINK,
                1.-2.*m.y
            ) : i_BLUE,
            1.-exp(-.2*d)
        ),
        step(1.,d)
    );

    // Translate to the camera position, and adjust camera scale and offset
    m.x += g[0].y;
    m *= 3.5;
    m.y -= .9;

    // Draw the marble
    if (length(m-pos) < .06) {
        m -= pos;
        d = max((7.*length(m-vec2(.04))) + .9,0.);
        return dot(m, vec2(sin(angle), cos(angle))) > 0. ? vec3(1)/d/d : colorFromHue(groundHue+.5)/d/d;
    } 

    // Draw the three mountain layers from front to back
    for (float i = 0.; i < 3.; i++)
    {
        // uv = 1.*m - 0.*vec2(g[0].w-99.,-.2)
        // uv = 2.*m - 3.*vec2(g[0].w-99.,-.1)
        // uv = 4.*m - 8.*vec2(g[0].w-99.,  0)
        vec2 uv = pow(2.,i)*m - (pow(i+1.,2.)-1.) * vec2(g[0].w-99.,.1*i-.2);
        vec2 norm = getNorm(uv);
        d = map(uv);

        if (d > 0.)
        {
            // Make the edging effect deeper on the background layers
            d *= i == 0. ? 2. : .5;

            d = min(1., d);
            float r = 1. - sqrt(2.*d - d*d); 

            // Curve the lookup coordinates around the edge of the surface
            uv += (i == 0. ? .5 : 1.)*vec2(-r,r);

            // If we're at the finish line, get the checkerboard color
            if (i == 0. && uv.x > 9.8*3.5 && uv.x < 10.*3.5) {
                uv = floor(10.*uv);
                return vec3(.2+.8*mod(uv.x + uv.y, 2.));
            }

            // Add some curvature to the stripes
            uv += .8*sin(.9*uv.yx);

            // Get color of the stripes
            vec3 stripes = colorFromHue(i == 0. ? groundHue : groundHue - .3)
                * (1.-.1*abs(floor(mod(8.*(uv.x+2.-uv.y),4.))-2.))   // Stripe color
                * (.5 + r * (.2 + max(0.,dot(vec2(.8,.6), norm))));   // Lighting

            return mix(i_PURPLE, mix(stripes, i_BLUE, i*.3), dusk ? .6 : 1.);
        }
    }

    return sky;
}

// ====================================================================================================================
// == Entry point and game state update
// ====================================================================================================================

void main()
{
    const float i_KEYS = g[0].z;

    float counter = g[3].w;

    angle = .0246 * g[3].x; // 0.0246 = 2 * pi / 255
    omega = 2. * g[3].y / 255. - 1.;
    track = g[3].z;

    vec2 coord = gl_FragCoord.xy;
    vec2 vel = vec2(readFloat(g[2].xy), readFloat(g[2].zw));

    pos = vec2(readFloat(g[1].xy), readFloat(g[1].zw));
    pos.x += g[0].y;
    pos *= 3.5;

    // Get the screen color for this pixel with 4x MSAA
    gl_FragColor = vec4((
        draw(coord+vec2(-.375, .125))
      + draw(coord+vec2(-.125,-.375))
      + draw(coord+vec2( .125, .375))
      + draw(coord+vec2( .375,-.125))
    ) / 4., 1);

    // If we're in the bottom left, update the game state and write the updated game state pixels
    if (coord.y < 1. && coord.x < 4.)
    {
        vel.y -= .02;
        pos += .05 * vel;
        angle += omega;

        vec2 norm = getNorm(pos);
        vec2 tang = vec2(norm.y, -norm.x);

        if (map(pos) >= -.055) {
            if (dot(norm, vel) < 0.) {
                pos += norm * (map(pos) + .055);
                vel = dot(vel, tang) * tang;
                omega = .6 * length(vel) * sign(vel.x*norm.y - vel.y*norm.x);
            }
            counter = 0.;
        } else {
            if (i_KEYS > 1.) {
                vel.y = -1.;
                omega = 0.;
            }
            if (counter < 7.) counter++;
        }

        if (counter < 7. && mod(i_KEYS, 2.) > 0.) {
            counter = 7.;
            vel.y = max(.5,vel.y+.5);
        }

        pos /= 3.5;
        pos.x -= g[0].w;

        gl_FragColor =
            coord.x < 2. ? vec4(writeFloat(pos.x), writeFloat(pos.y)) : // g[1]
            coord.x < 3. ? vec4(writeFloat(vel.x), writeFloat(vel.y)) : // g[2]
            vec4(  // g[3]
                fract(angle/6.28),
                (omega+1.)/2.,
                0,
                counter/255.
            );
    }
}